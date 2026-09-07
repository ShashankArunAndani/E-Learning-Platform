const db = require('../config/db');

class Metric {
  /**
   * Get total user counts overall and by status
   */
  static async getTotalUsers() {
    const rows = await db.query(
      `SELECT 
         COUNT(*) AS total_users,
         SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) AS active_users,
         SUM(CASE WHEN u.status = 'banned' THEN 1 ELSE 0 END) AS banned_users,
         SUM(CASE WHEN r.role_name = 'Student' THEN 1 ELSE 0 END) AS student_count,
         SUM(CASE WHEN r.role_name = 'Instructor' THEN 1 ELSE 0 END) AS instructor_count,
         SUM(CASE WHEN r.role_name = 'Admin' THEN 1 ELSE 0 END) AS admin_count
       FROM Users u
       INNER JOIN Roles r ON u.role_id = r.role_id`
    );
    const row = rows[0] || {};
    return {
      total_users: parseInt(row.total_users || 0, 10),
      active_users: parseInt(row.active_users || 0, 10),
      banned_users: parseInt(row.banned_users || 0, 10),
      student_count: parseInt(row.student_count || 0, 10),
      instructor_count: parseInt(row.instructor_count || 0, 10),
      admin_count: parseInt(row.admin_count || 0, 10)
    };
  }

  /**
   * Get total revenue from completed orders
   */
  static async getTotalRevenue() {
    const rows = await db.query(
      `SELECT 
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COUNT(*) AS completed_orders_count
       FROM Orders 
       WHERE status = 'completed'`
    );
    return {
      total_revenue: parseFloat(rows[0]?.total_revenue || 0),
      completed_orders_count: parseInt(rows[0]?.completed_orders_count || 0, 10)
    };
  }

  /**
   * Get course metrics (total, published, draft, archived)
   */
  static async getCourseMetrics() {
    const rows = await db.query(
      `SELECT 
         COUNT(*) AS total_courses,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published_courses,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft_courses,
         SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_courses
       FROM Courses`
    );
    const row = rows[0] || {};
    return {
      total_courses: parseInt(row.total_courses || 0, 10),
      published_courses: parseInt(row.published_courses || 0, 10),
      draft_courses: parseInt(row.draft_courses || 0, 10),
      archived_courses: parseInt(row.archived_courses || 0, 10)
    };
  }

  /**
   * Get top most enrolled courses with instructor name, enrollment count and average rating
   * Demonstrates non-trivial SQL JOIN + GROUP BY
   * @param {number} limit
   */
  static async getMostEnrolledCourses(limit = 5) {
    const safeLimit = parseInt(limit, 10) || 5;
    return await db.query(
      `SELECT 
         c.course_id, 
         c.title, 
         c.price, 
         c.level, 
         c.status,
         u.name AS instructor_name,
         COUNT(e.enrollment_id) AS enrollment_count,
         COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM Courses c
       INNER JOIN Users u ON c.instructor_id = u.user_id
       LEFT JOIN Enrollments e ON c.course_id = e.course_id
       LEFT JOIN Reviews r ON c.course_id = r.course_id
       GROUP BY c.course_id, c.title, c.price, c.level, c.status, u.name
       ORDER BY enrollment_count DESC, c.title ASC
       LIMIT ${safeLimit}`
    );
  }

  /**
   * Get total enrollment count across platform
   */
  static async getTotalEnrollments() {
    const rows = await db.query(`SELECT COUNT(*) AS total_enrollments FROM Enrollments`);
    return parseInt(rows[0]?.total_enrollments || 0, 10);
  }

  /**
   * Get full admin analytics dashboard summary
   */
  static async getAdminSummary() {
    const [users, revenue, courses, topCourses, totalEnrollments] = await Promise.all([
      this.getTotalUsers(),
      this.getTotalRevenue(),
      this.getCourseMetrics(),
      this.getMostEnrolledCourses(5),
      this.getTotalEnrollments()
    ]);

    return {
      users,
      revenue,
      courses,
      topCourses,
      mostEnrolledCourses: topCourses,
      totalEnrollments
    };
  }
}

module.exports = Metric;
