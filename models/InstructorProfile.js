const db = require('../config/db');

class InstructorProfile {
  /**
   * Create instructor profile
   * @param {number} instructorId - Corresponds to user_id
   * @param {Object} profileData - { bio, expertise, experience_years }
   * @param {Object} [connection] - Optional db connection for transaction
   */
  static async create(instructorId, profileData = {}, connection = null) {
    const { bio = null, expertise = null, experienceYears = 0 } = profileData;
    const sql = `INSERT INTO Instructor_Profile (instructor_id, bio, expertise, experience_years, rating) VALUES (?, ?, ?, ?, 0)`;
    const params = [instructorId, bio, expertise, experienceYears];

    if (connection) {
      const [result] = await connection.execute(sql, params);
      return result;
    }
    return await db.query(sql, params);
  }

  /**
   * Find profile by instructor ID (user_id)
   * @param {number} instructorId
   */
  static async getByInstructorId(instructorId) {
    const rows = await db.query(
      `SELECT instructor_id, bio, expertise, experience_years, rating FROM Instructor_Profile WHERE instructor_id = ?`,
      [instructorId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update instructor profile
   * @param {number} instructorId
   * @param {Object} data - { bio, expertise, experienceYears }
   */
  static async update(instructorId, data) {
    const { bio, expertise, experienceYears } = data;
    return await db.query(
      `UPDATE Instructor_Profile 
       SET bio = ?, expertise = ?, experience_years = ? 
       WHERE instructor_id = ?`,
      [bio, expertise, experienceYears, instructorId]
    );
  }
}

module.exports = InstructorProfile;
