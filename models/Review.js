const db = require('../config/db');

class Review {
  static async create(userId, courseId, rating, comment) {
    const enrolledRows = await db.query(
      `SELECT enrollment_id
       FROM Enrollments
       WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );

    if (enrolledRows.length === 0) {
      const error = new Error('Only enrolled students can review this course.');
      error.status = 403;
      throw error;
    }

    try {
      await db.query(
        `INSERT INTO Reviews (user_id, course_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [userId, courseId, rating, comment || null]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const duplicateError = new Error('You have already reviewed this course.');
        duplicateError.status = 409;
        throw duplicateError;
      }
      throw error;
    }
  }

  static async findByUserAndCourse(userId, courseId) {
    const rows = await db.query(
      `SELECT review_id, user_id, course_id, rating, comment, created_at
       FROM Reviews
       WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByCourse(courseId) {
    return await db.query(
      `SELECT r.review_id, r.user_id, r.course_id, r.rating, r.comment, r.created_at,
              u.name AS reviewer_name
       FROM Reviews r
       INNER JOIN Users u ON r.user_id = u.user_id
       WHERE r.course_id = ?
       ORDER BY r.created_at DESC`,
      [courseId]
    );
  }

  static async getSummary(courseId) {
    const rows = await db.query(
      `SELECT COUNT(review_id) AS review_count,
              COALESCE(AVG(rating), 0) AS average_rating
       FROM Reviews
       WHERE course_id = ?`,
      [courseId]
    );
    return rows[0] || { review_count: 0, average_rating: 0 };
  }
}

module.exports = Review;
