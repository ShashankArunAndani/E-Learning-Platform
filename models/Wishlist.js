const db = require('../config/db');

class Wishlist {
  /**
   * Add course to user's wishlist
   * @param {number} userId
   * @param {number} courseId
   */
  static async add(userId, courseId) {
    try {
      const result = await db.query(
        `INSERT INTO Wishlist (user_id, course_id) VALUES (?, ?)`,
        [userId, courseId]
      );
      return result.insertId;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return null; // Already in wishlist
      }
      throw err;
    }
  }

  /**
   * Remove course from user's wishlist
   * @param {number} userId
   * @param {number} courseId
   */
  static async remove(userId, courseId) {
    return await db.query(
      `DELETE FROM Wishlist WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
  }

  /**
   * Fetch all wishlisted courses for a user
   * @param {number} userId
   */
  static async getUserWishlist(userId) {
    return await db.query(
      `SELECT w.wishlist_id, w.added_at, c.course_id, c.title, c.description, c.price, c.level, c.status,
              u.name AS instructor_name
       FROM Wishlist w
       INNER JOIN Courses c ON w.course_id = c.course_id
       INNER JOIN Users u ON c.instructor_id = u.user_id
       WHERE w.user_id = ?
       ORDER BY w.added_at DESC`,
      [userId]
    );
  }

  /**
   * Check if course is in user's wishlist
   * @param {number} userId
   * @param {number} courseId
   * @returns {Promise<boolean>}
   */
  static async isWishlisted(userId, courseId) {
    if (!userId) return false;
    const rows = await db.query(
      `SELECT wishlist_id FROM Wishlist WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    return rows.length > 0;
  }
}

module.exports = Wishlist;
