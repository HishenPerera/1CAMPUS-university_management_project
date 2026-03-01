const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, full_name, email, password, role, profile_image FROM users WHERE email = $1",
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

const updateProfileImage = async (userId, imageUrl) => {
  const result = await pool.query(
    "UPDATE users SET profile_image = $1 WHERE id = $2 RETURNING id, full_name, role, profile_image",
    [imageUrl, userId]
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser,
  updateProfileImage,
};