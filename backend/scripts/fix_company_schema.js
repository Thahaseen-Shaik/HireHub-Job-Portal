const pool = require('../config/database');

async function fixCompanySchema() {
    try {
        console.log("Fixing companies table schema...");
        await pool.query(`
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS owner_id INT REFERENCES users(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS website TEXT,
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);
        console.log("Schema fix completed.");
        process.exit(0);
    } catch (err) {
        console.error("Schema fix failed:", err);
        process.exit(1);
    }
}

fixCompanySchema();
