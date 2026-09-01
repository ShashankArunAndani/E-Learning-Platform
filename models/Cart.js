const db = require('../config/db');

class Cart {
  /**
   * Lazily find or create a Cart for a user
   * @param {number} userId
   */
  static async getOrCreateCart(userId) {
    const existing = await db.query(
      `SELECT cart_id FROM Cart WHERE user_id = ?`,
      [userId]
    );

    if (existing.length > 0) {
      return existing[0].cart_id;
    }

    const result = await db.query(
      `INSERT INTO Cart (user_id) VALUES (?)`,
      [userId]
    );
    return result.insertId;
  }

  /**
   * Add course item to user's cart
   * @param {number} userId
   * @param {number} courseId
   */
  static async addItem(userId, courseId) {
    const cartId = await Cart.getOrCreateCart(userId);

    try {
      const result = await db.query(
        `INSERT INTO Cart_Items (cart_id, course_id) VALUES (?, ?)`,
        [cartId, courseId]
      );
      return { success: true, cart_item_id: result.insertId };
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'This course is already in your cart.' };
      }
      throw err;
    }
  }

  /**
   * Remove course item from user's cart
   * @param {number} userId
   * @param {number} courseId
   */
  static async removeItem(userId, courseId) {
    const cartId = await Cart.getOrCreateCart(userId);
    return await db.query(
      `DELETE FROM Cart_Items WHERE cart_id = ? AND course_id = ?`,
      [cartId, courseId]
    );
  }

  /**
   * Fetch complete cart summary for user (items, price, subtotal)
   * @param {number} userId
   */
  static async getCartSummary(userId) {
    const cartId = await Cart.getOrCreateCart(userId);

    const items = await db.query(
      `SELECT ci.cart_item_id, ci.cart_id, ci.course_id, ci.added_at,
              c.title, c.description, c.price, c.level, c.status,
              u.name AS instructor_name
       FROM Cart_Items ci
       INNER JOIN Courses c ON ci.course_id = c.course_id
       INNER JOIN Users u ON c.instructor_id = u.user_id
       WHERE ci.cart_id = ?
       ORDER BY ci.added_at DESC`,
      [cartId]
    );

    let subtotal = 0;
    items.forEach(item => {
      subtotal += parseFloat(item.price);
    });

    return {
      cart_id: cartId,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      item_count: items.length
    };
  }

  /**
   * Clear all items from a cart
   * @param {number} cartId
   * @param {Object} [connection]
   */
  static async clearCart(cartId, connection = null) {
    const sql = `DELETE FROM Cart_Items WHERE cart_id = ?`;
    if (connection) {
      return await connection.execute(sql, [cartId]);
    }
    return await db.query(sql, [cartId]);
  }
}

module.exports = Cart;
