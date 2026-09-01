const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'e_learning_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

/**
 * Execute parameterized query using pool
 * @param {string} sql - SQL query with ? placeholders
 * @param {Array} params - Parameters array
 * @returns {Promise<Array>} - Query results
 */
async function query(sql, params = []) {
  const [rows, fields] = await pool.execute(sql, params);
  return rows;
}

/**
 * Execute transaction helper
 * @param {Function} callback - Function receiving (connection) to execute transaction queries
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
