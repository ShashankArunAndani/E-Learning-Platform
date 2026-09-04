const db = require('../config/db');

class Course {
  /**
   * Create course and assign categories within a transaction
   * @param {Object} data - { title, description, instructor_id, price, duration, level, status, category_ids }
   */
  static async create(data) {
    const {
      title,
      description = null,
      instructor_id,
      price,
      duration = null,
      level,
      status = 'draft',
      category_ids = []
    } = data;

    return await db.withTransaction(async (connection) => {
      // 1. Insert into Courses
      const [result] = await connection.execute(
        `INSERT INTO Courses (title, description, instructor_id, price, duration, level, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, instructor_id, price, duration, level, status]
      );
      const courseId = result.insertId;

      // 2. Insert into Course_Category
      if (Array.isArray(category_ids) && category_ids.length > 0) {
        for (const catId of category_ids) {
          await connection.execute(
            `INSERT INTO Course_Category (course_id, category_id) VALUES (?, ?)`,
            [courseId, parseInt(catId, 10)]
          );
        }
      }

      return courseId;
    });
  }

  /**
   * Update course and category mappings in a transaction
   * @param {number} courseId
   * @param {Object} data - { title, description, price, duration, level, status, category_ids }
   */
  static async update(courseId, data) {
    const {
      title,
      description = null,
      price,
      duration = null,
      level,
      status = 'draft',
      category_ids = []
    } = data;

    return await db.withTransaction(async (connection) => {
      // 1. Update Courses table
      await connection.execute(
        `UPDATE Courses 
         SET title = ?, description = ?, price = ?, duration = ?, level = ?, status = ?
         WHERE course_id = ?`,
        [title, description, price, duration, level, status, courseId]
      );

      // 2. Clear old category associations
      await connection.execute(
        `DELETE FROM Course_Category WHERE course_id = ?`,
        [courseId]
      );

      // 3. Re-insert category associations
      if (Array.isArray(category_ids) && category_ids.length > 0) {
        for (const catId of category_ids) {
          await connection.execute(
            `INSERT INTO Course_Category (course_id, category_id) VALUES (?, ?)`,
            [courseId, parseInt(catId, 10)]
          );
        }
      }
    });
  }

  /**
   * Delete course
   * @param {number} courseId
   */
  static async delete(courseId) {
    return await db.query(`DELETE FROM Courses WHERE course_id = ?`, [courseId]);
  }

  /**
   * Find detailed course by ID (with instructor profile, categories, and lessons)
   * @param {number} courseId
   */
  static async findById(courseId) {
    const courses = await db.query(
      `SELECT c.course_id, c.title, c.description, c.instructor_id, u.name AS instructor_name,
              ip.expertise AS instructor_expertise, ip.bio AS instructor_bio, ip.rating AS instructor_rating,
              c.price, c.duration, c.level, c.created_at, c.updated_at, c.status
       FROM Courses c
       INNER JOIN Users u ON c.instructor_id = u.user_id
       LEFT JOIN Instructor_Profile ip ON c.instructor_id = ip.instructor_id
       WHERE c.course_id = ?`,
      [courseId]
    );

    if (courses.length === 0) return null;
    const course = courses[0];

    // Fetch Categories
    const categories = await db.query(
      `SELECT cat.category_id, cat.category_name
       FROM Categories cat
       INNER JOIN Course_Category cc ON cat.category_id = cc.category_id
       WHERE cc.course_id = ?`,
      [courseId]
    );
    course.categories = categories;

    // Fetch Lessons
    const lessons = await db.query(
      `SELECT lesson_id, title, content_type, content_url, duration, order_index
       FROM Lessons
       WHERE course_id = ?
       ORDER BY order_index ASC`,
      [courseId]
    );
    course.lessons = lessons;

    return course;
  }

  /**
   * Find published courses with filters (search text, category filter, level filter)
   * @param {Object} filters - { search, category_id, level }
   */
  static async findPublished(filters = {}) {
    const { search, category_id, level } = filters;

    let sql = `
      SELECT c.course_id, c.title, c.description, c.instructor_id, u.name AS instructor_name,
             c.price, c.duration, c.level, c.created_at, c.status,
             COUNT(DISTINCT l.lesson_id) AS lesson_count,
             COALESCE(AVG(r.rating), 0) AS average_rating,
             COUNT(DISTINCT r.review_id) AS review_count,
             GROUP_CONCAT(DISTINCT cat.category_name SEPARATOR ', ') AS category_names,
             GROUP_CONCAT(DISTINCT cat.category_id) AS category_ids
      FROM Courses c
      INNER JOIN Users u ON c.instructor_id = u.user_id
      LEFT JOIN Course_Category cc ON c.course_id = cc.course_id
      LEFT JOIN Categories cat ON cc.category_id = cat.category_id
      LEFT JOIN Lessons l ON c.course_id = l.course_id
      LEFT JOIN Reviews r ON c.course_id = r.course_id
      WHERE c.status = 'published'
    `;

    const params = [];

    if (search && search.trim() !== '') {
      sql += ` AND (c.title LIKE ? OR c.description LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (category_id) {
      sql += ` AND cc.category_id = ?`;
      params.push(parseInt(category_id, 10));
    }

    if (level) {
      sql += ` AND c.level = ?`;
      params.push(level);
    }

    sql += ` GROUP BY c.course_id ORDER BY c.created_at DESC`;

    return await db.query(sql, params);
  }

  /**
   * Find all courses owned by an instructor
   * @param {number} instructorId
   */
  static async findByInstructorId(instructorId) {
    return await db.query(
      `SELECT c.course_id, c.title, c.price, c.duration, c.level, c.status, c.created_at,
              COUNT(l.lesson_id) AS lesson_count
       FROM Courses c
       LEFT JOIN Lessons l ON c.course_id = l.course_id
       WHERE c.instructor_id = ?
       GROUP BY c.course_id
       ORDER BY c.created_at DESC`,
      [instructorId]
    );
  }

  /**
   * Find all courses across platform (for Admin)
   */
  static async findAllForAdmin() {
    return await db.query(
      `SELECT c.course_id, c.title, u.name AS instructor_name, c.price, c.level, c.status, c.created_at
       FROM Courses c
       INNER JOIN Users u ON c.instructor_id = u.user_id
       ORDER BY c.created_at DESC`
    );
  }

  /**
   * Update course lifecycle status ('draft', 'published', 'archived')
   * @param {number} courseId
   * @param {string} status
   */
  static async updateStatus(courseId, status) {
    return await db.query(
      `UPDATE Courses SET status = ? WHERE course_id = ?`,
      [status, courseId]
    );
  }
}

module.exports = Course;
