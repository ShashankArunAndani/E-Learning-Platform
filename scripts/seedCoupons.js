const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedCoupons() {
  console.log('Seeding Sample Coupon Codes...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'e_learning_platform',
    multipleStatements: true
  });

  try {
    const today = new Date();
    const validFrom = today.toISOString().split('T')[0] + ' 00:00:00';
    
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 90);
    const validTo = futureDate.toISOString().split('T')[0] + ' 23:59:59';

    const coupons = [
      {
        code: 'WELCOME10',
        type: 'percent',
        value: 10.00,
        max_discount: null,
        min_order: 0.00,
        limit: 500
      },
      {
        code: 'SAVE20',
        type: 'flat',
        value: 20.00,
        max_discount: null,
        min_order: 30.00,
        limit: 100
      },
      {
        code: 'STUDENT15',
        type: 'percent',
        value: 15.00,
        max_discount: 25.00,
        min_order: 15.00,
        limit: 200
      }
    ];

    for (const c of coupons) {
      await connection.execute(
        `INSERT INTO Coupons (code, discount_type, discount_value, max_discount_amount, min_order_amount, valid_from, valid_to, usage_limit, times_used, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, TRUE)
         ON DUPLICATE KEY UPDATE discount_value = VALUES(discount_value), is_active = TRUE`,
        [c.code, c.type, c.value, c.max_discount, c.min_order, validFrom, validTo, c.limit]
      );
    }

    console.log('Sample coupons seeded successfully! (WELCOME10, SAVE20, STUDENT15)');
  } catch (error) {
    console.error('Error seeding coupons:', error);
  } finally {
    await connection.end();
  }
}

seedCoupons();
