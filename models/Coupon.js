const db = require('../config/db');

class Coupon {
  /**
   * Get all coupons ordered by creation / valid_from
   */
  static async getAll() {
    return await db.query(
      `SELECT coupon_id, code, discount_type, discount_value, max_discount_amount, min_order_amount,
              valid_from, valid_to, usage_limit, times_used, is_active
       FROM Coupons
       ORDER BY coupon_id DESC`
    );
  }

  /**
   * Find coupon by ID
   * @param {number} couponId
   */
  static async findById(couponId) {
    const rows = await db.query(
      `SELECT * FROM Coupons WHERE coupon_id = ?`,
      [couponId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find coupon by uppercase code
   * @param {string} code
   */
  static async findByCode(code) {
    const formattedCode = code.trim().toUpperCase();
    const rows = await db.query(
      `SELECT * FROM Coupons WHERE UPPER(code) = ?`,
      [formattedCode]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Validate coupon code against subtotal amount and return validation result + discount amount
   * @param {string} code
   * @param {number} subtotalAmount
   */
  static async validateCoupon(code, subtotalAmount) {
    const coupon = await Coupon.findByCode(code);
    if (!coupon) {
      return { valid: false, message: 'Invalid coupon code.' };
    }

    if (!coupon.is_active) {
      return { valid: false, message: 'This coupon code is no longer active.' };
    }

    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validTo = new Date(coupon.valid_to);

    if (now < validFrom || now > validTo) {
      return { valid: false, message: 'This coupon code has expired or is not yet valid.' };
    }

    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
      return { valid: false, message: 'This coupon has reached its maximum usage limit.' };
    }

    const minAmount = parseFloat(coupon.min_order_amount || 0);
    if (subtotalAmount < minAmount) {
      return { valid: false, message: `Minimum order amount of $${minAmount.toFixed(2)} required to use this coupon.` };
    }

    // Calculate Discount
    let discount = 0;
    const discountVal = parseFloat(coupon.discount_value);

    if (coupon.discount_type === 'percent') {
      discount = (subtotalAmount * discountVal) / 100;
      if (coupon.max_discount_amount !== null && coupon.max_discount_amount !== undefined) {
        const maxDiscount = parseFloat(coupon.max_discount_amount);
        if (discount > maxDiscount) {
          discount = maxDiscount;
        }
      }
    } else {
      // Flat discount
      discount = discountVal;
    }

    // Cannot exceed subtotal
    if (discount > subtotalAmount) {
      discount = subtotalAmount;
    }

    return {
      valid: true,
      coupon,
      discount_amount: parseFloat(discount.toFixed(2)),
      message: `Coupon "${coupon.code}" applied successfully!`
    };
  }

  /**
   * Create new coupon
   * @param {Object} data
   */
  static async create(data) {
    const {
      code,
      discount_type,
      discount_value,
      max_discount_amount = null,
      min_order_amount = 0,
      valid_from,
      valid_to,
      usage_limit = null
    } = data;

    const formattedCode = code.trim().toUpperCase();

    const result = await db.query(
      `INSERT INTO Coupons (code, discount_type, discount_value, max_discount_amount, min_order_amount, valid_from, valid_to, usage_limit, times_used, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, TRUE)`,
      [formattedCode, discount_type, discount_value, max_discount_amount, min_order_amount, valid_from, valid_to, usage_limit]
    );

    return result.insertId;
  }

  /**
   * Toggle coupon active state
   * @param {number} couponId
   */
  static async toggleStatus(couponId) {
    return await db.query(
      `UPDATE Coupons SET is_active = NOT is_active WHERE coupon_id = ?`,
      [couponId]
    );
  }

  /**
   * Increment times_used counter
   * @param {number} couponId
   * @param {Object} [connection]
   */
  static async incrementUsage(couponId, connection = null) {
    const sql = `UPDATE Coupons SET times_used = times_used + 1 WHERE coupon_id = ?`;
    if (connection) {
      return await connection.execute(sql, [couponId]);
    }
    return await db.query(sql, [couponId]);
  }
}

module.exports = Coupon;
