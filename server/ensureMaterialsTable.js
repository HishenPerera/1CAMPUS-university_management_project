require("dotenv").config();
const pool = require("./src/config/db");

async function ensureMaterialsTable() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS module_materials (
                id SERIAL PRIMARY KEY,
                module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
                lecturer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                year INTEGER NOT NULL,
                month INTEGER NOT NULL,
                week_label VARCHAR(100) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table module_materials is ready.");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}
ensureMaterialsTable();
