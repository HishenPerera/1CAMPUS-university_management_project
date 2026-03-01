const bcrypt = require("bcrypt");
const {
    getAllStudents, getStudentById, createStudentRecord,
    updateStudentRecord, deleteStudentFull,
} = require("../models/studentModel");
const { createUser } = require("../models/userModel");

/* Generate 3 random temp passwords */
const generateTempPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const make = () => Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return [make(), make(), make()];
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
        const pool = require("../config/db");
        await pool.query("UPDATE users SET is_temp_password = true WHERE email = $1", [email]);

        // Create student profile record
        const student = await createStudentRecord({
            registration_number, first_name, last_name, email,
            nic_number, phone_number, degree_program,
            studying_year, semester, address, enrolled_date,
        });

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
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { listStudents, getTempPasswords, getStudentDetail, addStudent, editStudent, removeStudent };
