const pool = require("../config/db");

// GET /api/student/profile — fetch own profile from students table
const getMyProfile = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Retrieve email from users table since JWT only has id
        const userResult = await pool.query(
            "SELECT email, full_name, profile_image FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });

        const email = userResult.rows[0].email;
        const profileImagePath = userResult.rows[0].profile_image;

        const studentResult = await pool.query(
            `SELECT s.*, s.first_name || ' ' || s.last_name AS full_name
       FROM students s
       WHERE s.email = $1`,
            [email]
        );

        if (!studentResult.rows[0]) {
            // No student record yet — return basic info only
            return res.json({
                email,
                full_name: userResult.rows[0].full_name,
                profile_image: profileImagePath || null,
                hasProfile: false,
            });
        }

        res.json({
            ...studentResult.rows[0],
            profile_image: profileImagePath || null,
            hasProfile: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/student/profile — update own editable fields only
const updateMyProfile = async (req, res) => {
    try {
        const { phone_number, address } = req.body;

        // Get email from DB
        const userResult = await pool.query(
            "SELECT email FROM users WHERE id = $1",
            [req.user.id]
        );
        if (!userResult.rows[0]) return res.status(404).json({ message: "User not found" });
        const email = userResult.rows[0].email;

        const result = await pool.query(
            `UPDATE students
       SET phone_number = COALESCE($1, phone_number),
           address      = COALESCE($2, address)
       WHERE email = $3
       RETURNING *`,
            [phone_number || null, address || null, email]
        );

        if (!result.rows[0]) return res.status(404).json({ message: "Student profile not found" });

        res.json({ message: "Profile updated", student: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { getMyProfile, updateMyProfile };
