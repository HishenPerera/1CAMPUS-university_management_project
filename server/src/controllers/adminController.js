const bcrypt = require("bcrypt");
const { getStudents, createStudent, deleteStudent } = require("../models/userModel");

// Generate a random temp password: 3 options
const generateTempPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const make = () => Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return [make(), make(), make()];
};

// GET /api/admin/students
const listStudents = async (req, res) => {
    try {
        const students = await getStudents();
        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/temp-passwords — returns 3 fresh temp passwords (plaintext, not stored yet)
const getTempPasswords = async (req, res) => {
    try {
        res.json({ passwords: generateTempPasswords() });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/students
const addStudent = async (req, res) => {
    try {
        const { full_name, email, chosen_password } = req.body;

        if (!full_name || !email || !chosen_password) {
            return res.status(400).json({ message: "full_name, email, and chosen_password are required" });
        }

        const hashedPassword = await bcrypt.hash(chosen_password, 10);
        const student = await createStudent(full_name, email, hashedPassword);

        res.status(201).json({
            message: "Student created successfully",
            student,
        });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            return res.status(409).json({ message: "A user with this email already exists" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/admin/students/:id
const removeStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteStudent(id);
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { listStudents, getTempPasswords, addStudent, removeStudent };
