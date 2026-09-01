const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function initDatabase() {
  console.log('Initializing E-Learning Platform Database...');

  // 1. Connect to MySQL server (without selecting DB initially)
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    const dbName = process.env.DB_NAME || 'e_learning_platform';
    console.log(`Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${dbName}\`;`);

    // 2. Read and execute e_learning_platform_schema.sql
    const schemaPath = path.join(__dirname, '..', 'SCHEMA', 'e_learning_platform_schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('Reading schema SQL file...');
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      console.log('Executing database schema script...');
      await connection.query(sqlContent);
      console.log('Schema tables created successfully.');
    } else {
      console.error(`Schema file not found at ${schemaPath}`);
    }

    // 3. Seed Roles
    console.log('Seeding initial Roles...');
    const roles = ['Admin', 'Instructor', 'Student'];
    for (const roleName of roles) {
      await connection.execute(
        `INSERT INTO Roles (role_name) VALUES (?) ON DUPLICATE KEY UPDATE role_name = VALUES(role_name)`,
        [roleName]
      );
    }

    // Get Role IDs
    const [roleRows] = await connection.execute(`SELECT role_id, role_name FROM Roles`);
    const roleMap = {};
    roleRows.forEach(r => { roleMap[r.role_name] = r.role_id; });

    // 4. Seed Permissions
    console.log('Seeding Permissions...');
    const permissions = [
      'course:browse',
      'course:create',
      'course:edit',
      'course:delete',
      'course:publish',
      'category:manage',
      'coupon:manage',
      'user:manage',
      'assignment:submit',
      'assignment:grade',
      'certificate:view'
    ];

    for (const permName of permissions) {
      await connection.execute(
        `INSERT INTO Permissions (permission_name) VALUES (?) ON DUPLICATE KEY UPDATE permission_name = VALUES(permission_name)`,
        [permName]
      );
    }

    const [permRows] = await connection.execute(`SELECT permission_id, permission_name FROM Permissions`);
    const permMap = {};
    permRows.forEach(p => { permMap[p.permission_name] = p.permission_id; });

    // 5. Seed Role_Permissions
    console.log('Seeding Role_Permissions mapping...');
    const rolePermissionMappings = {
      'Admin': permissions,
      'Instructor': [
        'course:browse',
        'course:create',
        'course:edit',
        'course:delete',
        'course:publish',
        'assignment:grade',
        'certificate:view'
      ],
      'Student': [
        'course:browse',
        'assignment:submit',
        'certificate:view'
      ]
    };

    for (const [roleName, permList] of Object.entries(rolePermissionMappings)) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;

      for (const permName of permList) {
        const permId = permMap[permName];
        if (!permId) continue;

        await connection.execute(
          `INSERT INTO Role_Permissions (role_id, permission_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = VALUES(role_id)`,
          [roleId, permId]
        );
      }
    }

    // 6. Seed Default Admin User if no Admin exists
    const adminRoleId = roleMap['Admin'];
    const [existingAdmins] = await connection.execute(
      `SELECT user_id FROM Users WHERE role_id = ?`,
      [adminRoleId]
    );

    if (existingAdmins.length === 0) {
      console.log('Seeding default Admin user...');
      const adminPasswordHash = await bcrypt.hash('Admin@123456', 10);
      await connection.execute(
        `INSERT INTO Users (name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['System Admin', 'admin@elearning.com', adminPasswordHash, adminRoleId, '1234567890', 'active']
      );
      console.log('Default Admin user created: admin@elearning.com / Admin@123456');
    }

    console.log('Database initialization & seeding complete!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
