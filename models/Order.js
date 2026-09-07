const db = require('../config/db');
const Cart = require('./Cart');
const Coupon = require('./Coupon');

class Order {
  /**
   * Create an Order from cart items inside a database transaction
   * @param {Object} data - { userId, couponId, subtotalAmount, discountAmount, totalAmount, cartId, items }
   */
  static async createOrderFromCart(data) {
    const { userId, couponId = null, subtotalAmount, discountAmount = 0, totalAmount, cartId, items } = data;

    return await db.withTransaction(async (connection) => {
      // 1. Insert into Orders (status = 'pending')
      const [orderResult] = await connection.execute(
        `INSERT INTO Orders (user_id, coupon_id, subtotal_amount, discount_amount, total_amount, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, couponId, subtotalAmount, discountAmount, totalAmount]
      );
      const orderId = orderResult.insertId;

      // 2. Insert into Order_Items with locked price_at_purchase
      for (const item of items) {
        await connection.execute(
          `INSERT INTO Order_Items (order_id, course_id, price_at_purchase)
           VALUES (?, ?, ?)`,
          [orderId, item.course_id, item.price]
        );
      }

      // 3. Clear Cart_Items
      await Cart.clearCart(cartId, connection);

      // 4. Increment Coupon times_used if coupon was applied
      if (couponId) {
        await Coupon.incrementUsage(couponId, connection);
      }

      return orderId;
    });
  }

  /**
   * Find order by ID with items, course titles, coupon details, and payment attempts
   * @param {number} orderId
   */
  static async findById(orderId) {
    const orders = await db.query(
      `SELECT o.order_id, o.user_id, u.name AS user_name, u.email AS user_email,
              o.coupon_id, c.code AS coupon_code, o.subtotal_amount, o.discount_amount, o.total_amount,
              o.status, o.created_at, o.updated_at
       FROM Orders o
       INNER JOIN Users u ON o.user_id = u.user_id
       LEFT JOIN Coupons c ON o.coupon_id = c.coupon_id
       WHERE o.order_id = ?`,
      [orderId]
    );

    if (orders.length === 0) return null;
    const order = orders[0];

    // Fetch Order_Items
    const items = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.course_id, oi.price_at_purchase,
              co.title AS course_title, co.description AS course_description,
              u.name AS instructor_name
       FROM Order_Items oi
       INNER JOIN Courses co ON oi.course_id = co.course_id
       INNER JOIN Users u ON co.instructor_id = u.user_id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    order.items = items;

    // Fetch Payments attempts
    const payments = await db.query(
      `SELECT payment_id, amount, payment_date, payment_method, status, transaction_ref
       FROM Payments
       WHERE order_id = ?
       ORDER BY payment_date DESC`,
      [orderId]
    );
    order.payments = payments;

    return order;
  }

  /**
   * Fetch all orders for a student user
   * @param {number} userId
   */
  static async getUserOrders(userId) {
    const orders = await db.query(
      `SELECT o.order_id, o.subtotal_amount, o.discount_amount, o.total_amount, o.status, o.created_at,
              COUNT(oi.order_item_id) AS item_count
       FROM Orders o
       LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
       WHERE o.user_id = ?
       GROUP BY o.order_id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return orders;
  }

  /**
   * Fetch all orders across the platform with customer and coupon details
   */
  static async findAllOrdersForAdmin() {
    return await db.query(
      `SELECT o.order_id, o.user_id, u.name AS user_name, u.email AS user_email,
              o.coupon_id, c.code AS coupon_code, o.subtotal_amount, o.discount_amount, o.total_amount,
              o.status, o.created_at,
              COUNT(oi.order_item_id) AS item_count
       FROM Orders o
       INNER JOIN Users u ON o.user_id = u.user_id
       LEFT JOIN Coupons c ON o.coupon_id = c.coupon_id
       LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
       GROUP BY o.order_id, o.user_id, u.name, u.email, o.coupon_id, c.code, o.subtotal_amount, o.discount_amount, o.total_amount, o.status, o.created_at
       ORDER BY o.created_at DESC`
    );
  }

  /**
   * Update order status
   * @param {number} orderId
   * @param {string} status
   * @param {Object} [connection]
   */
  static async updateStatus(orderId, status, connection = null) {
    const sql = `UPDATE Orders SET status = ? WHERE order_id = ?`;
    if (connection) {
      return await connection.execute(sql, [status, orderId]);
    }
    return await db.query(sql, [status, orderId]);
  }
}

module.exports = Order;
