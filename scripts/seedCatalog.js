const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedCatalog() {
  console.log('Seeding Course Catalog Data...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'e_learning_platform',
    multipleStatements: true
  });

  try {
    // 1. Seed Categories
    console.log('Seeding Categories...');
    const categories = [
      { name: 'Computer Science', desc: 'Algorithms, data structures, and computer theory.' },
      { name: 'Web Development', desc: 'Full-stack web application development with Node.js, Express, and EJS.' },
      { name: 'Data Science', desc: 'Data analytics, machine learning, and statistical modelling.' },
      { name: 'Cybersecurity', desc: 'Network security, ethical hacking, and information security policy.' }
    ];

    for (const cat of categories) {
      await connection.execute(
        `INSERT INTO Categories (category_name, description) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE description = VALUES(description)`,
        [cat.name, cat.desc]
      );
    }

    const [catRows] = await connection.execute(`SELECT category_id, category_name FROM Categories`);
    const catMap = {};
    catRows.forEach(c => { catMap[c.category_name] = c.category_id; });

    // 2. Ensure an Instructor user exists
    console.log('Ensuring Instructor user exists...');
    const [instRoleRows] = await connection.execute(`SELECT role_id FROM Roles WHERE role_name = 'Instructor'`);
    if (instRoleRows.length === 0) {
      throw new Error('Instructor role missing in database.');
    }
    const instructorRoleId = instRoleRows[0].role_id;

    const [instUserRows] = await connection.execute(`SELECT user_id FROM Users WHERE role_id = ?`, [instructorRoleId]);
    let instructorId;

    if (instUserRows.length > 0) {
      instructorId = instUserRows[0].user_id;
    } else {
      const passwordHash = await bcrypt.hash('Instructor@123456', 10);
      const [newInst] = await connection.execute(
        `INSERT INTO Users (name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`,
        ['Dr. Alex Morgan', 'alex.morgan@elearning.com', passwordHash, instructorRoleId, '9876543210']
      );
      instructorId = newInst.insertId;

      await connection.execute(
        `INSERT INTO Instructor_Profile (instructor_id, bio, expertise, experience_years, rating) VALUES (?, ?, ?, ?, ?)`,
        [instructorId, 'Senior Professor of Computer Science with 12 years of industry experience in scalable web systems.', 'Web Architecture & Distributed Systems', 12, 4.9]
      );
      console.log('Sample Instructor created: alex.morgan@elearning.com / Instructor@123456');
    }

    // 3. Seed Sample Published Courses
    console.log('Seeding Sample Courses...');
    const sampleCourses = [
      {
        title: 'Full-Stack Web Architecture with Node.js & Express',
        description: 'Master server-side engineering, database connection pooling, RESTful API design, session security, and dynamic EJS template rendering.',
        price: 49.99,
        duration: 180,
        level: 'intermediate',
        status: 'published',
        categories: ['Web Development', 'Computer Science'],
        lessons: [
          { title: '1. Course Overview & Stack Architecture', type: 'video', url: 'https://cdn.example.com/videos/lesson1.mp4', duration: 20 },
          { title: '2. Express Routing & Middleware Pipeline', type: 'video', url: 'https://cdn.example.com/videos/lesson2.mp4', duration: 35 },
          { title: '3. Relational Data Modeling & MySQL Pools', type: 'document', url: 'https://cdn.example.com/docs/mysql-pooling.pdf', duration: 45 },
          { title: '4. Authentication, BCrypt & RBAC Enforcement', type: 'video', url: 'https://cdn.example.com/videos/lesson4.mp4', duration: 80 }
        ]
      },
      {
        title: 'Data Structures & Algorithms in Practice',
        description: 'A rigorous foundation in arrays, linked lists, trees, graphs, dynamic programming, and asymptotic computational analysis.',
        price: 29.99,
        duration: 240,
        level: 'beginner',
        status: 'published',
        categories: ['Computer Science'],
        lessons: [
          { title: '1. Big-O Asymptotic Notation', type: 'document', url: 'https://cdn.example.com/docs/big-o.pdf', duration: 30 },
          { title: '2. Arrays vs Linked Lists', type: 'video', url: 'https://cdn.example.com/videos/dsa2.mp4', duration: 50 },
          { title: '3. Binary Search Trees & Traversal', type: 'video', url: 'https://cdn.example.com/videos/dsa3.mp4', duration: 60 }
        ]
      },
      {
        title: 'Advanced Applied Cybersecurity Policy',
        description: 'Learn system hardening, vulnerability assessments, penetration testing principles, and regulatory compliance standards.',
        price: 79.99,
        duration: 150,
        level: 'advanced',
        status: 'published',
        categories: ['Cybersecurity'],
        lessons: [
          { title: '1. Threat Modeling & Attack Vectors', type: 'video', url: 'https://cdn.example.com/videos/sec1.mp4', duration: 40 },
          { title: '2. Cryptographic Protocols & TLS 1.3', type: 'document', url: 'https://cdn.example.com/docs/crypto.pdf', duration: 50 }
        ]
      }
    ];

    for (const courseData of sampleCourses) {
      // Check if course already exists
      const [existingCourse] = await connection.execute(`SELECT course_id FROM Courses WHERE title = ?`, [courseData.title]);
      let courseId;

      if (existingCourse.length > 0) {
        courseId = existingCourse[0].course_id;
      } else {
        const [cResult] = await connection.execute(
          `INSERT INTO Courses (title, description, instructor_id, price, duration, level, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [courseData.title, courseData.description, instructorId, courseData.price, courseData.duration, courseData.level, courseData.status]
        );
        courseId = cResult.insertId;

        // Associate categories
        for (const catName of courseData.categories) {
          const catId = catMap[catName];
          if (catId) {
            await connection.execute(
              `INSERT INTO Course_Category (course_id, category_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE course_id = VALUES(course_id)`,
              [courseId, catId]
            );
          }
        }

        // Add lessons
        let orderIndex = 1;
        for (const les of courseData.lessons) {
          await connection.execute(
            `INSERT INTO Lessons (course_id, title, content_type, content_url, duration, order_index)
             VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)`,
            [courseId, les.title, les.type, les.url, les.duration, orderIndex++]
          );
        }
      }
    }

    console.log('Course catalog seeded successfully!');
  } catch (error) {
    console.error('Error seeding catalog:', error);
  } finally {
    await connection.end();
  }
}

seedCatalog();
