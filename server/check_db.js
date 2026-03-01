require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
});
async function run() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'students'");
  console.log(res.rows.map(r => r.column_name));
  process.exit();
}
run();
