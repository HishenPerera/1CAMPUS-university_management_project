const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows[0];
};

const createUser = async (full_name, email, password, role) => {
  const result = await pool.query(
    "INSERT INTO users (full_name, email, password, role) VALUES ($1,$2,$3,$4) RETURNING *",
    [full_name, email, password, role]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
};