const pool = require("../config/db");

// Get all students with their portal account status
const getAllStudents = async () => {
    const result = await pool.query(`
    SELECT
      s.id,
      s.registration_number,
      s.first_name,
      s.last_name,
      s.first_name || ' ' || s.last_name AS full_name,
      s.email,
      s.nic_number,
      s.phone_number,
      s.degree_program,
      s.studying_year,
      s.semester,
      s.address,
      s.enrolled_date,
      s.status,
      s.created_at,
      u.id            AS user_id,
      u.is_temp_password,
      u.profile_image
    FROM students s
    LEFT JOIN users u ON u.email = s.email AND u.role = 'student'
    ORDER BY s.created_at DESC
  `);
    return result.rows;
};

// Get single student detail
const getStudentByEmail = async (email) => {
    const result = await pool.query(`
    SELECT
      s.*,
      s.first_name || ' ' || s.last_name AS full_name,
      u.id AS user_id, u.is_temp_password, u.profile_image
    FROM students s
    LEFT JOIN users u ON u.email = s.email AND u.role = 'student'
    WHERE s.email = $1
  `, [email]);
    return result.rows[0];
};

const getStudentById = async (id) => {
    const result = await pool.query(`
    SELECT
      s.*,
      s.first_name || ' ' || s.last_name AS full_name,
      u.id AS user_id, u.is_temp_password, u.profile_image
    FROM students s
    LEFT JOIN users u ON u.email = s.email AND u.role = 'student'
    WHERE s.id = $1
  `, [id]);
    return result.rows[0];
};

// Insert full student record
const createStudentRecord = async ({
    registration_number, first_name, last_name, email,
    nic_number, phone_number, degree_program, studying_year,
    semester, address, enrolled_date
}) => {
    const result = await pool.query(`
    INSERT INTO students
      (registration_number, first_name, last_name, email,
       nic_number, phone_number, degree_program, studying_year,
       semester, address, enrolled_date)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *
  `, [
        registration_number, first_name, last_name, email,
        nic_number || null, phone_number || null, degree_program,
        studying_year, semester, address || null,
        enrolled_date || new Date().toISOString().split("T")[0]
    ]);
    return result.rows[0];
};

// Update student record fields
const updateStudentRecord = async (id, fields) => {
    const {
        first_name, last_name, nic_number, phone_number,
        degree_program, studying_year, semester, address, status
    } = fields;
    const result = await pool.query(`
    UPDATE students SET
      first_name     = COALESCE($1, first_name),
      last_name      = COALESCE($2, last_name),
      nic_number     = COALESCE($3, nic_number),
      phone_number   = COALESCE($4, phone_number),
      degree_program = COALESCE($5, degree_program),
      studying_year  = COALESCE($6, studying_year),
      semester       = COALESCE($7, semester),
      address        = COALESCE($8, address),
      status         = COALESCE($9, status)
    WHERE id = $10
    RETURNING *
  `, [first_name, last_name, nic_number, phone_number,
        degree_program, studying_year, semester, address, status, id]);
    return result.rows[0];
};

// Delete student record AND users entry
const deleteStudentFull = async (studentId) => {
    // First get the email so we can delete the auth user too
    const rec = await pool.query("SELECT email FROM students WHERE id = $1", [studentId]);
    if (rec.rows[0]) {
        const { email } = rec.rows[0];
        await pool.query("DELETE FROM users WHERE email = $1 AND role = 'student'", [email]);
    }
    await pool.query("DELETE FROM students WHERE id = $1", [studentId]);
};

module.exports = {
    getAllStudents,
    getStudentByEmail,
    getStudentById,
    createStudentRecord,
    updateStudentRecord,
    deleteStudentFull,
};
