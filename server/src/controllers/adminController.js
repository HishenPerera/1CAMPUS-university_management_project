const bcrypt = require("bcrypt");
const pool = require("../config/db");
const {
    getAllStudents, getStudentById, createStudentRecord,
    updateStudentRecord, deleteStudentFull,
} = require("../models/studentModel");
const { createUser } = require("../models/userModel");
const logActivity = require("../utils/logger");

/* Generate 3 random temp passwords */
const generateTempPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const make = () => Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return [make(), make(), make()];
};

const generateSingleTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// GET /api/admin/students
const listStudents = async (req, res) => {
    try {
        const students = await getAllStudents();
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/temp-passwords
const getTempPasswords = async (_req, res) => {
    try {
        res.json({ passwords: generateTempPasswords() });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/students/:id
const getStudentDetail = async (req, res) => {
    try {
        const student = await getStudentById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json(student);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/students
// Creates both a users entry (portal login) AND a students record
const addStudent = async (req, res) => {
    try {
        const {
            first_name, last_name, email,
            registration_number, degree_program, studying_year, semester,
            nic_number, phone_number, address, enrolled_date,
            chosen_password,
        } = req.body;

        if (!first_name || !last_name || !email || !registration_number || !degree_program || !studying_year || !semester || !chosen_password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Create portal login account (in users table)
        const hashedPassword = await bcrypt.hash(chosen_password, 10);
        const full_name = `${first_name} ${last_name}`;
        await createUser(full_name, email, hashedPassword, "student");

        // Mark is_temp_password = true
        await pool.query("UPDATE users SET is_temp_password = true WHERE email = $1", [email]);

        // Create student profile record
        const student = await createStudentRecord({
            registration_number, first_name, last_name, email,
            nic_number, phone_number, degree_program,
            studying_year, semester, address, enrolled_date,
        });

        await logActivity(req.user.id, "CREATE_STUDENT", `Created student profile/login for ${email} (${registration_number})`);
        res.status(201).json({ message: "Student created successfully", student });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            return res.status(409).json({ message: "A student with this email or registration number already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/admin/students/:id
const editStudent = async (req, res) => {
    try {
        const updated = await updateStudentRecord(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: "Student not found" });
        res.json({ message: "Student updated", student: updated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/admin/students/:id
const removeStudent = async (req, res) => {
    try {
        await deleteStudentFull(req.params.id);
        await logActivity(req.user.id, "DELETE_STUDENT", `Deleted student record ID ${req.params.id}`);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

/* ── Applications Pipeline ─────────────────────────────────────────────── */

const getApplications = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, u.full_name as approver_name
            FROM student_applications a
            LEFT JOIN users u ON a.approved_by = u.id
            ORDER BY a.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching applications" });
    }
};

const acceptApplication = async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE student_applications SET status = 'accepted', approved_by = $1 WHERE id = $2 AND status = 'pending' RETURNING email",
            [req.user.id, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Application not found or already processed" });

        await logActivity(req.user.id, "ACCEPT_APPLICATION", `Accepted application for ${result.rows[0].email} for portal setup`);
        res.json({ message: "Application accepted. Proceed to add student to portal." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error accepting application" });
    }
};

const approveApplication = async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, nic_number, phone_number, address, degree_program, studying_year, semester } = req.body;

    try {
        // 1. Fetch application
        const appRes = await pool.query("SELECT * FROM student_applications WHERE id = $1 AND status = 'accepted'", [id]);
        if (appRes.rowCount === 0) return res.status(404).json({ message: "Application not found or not accepted yet" });
        const app = appRes.rows[0];

        // 2. Generate setup metadata
        const tempPassword = generateSingleTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Map Degree to Prefix
        const map = {
            "Bachelor of Science in Computer Science": "CS",
            "Bachelor of Science in Information Technology": "IT",
            "Bachelor of Engineering": "ENG",
            "Bachelor of Business Administration": "BBA",
            "Bachelor of Science in Data Science": "DS",
            "Bachelor of Arts": "BA",
            "Master of Science in Computer Science": "MCS",
            "Master of Business Administration": "MBA"
        };
        const prefix = map[degree_program] || "STU";

        // Find next sequential registration number FOR THIS PREFIX
        const countRes = await pool.query("SELECT COUNT(*) FROM students WHERE degree_program = $1", [degree_program]);
        const nextNum = parseInt(countRes.rows[0].count, 10) + 1;
        const shortYear = String(new Date().getFullYear()).slice(-2);
        const regNumber = `${prefix}${shortYear}${String(nextNum).padStart(4, '0')}`;
        const portalEmail = `${regNumber.toLowerCase()}@1campus.edu`;

        // 3. Begin transaction
        await pool.query("BEGIN");

        // - Update application status
        await pool.query("UPDATE student_applications SET status = 'enrolled' WHERE id = $1", [id]);

        // - Create User record
        const newUserQuery = await pool.query(
            "INSERT INTO users (full_name, email, password, role, is_temp_password) VALUES ($1, $2, $3, 'student', true) RETURNING id",
            [`${first_name} ${last_name}`, portalEmail, hashedPassword]
        );
        const newUserId = newUserQuery.rows[0].id;

        // - Create Student record using the existing model function
        await createStudentRecord({
            registration_number: regNumber,
            first_name, last_name, email: portalEmail,
            nic_number, phone_number: phone_number || null,
            degree_program,
            studying_year: studying_year || 1,
            semester: semester || 1,
            address: address || null
        });

        await logActivity(req.user.id, "APPROVE_APPLICATION", `Created student portal account for ${portalEmail} (${regNumber})`);

        await pool.query("COMMIT");

        res.json({
            message: "Student Portal Account created successfully",
            temp_password: tempPassword,
            reg_number: regNumber,
            portal_email: portalEmail
        });
    } catch (err) {
        await pool.query("ROLLBACK");
        console.error(err);
        if (err.code === "23505") { // Unique violation on email
            return res.status(409).json({ message: "A user with this email already exists in the system." });
        }
        res.status(500).json({ message: "Server error processing application" });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const result = await pool.query(
            "UPDATE student_applications SET status = 'rejected' WHERE id = $1 AND status = 'pending' RETURNING email",
            [req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ message: "Application not found or already processed" });

        await logActivity(req.user.id, "REJECT_APPLICATION", `Rejected application for ${result.rows[0].email}`);
        res.json({ message: "Application rejected" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error rejecting application" });
    }
};

/* ── Module & Lecturer Management Pipeline ─────────────────────────────── */

const listModules = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, 
            COALESCE(json_agg(json_build_object('id', u.id, 'name', u.full_name)) FILTER (WHERE u.id IS NOT NULL), '[]') as assigned_lecturers
            FROM modules m
            LEFT JOIN lecturer_modules lm ON m.id = lm.module_id
            LEFT JOIN users u ON lm.lecturer_id = u.id
            GROUP BY m.id
            ORDER BY m.semester, m.module_code
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching modules" });
    }
};

const getLecturers = async (req, res) => {
    try {
        const result = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'lecturer' ORDER BY full_name ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching lecturers" });
    }
};

const addModule = async (req, res) => {
    const { module_code, module_name, degree_program, semester, studying_year } = req.body;
    if (!module_code || !module_name || !degree_program || !semester || !studying_year) {
        return res.status(400).json({ message: "Missing required module fields" });
    }

    try {
        const result = await pool.query(
            "INSERT INTO modules (module_code, module_name, degree_program, semester, studying_year) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [module_code, module_name, degree_program, semester, studying_year]
        );
        await logActivity(req.user.id, "CREATE_MODULE", `Created module ${module_code} - ${module_name}`);
        res.status(201).json({ message: "Module created", module: result.rows[0] });
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ message: "Module code already exists" });
        res.status(500).json({ message: "Server error creating module" });
    }
};

const deleteModule = async (req, res) => {
    try {
        const result = await pool.query("DELETE FROM modules WHERE id = $1 RETURNING module_code", [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ message: "Module not found" });

        await logActivity(req.user.id, "DELETE_MODULE", `Deleted module ${result.rows[0].module_code}`);
        res.json({ message: "Module deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error deleting module" });
    }
};

const assignModule = async (req, res) => {
    const { id } = req.params; // module_id
    const { lecturer_id } = req.body;
    if (!lecturer_id) return res.status(400).json({ message: "Lecturer ID is required" });

    try {
        // verify lecturer exists and is a lecturer
        const lectRes = await pool.query("SELECT id, full_name FROM users WHERE id = $1 AND role = 'lecturer'", [lecturer_id]);
        if (lectRes.rowCount === 0) return res.status(404).json({ message: "Lecturer not found or invalid role" });

        await pool.query("INSERT INTO lecturer_modules (lecturer_id, module_id) VALUES ($1, $2)", [lecturer_id, id]);

        await logActivity(req.user.id, "ASSIGN_MODULE", `Assigned module #${id} to lecturer ${lectRes.rows[0].full_name}`);
        res.json({ message: "Lecturer assigned to module successfully" });
    } catch (err) {
        if (err.code === "23505") return res.status(409).json({ message: "Lecturer is already assigned to this module" });
        res.status(500).json({ message: "Server error assigning module" });
    }
};

const removeModuleAssignment = async (req, res) => {
    const { id, lecturerId } = req.params;
    try {
        await pool.query("DELETE FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2", [id, lecturerId]);
        await logActivity(req.user.id, "REMOVE_ASSIGNMENT", `Removed lecturer #${lecturerId} assignment from module #${id}`);
        res.json({ message: "Assignment removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error removing assignment" });
    }
};

module.exports = {
    listStudents, getTempPasswords, getStudentDetail, addStudent, editStudent, removeStudent,
    getApplications, acceptApplication, approveApplication, rejectApplication,
    listModules, getLecturers, addModule, deleteModule, assignModule, removeModuleAssignment
};
