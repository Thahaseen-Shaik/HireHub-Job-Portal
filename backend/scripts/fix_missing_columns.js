const pool = require('../config/database');

async function fixMissingColumns() {
    try {
        console.log("Starting database schema repair...");

        const tables = ['applications', 'jobs', 'companies', 'users'];

        for (const table of tables) {
            console.log(`Checking table: ${table}...`);
            await pool.query(`
                ALTER TABLE ${table} 
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            `);
        }

        console.log("Database schema repair completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error repairing database schema:", error.message);
        process.exit(1);
    }
}

fixMissingColumns();
