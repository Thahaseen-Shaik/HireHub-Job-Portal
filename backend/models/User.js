const pool = require('../config/database');

class User {
  static async create(name, email, password, role = 'user') {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const query = 'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [name, normalizedEmail, password, role]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await pool.query(query, [String(email || '').trim()]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateResetToken(email, token, expires) {
    const query = 'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE LOWER(email) = LOWER($3) RETURNING *';
    const result = await pool.query(query, [token, expires, String(email || '').trim()]);
    return result.rows[0];
  }

  static async findByResetToken(token) {
    const query = 'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > CURRENT_TIMESTAMP';
    const result = await pool.query(query, [token]);
    return result.rows[0];
  }

  static async updatePassword(id, hashedPassword) {
    const query = 'UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [hashedPassword, id]);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT id, name, email, role, is_blocked, created_at FROM users';
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateBlockStatus(id, isBlocked) {
    const query = 'UPDATE users SET is_blocked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [isBlocked, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
