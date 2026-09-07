const db = require('../config/db');
const InstructorProfile = require('./InstructorProfile');
const Role = require('./Role');

class User {
  /**
   * Find user by email (joins Roles for role_name)
   * @param {string} email
   */
  static async findByEmail(email) {
    const rows = await db.query(
      `SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, r.role_name, u.phone, u.status, u.created_at
       FROM Users u
       INNER JOIN Roles r ON u.role_id = r.role_id
       WHERE u.email = ?`,
      [email]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find user by ID (joins Roles for role_name)
   * @param {number} userId
   */
  static async findById(userId) {
    const rows = await db.query(
      `SELECT u.user_id, u.name, u.email, u.role_id, r.role_name, u.phone, u.status, u.created_at
       FROM Users u
       INNER JOIN Roles r ON u.role_id = r.role_id
       WHERE u.user_id = ?`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new student user
   * @param {Object} userData - { name, email, passwordHash, phone }
   */
  static async createStudent(userData) {
    const { name, email, passwordHash, phone = null } = userData;
    const studentRole = await Role.getRoleByName('Student');
    if (!studentRole) {
      throw new Error('Student role not found in database.');
    }

    const result = await db.query(
      `INSERT INTO Users (name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`,
      [name, email, passwordHash, studentRole.role_id, phone]
    );

    return result.insertId;
  }

  /**
   * Create a new instructor user + Instructor_Profile row in a single transaction
   * @param {Object} userData - { name, email, passwordHash, phone, bio, expertise, experienceYears }
   */
  static async createInstructor(userData) {
    const { name, email, passwordHash, phone = null, bio = null, expertise = null, experienceYears = 0 } = userData;

    const instructorRole = await Role.getRoleByName('Instructor');
    if (!instructorRole) {
      throw new Error('Instructor role not found in database.');
    }

    return await db.withTransaction(async (connection) => {
      // 1. Insert into Users
      const [userResult] = await connection.execute(
        `INSERT INTO Users (name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, 'active')`,
        [name, email, passwordHash, instructorRole.role_id, phone]
      );
      const userId = userResult.insertId;

      // 2. Insert into Instructor_Profile
      await InstructorProfile.create(userId, { bio, expertise, experienceYears }, connection);

      return userId;
    });
  }

  /**
   * Fetch all users across the platform (joins Roles for role_name)
   */
  static async findAllUsers() {
    return await db.query(
      `SELECT u.user_id, u.name, u.email, u.phone, u.status, u.created_at, r.role_name
       FROM Users u
       INNER JOIN Roles r ON u.role_id = r.role_id
       ORDER BY u.created_at DESC`
    );
  }

  /**
   * Update user status ('active', 'inactive', 'banned')
   * @param {number} userId
   * @param {string} status
   */
  static async updateStatus(userId, status) {
    return await db.query(
      `UPDATE Users SET status = ? WHERE user_id = ?`,
      [status, userId]
    );
  }
}

module.exports = User;
