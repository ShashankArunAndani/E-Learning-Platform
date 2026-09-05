const db = require('../config/db');

class Notification {
  static async createInApp(userId, message, type = 'system', priority = 'normal', connection = null) {
    const sql = `INSERT INTO Notifications
      (user_id, message, type, channel, priority, status, scheduled_at, sent_at)
      VALUES (?, ?, ?, 'in_app', ?, 'sent', NOW(), NOW())`;
    const params = [userId, message, type, priority];

    if (connection) {
      const [result] = await connection.execute(sql, params);
      return result.insertId;
    }

    const result = await db.query(sql, params);
    return result.insertId;
  }

  static async getForUser(userId, limit = 50) {
    return await db.query(
      `SELECT notification_id, user_id, message, type, channel, priority, status,
              retries_count, max_retries, error_reason, scheduled_at, sent_at, read_at, created_at
       FROM Notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, limit]
    );
  }

  static async getUnreadCount(userId) {
    const rows = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM Notifications
       WHERE user_id = ? AND status IN ('queued', 'sent', 'failed')`,
      [userId]
    );
    return rows[0] ? rows[0].unread_count : 0;
  }

  static async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE Notifications
       SET status = 'read', read_at = NOW()
       WHERE notification_id = ? AND user_id = ? AND status <> 'read'`,
      [notificationId, userId]
    );
    return result.affectedRows || 0;
  }

  static async markAllAsRead(userId) {
    const result = await db.query(
      `UPDATE Notifications
       SET status = 'read', read_at = NOW()
       WHERE user_id = ? AND status <> 'read'`,
      [userId]
    );
    return result.affectedRows || 0;
  }
}

module.exports = Notification;
