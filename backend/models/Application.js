const pool = require('../config/database');
const UserProfile = require('./UserProfile');

class Application {
  static async syncIdSequence() {
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('applications', 'id'),
        COALESCE((SELECT MAX(id) FROM applications), 0) + 1,
        false
      );
    `);
  }

  static async ensureEnhancedSchema() {
    await UserProfile.ensureTable();

    const query = `
      ALTER TABLE applications
      ADD COLUMN IF NOT EXISTS apply_source VARCHAR(50) DEFAULT 'direct_profile',
      ADD COLUMN IF NOT EXISTS submitted_details JSONB NOT NULL DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS test_attempted BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS test_score DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS test_total_questions INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS test_passed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS test_submitted_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS interview_called BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS interview_called_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `;

    await pool.query(query);
    await this.syncIdSequence();
  }

  static async create(jobId, userId, options = {}) {
    await this.ensureEnhancedSchema();
    const query = `
      INSERT INTO applications (job_id, user_id, status, apply_source, submitted_details, test_total_questions)
      VALUES ($1, $2, 'applied', $3, $4::jsonb, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      jobId,
      userId,
      options.applySource || 'direct_profile',
      JSON.stringify(options.submittedDetails || {}),
      Number(options.testTotalQuestions) || 10
    ]);
    return result.rows[0];
  }

  static async findByJobAndUser(jobId, userId) {
    await this.ensureEnhancedSchema();
    const query = 'SELECT * FROM applications WHERE job_id = $1 AND user_id = $2';
    const result = await pool.query(query, [jobId, userId]);
    return result.rows[0];
  }

  static async getAll() {
    await this.ensureEnhancedSchema();
    const query = `SELECT a.*, j.title as job_title, c.name as company_name, u.name as user_name, u.email as user_email, up.resume_url AS user_resume_url, up.display_name AS user_display_name
                   FROM applications a 
                   LEFT JOIN jobs j ON a.job_id = j.id
                   LEFT JOIN companies c ON j.company_id = c.id
                   LEFT JOIN users u ON a.user_id = u.id
                   LEFT JOIN user_profiles up ON up.user_id = u.id`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    await this.ensureEnhancedSchema();
    const query = `
      SELECT
        a.*,
        j.title AS job_title,
        c.name AS company_name,
        u.name AS user_name,
        u.email AS user_email,
        up.resume_url,
        up.display_name
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE a.id = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    await this.ensureEnhancedSchema();
    const query = 'UPDATE applications SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await this.ensureEnhancedSchema();
    const query = 'DELETE FROM applications WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateTestResult(id, data) {
    await this.ensureEnhancedSchema();
    const query = `
      UPDATE applications
      SET
        test_attempted = TRUE,
        test_score = $1,
        test_total_questions = $2,
        test_passed = $3,
        test_submitted_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;
    const result = await pool.query(query, [
      Number(data.testScore) || 0,
      Number(data.testTotalQuestions) || 10,
      Boolean(data.testPassed),
      id
    ]);
    return result.rows[0];
  }

  static async markInterviewCalled(id) {
    await this.ensureEnhancedSchema();
    const query = `
      UPDATE applications
      SET interview_called = TRUE, interview_called_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getByUserId(userId) {
    await this.ensureEnhancedSchema();
    const query = `
      SELECT
        a.*,
        j.title AS job_title,
        j.location,
        j.status AS job_status,
        j.apply_mode,
        j.predefined_form_key,
        j.custom_form_fields,
        j.google_form_url,
        j.manager_instructions,
        c.name AS company_name
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}

module.exports = Application;
