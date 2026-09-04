const crypto = require('crypto');
const db = require('../config/db');

class Certificate {
  static async findByUserAndCourse(userId, courseId) {
    const rows = await db.query(
      `SELECT certificate_id, user_id, course_id, issue_date, certificate_url
       FROM Certificates
       WHERE user_id = ? AND course_id = ?`,
      [userId, courseId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByUrl(certificateUrl) {
    const rows = await db.query(
      `SELECT cert.certificate_id, cert.user_id, cert.course_id, cert.issue_date, cert.certificate_url,
              u.name AS student_name, u.email AS student_email,
              c.title AS course_title, c.level, c.duration,
              i.name AS instructor_name
       FROM Certificates cert
       INNER JOIN Users u ON cert.user_id = u.user_id
       INNER JOIN Courses c ON cert.course_id = c.course_id
       INNER JOIN Users i ON c.instructor_id = i.user_id
       WHERE cert.certificate_url = ?`,
      [certificateUrl]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  static async issueIfEligible(userId, courseId) {
    return await db.withTransaction(async (connection) => {
      const [existingRows] = await connection.execute(
        `SELECT certificate_id, user_id, course_id, issue_date, certificate_url
         FROM Certificates
         WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );

      if (existingRows.length > 0) {
        return existingRows[0];
      }

      // DFD-2.10 (9.2): completion eligibility is derived from Enrollments + Progress.
      const [eligibilityRows] = await connection.execute(
        `SELECT e.enrollment_id, e.completion_status, e.progress_percentage,
                p.completion_percentage
         FROM Enrollments e
         LEFT JOIN Progress p ON e.user_id = p.user_id AND e.course_id = p.course_id
         WHERE e.user_id = ? AND e.course_id = ?`,
        [userId, courseId]
      );

      if (eligibilityRows.length === 0) {
        const error = new Error('You must be enrolled in this course before requesting a certificate.');
        error.status = 403;
        throw error;
      }

      const eligibility = eligibilityRows[0];
      const progressPercentage = parseFloat(eligibility.completion_percentage || eligibility.progress_percentage || 0);
      if (eligibility.completion_status !== 'completed' || progressPercentage < 100) {
        const error = new Error('Complete every lesson in this course before requesting a certificate.');
        error.status = 403;
        throw error;
      }

      let certificateUrl;
      let inserted = false;

      for (let attempt = 0; attempt < 5 && !inserted; attempt += 1) {
        certificateUrl = crypto.randomBytes(18).toString('hex');
        try {
          await connection.execute(
            `INSERT INTO Certificates (user_id, course_id, certificate_url)
             VALUES (?, ?, ?)`,
            [userId, courseId, certificateUrl]
          );
          inserted = true;
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') throw error;

          const [raceRows] = await connection.execute(
            `SELECT certificate_id, user_id, course_id, issue_date, certificate_url
             FROM Certificates
             WHERE user_id = ? AND course_id = ?`,
            [userId, courseId]
          );
          if (raceRows.length > 0) {
            return raceRows[0];
          }
        }
      }

      if (!inserted) {
        const error = new Error('Could not generate a unique certificate URL. Please try again.');
        error.status = 500;
        throw error;
      }

      const [issuedRows] = await connection.execute(
        `SELECT certificate_id, user_id, course_id, issue_date, certificate_url
         FROM Certificates
         WHERE user_id = ? AND course_id = ?`,
        [userId, courseId]
      );

      return issuedRows[0];
    });
  }
}

module.exports = Certificate;
