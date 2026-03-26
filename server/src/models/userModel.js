const pool = require("../config/db");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT id, full_name, email, password, role, profile_image, is_temp_password FROM users WHERE email = $1",
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

// ── Student Management ────────────────────────────────────────────────
const getStudents = async () => {
  const result = await pool.query(
    `SELECT id, full_name, email, profile_image, is_temp_password, created_at
     FROM users WHERE role = 'student' ORDER BY created_at DESC`
  );
  return result.rows;
};

const createStudent = async (full_name, email, hashedPassword) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password, role, is_temp_password)
     VALUES ($1, $2, $3, 'student', true)
     RETURNING id, full_name, email, role, is_temp_password`,
    [full_name, email, hashedPassword]
  );
  return result.rows[0];
};

const deleteStudent = async (id) => {
  await pool.query(
    "DELETE FROM users WHERE id = $1 AND role = 'student'",
    [id]
  );
};

const changePassword = async (userId, hashedPassword) => {
  await pool.query(
    "UPDATE users SET password = $1, is_temp_password = false WHERE id = $2",
    [hashedPassword, userId]
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  updateProfileImage,
  getStudents,
  createStudent,
  deleteStudent,
  changePassword,
};