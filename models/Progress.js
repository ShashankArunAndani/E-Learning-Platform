const db = require('../config/db');

class Progress {
  /**
   * Get progress for a user and course.
   * Auto-initializes progress record if missing and user is enrolled.
   * @param {number} userId
   * @param {number} courseId
   */
  static async getProgress(userId, courseId) {
    let rows = await db.query(
      `SELECT p.progress_id, p.user_id, p.course_id, p.completed_lessons, p.total_lessons,
              p.last_accessed_lesson, p.completion_percentage
       FROM Progress p
       WHERE p.user_id = ? AND p.course_id = ?`,
      [userId, courseId]
    );

    if (rows.length === 0) {
      // Check if user is enrolled
      const enrollmentRows = await db.query(
        `SELECT enrollment_id FROM Enrollments WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );

      if (enrollmentRows.length > 0) {
        // Initialize progress
        const countRows = await db.query(
          `SELECT COUNT(*) AS total_lessons FROM Lessons WHERE course_id = ?`,
          [courseId]
        );
        const totalLessons = countRows[0].total_lessons || 0;

        await db.query(
          `INSERT INTO Progress (user_id, course_id, completed_lessons, total_lessons, completion_percentage)
           VALUES (?, ?, 0, ?, 0)
           ON DUPLICATE KEY UPDATE total_lessons = VALUES(total_lessons)`,
          [userId, courseId, totalLessons]
        );

        rows = await db.query(
          `SELECT p.progress_id, p.user_id, p.course_id, p.completed_lessons, p.total_lessons,
                  p.last_accessed_lesson, p.completion_percentage
           FROM Progress p
           WHERE p.user_id = ? AND p.course_id = ?`,
          [userId, courseId]
        );
      }
    }

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Update last accessed lesson
   * @param {number} userId
   * @param {number} courseId
   * @param {number} lessonId
   */
  static async updateLastAccessed(userId, courseId, lessonId) {
    // Also ensure total_lessons is kept up to date
    const countRows = await db.query(
      `SELECT COUNT(*) AS total_lessons FROM Lessons WHERE course_id = ?`,
      [courseId]
    );
    const totalLessons = countRows[0].total_lessons || 0;

    return await db.query(
      `INSERT INTO Progress (user_id, course_id, completed_lessons, total_lessons, last_accessed_lesson, completion_percentage)
       VALUES (?, ?, 0, ?, ?, 0)
       ON DUPLICATE KEY UPDATE
         last_accessed_lesson = VALUES(last_accessed_lesson),
         total_lessons = VALUES(total_lessons)`,
      [userId, courseId, totalLessons, lessonId]
    );
  }

  /**
   * Record lesson completion and synchronize Enrollments completion status
   * @param {number} userId
   * @param {number} courseId
   * @param {number} lessonId
   * @param {number} lessonOrderIndex
   */
  static async recordLessonCompletion(userId, courseId, lessonId, lessonOrderIndex) {
    return await db.withTransaction(async (connection) => {
      // 1. Get total lessons count
      const [countRows] = await connection.execute(
        `SELECT COUNT(*) AS total_lessons FROM Lessons WHERE course_id = ?`,
        [courseId]
      );
      const totalLessons = countRows[0].total_lessons || 0;

      // 2. Get current progress
      const [progRows] = await connection.execute(
        `SELECT progress_id, completed_lessons FROM Progress WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );

      let currentCompleted = 0;
      if (progRows.length > 0) {
        currentCompleted = progRows[0].completed_lessons || 0;
      }

      // If the lesson order index is greater than current completed lessons, advance completed_lessons
      // Ensuring it does not exceed totalLessons
      const newCompleted = Math.min(totalLessons, Math.max(currentCompleted, lessonOrderIndex || currentCompleted + 1));
      
      const completionPercentage = totalLessons > 0
        ? parseFloat(((newCompleted / totalLessons) * 100).toFixed(2))
        : 100.0;

      // 3. Update or insert Progress record
      await connection.execute(
        `INSERT INTO Progress (user_id, course_id, completed_lessons, total_lessons, last_accessed_lesson, completion_percentage)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           completed_lessons = VALUES(completed_lessons),
           total_lessons = VALUES(total_lessons),
           last_accessed_lesson = VALUES(last_accessed_lesson),
           completion_percentage = VALUES(completion_percentage)`,
        [userId, courseId, newCompleted, totalLessons, lessonId, completionPercentage]
      );

      // 4. Synchronize Enrollments completion_status and progress_percentage
      let completionStatus = 'not_started';
      if (newCompleted >= totalLessons && totalLessons > 0) {
        completionStatus = 'completed';
      } else if (newCompleted > 0) {
        completionStatus = 'in_progress';
      }

      await connection.execute(
        `UPDATE Enrollments
         SET completion_status = ?,
             progress_percentage = ?
         WHERE user_id = ? AND course_id = ?`,
        [completionStatus, completionPercentage, userId, courseId]
      );

      return {
        completed_lessons: newCompleted,
        total_lessons: totalLessons,
        completion_percentage: completionPercentage,
        completion_status: completionStatus,
        last_accessed_lesson: lessonId
      };
    });
  }
}

module.exports = Progress;
