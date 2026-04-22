const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'hrm_portal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '1234'
});

async function run() {
  try {
    console.log('Running database migration...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255), 
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log('Database migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

run();
