const db = require('../config/db');

class Exam {
  /**
   * Create an exam (metadata)
   */
  static async create(data) {
    const { course_id, title, total_marks, duration, exam_date } = data;
    const [result] = await db.query(
      `INSERT INTO Exams (course_id, title, total_marks, duration, exam_date) 
       VALUES (?, ?, ?, ?, ?)`,
      [course_id, title, total_marks, duration, exam_date]
    );
    return result.insertId;
  }

  /**
   * Find exams by course ID
   */
  static async findByCourse(courseId) {
    return await db.query(
      `SELECT * FROM Exams 
       WHERE course_id = ? 
       ORDER BY exam_date ASC`,
      [courseId]
    );
  }

  /**
   * Find exam by ID
   */
  static async findById(examId) {
    const rows = await db.query(
      `SELECT * FROM Exams WHERE exam_id = ?`,
      [examId]
    );
    return rows[0] || null;
  }

  /**
   * Enter result for a student manually
   */
  static async enterResult(data) {
    const { exam_id, user_id, course_id, marks_obtained, grade } = data;
    
    // Check if result already exists to perform update or handle gracefully via UPSERT (ON DUPLICATE KEY UPDATE)
    const [result] = await db.query(
      `INSERT INTO Results (exam_id, user_id, course_id, marks_obtained, grade) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE marks_obtained = ?, grade = ?, result_date = CURRENT_TIMESTAMP`,
      [exam_id, user_id, course_id, marks_obtained, grade || null, marks_obtained, grade || null]
    );
    return result.insertId || result.affectedRows; // affectedRows will be 1 for insert, 2 for update
  }

  /**
   * Find results for an exam
   */
  static async findResultsByExam(examId) {
    return await db.query(
      `SELECT r.*, u.name as student_name 
       FROM Results r
       JOIN Users u ON r.user_id = u.user_id
       WHERE r.exam_id = ?`,
      [examId]
    );
  }

  /**
   * Find a specific student's result for an exam
   */
  static async findResultByStudentAndExam(userId, examId) {
    const rows = await db.query(
      `SELECT * FROM Results WHERE user_id = ? AND exam_id = ?`,
      [userId, examId]
    );
    return rows[0] || null;
  }
}

module.exports = Exam;
