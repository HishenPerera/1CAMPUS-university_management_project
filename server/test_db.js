const pool = require('./src/config/db');
async function run() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'modules'");
        console.log(res.rows);
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        pool.end();
    }
}
run();
