const db = require('../config/db');

class Role {
  /**
   * Find role by role name
   * @param {string} roleName
   */
  static async getRoleByName(roleName) {
    const rows = await db.query(
      `SELECT role_id, role_name FROM Roles WHERE role_name = ?`,
      [roleName]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find role by role ID
   * @param {number} roleId
   */
  static async getRoleById(roleId) {
    const rows = await db.query(
      `SELECT role_id, role_name FROM Roles WHERE role_id = ?`,
      [roleId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get all permission names associated with a role ID
   * @param {number} roleId
   * @returns {Promise<Array<string>>} List of permission names
   */
  static async getPermissionsByRoleId(roleId) {
    const rows = await db.query(
      `SELECT p.permission_name
       FROM Permissions p
       INNER JOIN Role_Permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?`,
      [roleId]
    );
    return rows.map(r => r.permission_name);
  }

  /**
   * Get all roles
   */
  static async getAllRoles() {
    return await db.query(`SELECT role_id, role_name FROM Roles ORDER BY role_id`);
  }
}

module.exports = Role;
