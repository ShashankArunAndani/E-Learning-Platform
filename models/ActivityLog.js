const db = require('../config/db');

class ActivityLog {
  /**
   * Record action in Activity_Log table
   * @param {number} userId
   * @param {string} action
   * @param {string} [ipAddress=null]
   * @param {Object} [metadata=null]
   */
  static async logAction(userId, action, ipAddress = null, metadata = null) {
    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    return await db.query(
      `INSERT INTO Activity_Log (user_id, action, ip_address, metadata_json) VALUES (?, ?, ?, ?)`,
      [userId, action, ipAddress, metadataJson]
    );
  }

  /**
   * Fetch recent activity logs for admin view
   * @param {number} [limit=50]
   */
  static async getRecentLogs(limit = 50) {
    return await db.query(
      `SELECT a.log_id, a.user_id, u.name, u.email, a.action, a.event_time, a.ip_address, a.metadata_json
       FROM Activity_Log a
       LEFT JOIN Users u ON a.user_id = u.user_id
       ORDER BY a.event_time DESC
       LIMIT ?`,
      [limit]
    );
  }
}

module.exports = ActivityLog;
