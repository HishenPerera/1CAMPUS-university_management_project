require('dotenv').config();
const pool = require('./src/config/db');

async function test() {
    try {
        const query = `
            SELECT created_at 
            FROM activity_logs 
            WHERE action = 'LOGIN' AND created_at >= NOW() - INTERVAL '7 days'
            LIMIT 1
        `;
        const result = await pool.query(query);
        console.log("Success:", result.rows);
        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}
test();
