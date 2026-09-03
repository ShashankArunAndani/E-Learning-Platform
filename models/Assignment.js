const db = require('../config/db');

class Assignment {
  /**
   * Create an assignment and its linked deadline within a transaction
   * @param {Object} data - { course_id, title, description, max_marks, due_date, late_submission_allowed }
   */
  static async create(data) {
    const { course_id, title, description, max_marks, due_date, late_submission_allowed } = data;
    
    return await db.withTransaction(async (connection) => {
      // 1. Insert into Assignments
      const [result] = await connection.execute(
        `INSERT INTO Assignments (course_id, title, description, max_marks) VALUES (?, ?, ?, ?)`,
        [course_id, title, description || null, max_marks]
      );
      const assignmentId = result.insertId;

      // 2. Insert into Deadlines
      const lateAllowed = late_submission_allowed === 'true' || late_submission_allowed === true ? 1 : 0;
      await connection.execute(
        `INSERT INTO Deadlines (assignment_id, due_date, late_submission_allowed) VALUES (?, ?, ?)`,
        [assignmentId, due_date, lateAllowed]
      );

      return assignmentId;
    });
  }

  /**
   * Find assignments by course ID (includes deadlines)
   */
  static async findByCourse(courseId) {
    return await db.query(
      `SELECT a.*, d.due_date, d.late_submission_allowed 
       FROM Assignments a
       JOIN Deadlines d ON a.assignment_id = d.assignment_id
       WHERE a.course_id = ?
       ORDER BY d.due_date ASC`,
      [courseId]
    );
  }

  /**
   * Find a specific assignment by ID (includes deadlines)
   */
  static async findById(assignmentId) {
    const rows = await db.query(
      `SELECT a.*, d.due_date, d.late_submission_allowed 
       FROM Assignments a
       JOIN Deadlines d ON a.assignment_id = d.assignment_id
       WHERE a.assignment_id = ?`,
      [assignmentId]
    );
    return rows[0] || null;
  }
}

module.exports = Assignment;
