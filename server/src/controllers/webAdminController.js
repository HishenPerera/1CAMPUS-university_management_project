const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { createUser } = require("../models/userModel");
const logActivity = require("../utils/logger");

// Password generator
const generateTempPasswords = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    const make = () => Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return [make(), make(), make()];
};

// GET /api/webadmin/logs
const getAuditLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.action, a.details, a.created_at, u.email, u.role
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 500
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching logs" });
    }
};

// GET /api/webadmin/staff
const getStaff = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, full_name, email, role, is_temp_password, profile_image, created_at
            FROM users
            WHERE role IN ('lecturer', 'admin_staff')
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching staff" });
    }
};

// GET /api/webadmin/temp-passwords (reused from admin Logic)
const getStaffTempPasswords = async (_req, res) => {
    res.json({ passwords: generateTempPasswords() });
};

// POST /api/webadmin/staff
const createStaff = async (req, res) => {
    try {
        const { full_name, email, role, chosen_password } = req.body;

        if (!full_name || !email || !role || !chosen_password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!['lecturer', 'admin_staff'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const hashedPassword = await bcrypt.hash(chosen_password, 10);
        const newUser = await createUser(full_name, email, hashedPassword, role);

        // Set temp password flag
        await pool.query("UPDATE users SET is_temp_password = true WHERE id = $1", [newUser.id]);

        await logActivity(req.user.id, "CREATE_STAFF", `Created ${role} account for ${email}`);
        res.status(201).json({ message: "Staff account created successfully", user: { ...newUser, is_temp_password: true } });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            return res.status(409).json({ message: "A user with this email already exists" });
        }
        res.status(500).json({ message: "Server error creating staff account" });
    }
};

// DELETE /api/webadmin/staff/:id
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent web admin from deleting themselves
        if (Number(id) === req.user.id) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        const userRes = await pool.query("SELECT email, role FROM users WHERE id = $1", [id]);
        if (userRes.rowCount === 0) return res.status(404).json({ message: "User not found" });

        const user = userRes.rows[0];
        if (user.role === 'web_admin') {
            return res.status(403).json({ message: "Cannot delete web administrators" });
        }

        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        await logActivity(req.user.id, "DELETE_STAFF", `Deleted ${user.role} account (${user.email})`);
        res.json({ message: "Staff account deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting staff account" });
    }
};

module.exports = {
    getAuditLogs,
    getStaff,
    getStaffTempPasswords,
    createStaff,
    deleteStaff
};
