const db = require('../config/db');
const Notification = require('./Notification');

class Payment {
  /**
   * Process payment attempt and trigger Auto-Enrollment & Progress initialization on success inside a transaction
   * @param {Object} data - { orderId, amount, paymentMethod, transactionRef, isSuccess }
   */
  static async processPaymentAndEnroll(data) {
    const { orderId, amount, paymentMethod = 'card', transactionRef, isSuccess } = data;
    const paymentStatus = isSuccess ? 'success' : 'failed';

    return await db.withTransaction(async (connection) => {
      // 1. Record Payment attempt
      const [payResult] = await connection.execute(
        `INSERT INTO Payments (order_id, amount, payment_method, status, transaction_ref)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, amount, paymentMethod, paymentStatus, transactionRef]
      );
      const paymentId = payResult.insertId;

      if (isSuccess) {
        // 2. Mark Order as completed
        await connection.execute(
          `UPDATE Orders SET status = 'completed' WHERE order_id = ?`,
          [orderId]
        );

        // 3. Fetch Order Items & User ID
        const [orderRows] = await connection.execute(
          `SELECT user_id FROM Orders WHERE order_id = ?`,
          [orderId]
        );
        if (orderRows.length === 0) throw new Error('Order not found during payment processing');
        const userId = orderRows[0].user_id;

        const [orderItems] = await connection.execute(
          `SELECT oi.order_item_id, oi.course_id, c.title AS course_title
           FROM Order_Items oi
           INNER JOIN Courses c ON oi.course_id = c.course_id
           WHERE oi.order_id = ?`,
          [orderId]
        );

        // 4. Auto-create Enrollments and Progress for each course
        for (const item of orderItems) {
          const { order_item_id, course_id, course_title } = item;

          // Insert Enrollments row (handling duplicate gracefully if already enrolled)
          await connection.execute(
            `INSERT INTO Enrollments (user_id, course_id, order_item_id, completion_status, progress_percentage)
             VALUES (?, ?, ?, 'not_started', 0)
             ON DUPLICATE KEY UPDATE order_item_id = VALUES(order_item_id)`,
            [userId, course_id, order_item_id]
          );

          // Get total lesson count for the course
          const [lessonCountRows] = await connection.execute(
            `SELECT COUNT(*) AS total_lessons FROM Lessons WHERE course_id = ?`,
            [course_id]
          );
          const totalLessons = lessonCountRows[0].total_lessons || 0;

          // Insert Progress row
          await connection.execute(
            `INSERT INTO Progress (user_id, course_id, completed_lessons, total_lessons, completion_percentage)
             VALUES (?, ?, 0, ?, 0)
             ON DUPLICATE KEY UPDATE total_lessons = VALUES(total_lessons)`,
            [userId, course_id, totalLessons]
          );

          // DFD-2.7/2.12: successful payment creates enrollment and an in-app notification.
          await Notification.createInApp(
            userId,
            `You are now enrolled in ${course_title}.`,
            'enrollment',
            'normal',
            connection
          );
        }

        // DFD-2.5/2.12: payment success is delivered as an in-app notification.
        await Notification.createInApp(
          userId,
          `Payment successful for order #${orderId}. Your courses are ready to learn.`,
          'payment',
          'high',
          connection
        );
      } else {
        // 5. Mark Order as failed
        await connection.execute(
          `UPDATE Orders SET status = 'failed' WHERE order_id = ?`,
          [orderId]
        );

        const [orderRows] = await connection.execute(
          `SELECT user_id FROM Orders WHERE order_id = ?`,
          [orderId]
        );

        if (orderRows.length > 0) {
          // DFD-2.12: failed delivery/result paths remain visible in-app for retry.
          await Notification.createInApp(
            orderRows[0].user_id,
            `Payment failed for order #${orderId}. You can retry from checkout.`,
            'payment',
            'high',
            connection
          );
        }
      }

      return { paymentId, status: paymentStatus };
    });
  }

  /**
   * Find payment by transaction reference
   * @param {string} ref
   */
  static async findByTransactionRef(ref) {
    const rows = await db.query(
      `SELECT * FROM Payments WHERE transaction_ref = ?`,
      [ref]
    );
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = Payment;
