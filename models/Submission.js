const db = require('../config/db');

class Submission {
  /**
   * Submit an assignment (inserting a new submission).
   * Note: The controller should handle checking the deadline before calling this.
   * @param {Object} data - { assignment_id, user_id, course_id, file_url }
   */
  static async submit(data) {
    const { assignment_id, user_id, course_id, file_url } = data;
    
    // Check if submission already exists (handled by UNIQUE(assignment_id, user_id) in schema)
    // But it's good to use INSERT IGNORE or handle the duplicate error in controller.
    const result = await db.query(
      `INSERT INTO Submissions (assignment_id, user_id, course_id, file_url) 
       VALUES (?, ?, ?, ?)`,
      [assignment_id, user_id, course_id, file_url]
    );
    return result.insertId;
  }

  /**
   * Get all submissions for an assignment
   * Includes student name.
   */
  static async findByAssignment(assignmentId) {
    return await db.query(
      `SELECT s.*, u.name as student_name 
       FROM Submissions s
       JOIN Users u ON s.user_id = u.user_id
       WHERE s.assignment_id = ?
       ORDER BY s.submission_date DESC`,
      [assignmentId]
    );
  }

  /**
   * Find a specific student's submission for an assignment
   */
  static async findByStudentAndAssignment(userId, assignmentId) {
    const rows = await db.query(
      `SELECT * FROM Submissions 
       WHERE user_id = ? AND assignment_id = ?`,
      [userId, assignmentId]
    );
    return rows[0] || null;
  }
  
  /**
   * Grade a submission
   */
  static async grade(submissionId, marksObtained, feedback) {
    return await db.query(
      `UPDATE Submissions 
       SET marks_obtained = ?, feedback = ? 
       WHERE submission_id = ?`,
      [marksObtained, feedback || null, submissionId]
    );
  }

  /**
   * Find submission by ID
   */
  static async findById(submissionId) {
    const rows = await db.query(
      `SELECT * FROM Submissions WHERE submission_id = ?`,
      [submissionId]
    );
    return rows[0] || null;
  }
}

module.exports = Submission;
