require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query("ALTER TABLE student_applications DROP CONSTRAINT student_applications_status_check;");
    await pool.query("ALTER TABLE student_applications ADD CONSTRAINT student_applications_status_check CHECK (status IN ('pending', 'accepted', 'approved', 'rejected', 'enrolled'));");
    console.log("Constraint updated successfully.");
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
