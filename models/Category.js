const db = require('../config/db');

class Category {
  /**
   * Get all categories sorted alphabetically
   */
  static async getAll() {
    return await db.query(
      `SELECT category_id, category_name, description FROM Categories ORDER BY category_name ASC`
    );
  }

  /**
   * Find category by ID
   * @param {number} categoryId
   */
  static async findById(categoryId) {
    const rows = await db.query(
      `SELECT category_id, category_name, description FROM Categories WHERE category_id = ?`,
      [categoryId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find category by Name
   * @param {string} categoryName
   */
  static async findByName(categoryName) {
    const rows = await db.query(
      `SELECT category_id, category_name, description FROM Categories WHERE category_name = ?`,
      [categoryName]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create new category
   * @param {Object} data - { category_name, description }
   */
  static async create(data) {
    const { category_name, description = null } = data;
    const result = await db.query(
      `INSERT INTO Categories (category_name, description) VALUES (?, ?)`,
      [category_name, description]
    );
    return result.insertId;
  }

  /**
   * Update category
   * @param {number} categoryId
   * @param {Object} data - { category_name, description }
   */
  static async update(categoryId, data) {
    const { category_name, description = null } = data;
    return await db.query(
      `UPDATE Categories SET category_name = ?, description = ? WHERE category_id = ?`,
      [category_name, description, categoryId]
    );
  }

  /**
   * Delete category
   * @param {number} categoryId
   */
  static async delete(categoryId) {
    return await db.query(
      `DELETE FROM Categories WHERE category_id = ?`,
      [categoryId]
    );
  }
}

module.exports = Category;
