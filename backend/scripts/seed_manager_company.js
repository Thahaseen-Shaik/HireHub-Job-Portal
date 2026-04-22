const pool = require('../config/database');

async function seedCompany() {
    try {
        const managerResult = await pool.query("SELECT id FROM users WHERE email = 'manager@hirehub.com'");
        if (managerResult.rows.length === 0) {
            console.log("Manager user not found.");
            process.exit(0);
        }
        const managerId = managerResult.rows[0].id;
        
        await pool.query(`
            INSERT INTO companies (name, owner_id, email, phone, website, description, status) 
            VALUES ('Shnoor HireHub', $1, 'manager@hirehub.com', '123-456-7890', 'hirehub.com', 'Default demo company', 'approved')
            ON CONFLICT (email) DO NOTHING
        `, [managerId]);
        
        console.log("Demo company seeded successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding company:", err);
        process.exit(1);
    }
}

seedCompany();
