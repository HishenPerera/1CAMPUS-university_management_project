const pool = require("../config/db");

// POST /api/public/apply
const submitApplication = async (req, res) => {
    try {
        const {
            first_name, last_name, email,
            nic_number, phone_number, address,
            degree_program
        } = req.body;

        if (!first_name || !last_name || !email || !nic_number || !degree_program) {
            return res.status(400).json({ message: "Missing required fields for application" });
        }

        // Check if application already exists for this email
        const existingApp = await pool.query("SELECT id FROM student_applications WHERE email = $1", [email]);
        if (existingApp.rowCount > 0) {
            return res.status(409).json({ message: "An application with this email address has already been submitted." });
        }

        // Check if user already exists (maybe they are already in the system)
        const existingUser = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rowCount > 0) {
            return res.status(409).json({ message: "An account with this email address already exists in the system." });
        }

        await pool.query(
            `INSERT INTO student_applications 
             (first_name, last_name, email, nic_number, phone_number, address, degree_program, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [first_name, last_name, email, nic_number, phone_number, address, degree_program, 'pending']
        );

        res.status(201).json({ message: "Application submitted successfully" });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") { // Unique violation fallback
            return res.status(409).json({ message: "An application with these details already exists." });
        }
        res.status(500).json({ message: "Server error processing application" });
    }
};

module.exports = {
    submitApplication
};
