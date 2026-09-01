const db = require('../config/db');

class Enrollment {
  /**
   * Check if user is enrolled in a course
   * @param {number} userId
   * @param {number} courseId
   * @returns {Promise<boolean>}
   */
  static async isEnrolled(userId, courseId) {
    if (!userId) return false;
    const rows = await db.query(
      `SELECT enrollment_id FROM Enrollments WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    return rows.length > 0;
  }

  /**
   * Get all enrollments for a student
   * @param {number} userId
   */
  static async getUserEnrollments(userId) {
    return await db.query(
      `SELECT e.enrollment_id, e.user_id, e.course_id, e.enrollment_date, e.completion_status, e.progress_percentage,
              c.title AS course_title, c.description AS course_description, c.level,
              u.name AS instructor_name,
              p.completed_lessons, p.total_lessons, p.last_accessed_lesson
       FROM Enrollments e
       INNER JOIN Courses c ON e.course_id = c.course_id
       INNER JOIN Users u ON c.instructor_id = u.user_id
       LEFT JOIN Progress p ON (e.user_id = p.user_id AND e.course_id = p.course_id)
       WHERE e.user_id = ?
       ORDER BY e.enrollment_date DESC`,
      [userId]
    );
  }
}

module.exports = Enrollment;
