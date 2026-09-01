const db = require('../config/db');

class Lesson {
  /**
   * Find all lessons for a course ordered by order_index
   * @param {number} courseId
   */
  static async findByCourseId(courseId) {
    return await db.query(
      `SELECT lesson_id, course_id, title, content_type, content_url, duration, order_index
       FROM Lessons
       WHERE course_id = ?
       ORDER BY order_index ASC`,
      [courseId]
    );
  }

  /**
   * Find single lesson by ID
   * @param {number} lessonId
   */
  static async findById(lessonId) {
    const rows = await db.query(
      `SELECT lesson_id, course_id, title, content_type, content_url, duration, order_index
       FROM Lessons
       WHERE lesson_id = ?`,
      [lessonId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create a new lesson
   * @param {Object} data - { course_id, title, content_type, content_url, duration, order_index }
   */
  static async create(data) {
    const { course_id, title, content_type, content_url, duration = null, order_index } = data;
    const result = await db.query(
      `INSERT INTO Lessons (course_id, title, content_type, content_url, duration, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [course_id, title, content_type, content_url, duration, order_index]
    );
    return result.insertId;
  }

  /**
   * Update an existing lesson
   * @param {number} lessonId
   * @param {Object} data - { title, content_type, content_url, duration, order_index }
   */
  static async update(lessonId, data) {
    const { title, content_type, content_url, duration = null, order_index } = data;
    return await db.query(
      `UPDATE Lessons
       SET title = ?, content_type = ?, content_url = ?, duration = ?, order_index = ?
       WHERE lesson_id = ?`,
      [title, content_type, content_url, duration, order_index, lessonId]
    );
  }

  /**
   * Delete lesson
   * @param {number} lessonId
   */
  static async delete(lessonId) {
    return await db.query(`DELETE FROM Lessons WHERE lesson_id = ?`, [lessonId]);
  }

  /**
   * Get next available order_index for a course
   * @param {number} courseId
   */
  static async getNextOrderIndex(courseId) {
    const rows = await db.query(
      `SELECT MAX(order_index) AS max_order FROM Lessons WHERE course_id = ?`,
      [courseId]
    );
    const maxOrder = rows[0].max_order;
    return maxOrder !== null && maxOrder !== undefined ? maxOrder + 1 : 1;
  }
}

module.exports = Lesson;
