const pool = require('../config/database');

class Job {
  static async syncIdSequence() {
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('jobs', 'id'),
        COALESCE((SELECT MAX(id) FROM jobs), 0) + 1,
        false
      );
    `);
  }

  static async ensureEnhancedSchema() {
    const query = `
      ALTER TABLE jobs
      ADD COLUMN IF NOT EXISTS apply_mode VARCHAR(50) DEFAULT 'direct_profile',
      ADD COLUMN IF NOT EXISTS predefined_form_key VARCHAR(80),
      ADD COLUMN IF NOT EXISTS custom_form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS google_form_url TEXT,
      ADD COLUMN IF NOT EXISTS manager_instructions TEXT,
      ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_by INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `;

    await pool.query(query);
    await this.syncIdSequence();
  }

  static async create(companyId, title, description, salaryMin, salaryMax, location, options = {}) {
    await this.ensureEnhancedSchema();
    const query = `
      INSERT INTO jobs (
        company_id,
        title,
        description,
        salary_min,
        salary_max,
        location,
        status,
        apply_mode,
        predefined_form_key,
        custom_form_fields,
        google_form_url,
        manager_instructions,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, $9::jsonb, $10, $11, $12, $12)
      RETURNING *
    `;
    const result = await pool.query(query, [
      companyId,
      title,
      description,
      salaryMin,
      salaryMax,
      location,
      options.applyMode || 'direct_profile',
      options.predefinedFormKey || null,
      JSON.stringify(Array.isArray(options.customFormFields) ? options.customFormFields : []),
      options.googleFormUrl || null,
      options.managerInstructions || null,
      options.createdBy || null
    ]);
    return result.rows[0];
  }

  static async getAll() {
    await this.ensureEnhancedSchema();
    const query = `SELECT j.*, c.name as company_name, u.name as created_by_name, u.email as created_by_email FROM jobs j
                   LEFT JOIN companies c ON j.company_id = c.id
                   LEFT JOIN users u ON j.created_by = u.id`;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getById(id) {
    await this.ensureEnhancedSchema();
    const query = `SELECT j.*, c.name as company_name, u.name as created_by_name, u.email as created_by_email FROM jobs j
                   LEFT JOIN companies c ON j.company_id = c.id
                   LEFT JOIN users u ON j.created_by = u.id
                   WHERE j.id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    await this.ensureEnhancedSchema();
    const query = 'UPDATE jobs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    await this.ensureEnhancedSchema();
    const query = 'DELETE FROM jobs WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Job;
