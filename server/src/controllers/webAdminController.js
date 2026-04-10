const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { createUser } = require("../models/userModel");
const logActivity = require("../utils/logger");
const fs = require('fs');
const path = require('path');
const { backupDatabase } = require('../../cronJobs');

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

// --- database backup ---
const createBackup = async (req, res) => {
    try {
        await backupDatabase();
        res.status(200).json({ message: "Backup initiated successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to create backup" });
    }
};

const getBackups = async (req, res) => {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) return res.json([]);

    const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql'))
        .map(file => {
            const stats = fs.statSync(path.join(backupDir, file));
            return {
                name: file,
                size: (stats.size / 1024).toFixed(2) + " KB",
                createdAt: stats.birthtime
            };
        });
    res.json(files);
};

const downloadBackup = (req, res) => {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, filename);

    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error("Download error:", err);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Error downloading file" });
                }
            }
        });
    } else {
        res.status(404).json({ message: "Backup file not found" });
    }
};

const deleteBackup = (req, res) => {
    const { filename } = req.params;
    const backupDir = path.join(__dirname, '../../backups');
    const filePath = path.join(backupDir, filename);

    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: "Backup deleted successfully" });
        } catch (err) {
            console.error("Delete error:", err);
            res.status(500).json({ message: "Error deleting backup" });
        }
    } else {
        res.status(404).json({ message: "Backup file not found" });
    }
};

// GET /api/webadmin/admins
const getWebAdmins = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, full_name, email, role, is_temp_password, profile_image, created_at
            FROM users
            WHERE role = 'web_admin'
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching web admins" });
    }
};

// POST /api/webadmin/admins
const createWebAdmin = async (req, res) => {
    try {
        const { full_name, email, role, chosen_password } = req.body;

        if (!full_name || !email || !role || !chosen_password) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (role !== 'web_admin') {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const hashedPassword = await bcrypt.hash(chosen_password, 10);
        const newUser = await createUser(full_name, email, hashedPassword, role);

        // Set temp password flag
        await pool.query("UPDATE users SET is_temp_password = true WHERE id = $1", [newUser.id]);

        await logActivity(req.user.id, "CREATE_WEB_ADMIN", `Created web_admin account for ${email}`);
        res.status(201).json({ message: "Web Admin account created successfully", user: { ...newUser, is_temp_password: true } });
    } catch (err) {
        console.error(err);
        if (err.code === "23505") {
            return res.status(409).json({ message: "A user with this email already exists" });
        }
        res.status(500).json({ message: "Server error creating Web Admin account" });
    }
};

// DELETE /api/webadmin/admins/:id
const deleteWebAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent web admin from deleting themselves
        if (Number(id) === req.user.id) {
            return res.status(403).json({ message: "You cannot delete your own account." });
        }

        const userRes = await pool.query("SELECT email, role FROM users WHERE id = $1", [id]);
        if (userRes.rowCount === 0) return res.status(404).json({ message: "User not found" });

        const user = userRes.rows[0];
        if (user.role !== 'web_admin') {
            return res.status(400).json({ message: "User is not a web administrator." });
        }

        await pool.query("DELETE FROM users WHERE id = $1", [id]);
        await logActivity(req.user.id, "DELETE_WEB_ADMIN", `Deleted web_admin account (${user.email})`);
        res.json({ message: "Web Admin account deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting Web Admin account" });
    }
};

/* ── Database Management ─────────────────────────────────────────────── */

// WHITELIST of tables the web admin is allowed to inspect / modify
const ALLOWED_TABLES = [
    'users', 'students', 'student_applications', 'modules',
    'lecturer_modules', 'module_materials', 'quizzes', 'quiz_questions',
    'quiz_submissions', 'activity_logs', 'tickets'
];

// GET /api/webadmin/db/tables — list all permitted tables with row counts
const listTables = async (req, res) => {
    try {
        const counts = await Promise.all(
            ALLOWED_TABLES.map(async (table) => {
                try {
                    const r = await pool.query(`SELECT COUNT(*) FROM "${table}"`);
                    return { name: table, rows: parseInt(r.rows[0].count, 10) };
                } catch {
                    return { name: table, rows: 0 };
                }
            })
        );
        res.json(counts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error listing tables' });
    }
};

// GET /api/webadmin/db/tables/:table — paginated, filtered, sorted rows
const getTableData = async (req, res) => {
    const { table } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(403).json({ message: 'Access to this table is not permitted' });
    }

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const offset = (page - 1) * pageSize;
    const search = (req.query.search || '').trim();
    const sortCol = req.query.sort || 'id';
    const sortDir = req.query.dir === 'desc' ? 'DESC' : 'ASC';

    try {
        // Fetch column names to build safe sort / search
        const colRes = await pool.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = $1
             ORDER BY ordinal_position`, [table]
        );
        const columns = colRes.rows.map(r => r.column_name);
        const safeSort = columns.includes(sortCol) ? sortCol : (columns.includes('id') ? 'id' : columns[0]);

        let whereClause = '';
        const params = [];
        if (search) {
            // Cast every column to text and search
            const conditions = columns.map((col, i) => {
                params.push(`%${search}%`);
                return `CAST("${col}" AS TEXT) ILIKE $${i + 1}`;
            });
            whereClause = `WHERE ${conditions.join(' OR ')}`;
        }

        const dataRes = await pool.query(
            `SELECT * FROM "${table}" ${whereClause}
             ORDER BY "${safeSort}" ${sortDir}
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, offset]
        );

        const countRes = await pool.query(
            `SELECT COUNT(*) FROM "${table}" ${whereClause}`, params
        );

        res.json({
            columns,
            rows: dataRes.rows,
            total: parseInt(countRes.rows[0].count, 10),
            page,
            pageSize,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Server error reading table: ${err.message}` });
    }
};

// DELETE /api/webadmin/db/tables/:table/:id — delete a single row by primary key
const deleteTableRow = async (req, res) => {
    const { table, id } = req.params;
    if (!ALLOWED_TABLES.includes(table)) {
        return res.status(403).json({ message: 'Access to this table is not permitted' });
    }
    // Protect critical system records
    if (table === 'users' && Number(id) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    try {
        // Find primary key column for this table
        const pkRes = await pool.query(
            `SELECT kcu.column_name FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
               ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
             WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1
             LIMIT 1`, [table]
        );
        const pk = pkRes.rows[0]?.column_name || 'id';

        const result = await pool.query(
            `DELETE FROM "${table}" WHERE "${pk}" = $1 RETURNING *`, [id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Row not found' });
        }
        await logActivity(req.user.id, 'DB_DELETE_ROW', `Deleted row ${pk}=${id} from table ${table}`);
        res.json({ message: `Row deleted from ${table}`, deleted: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Server error deleting row: ${err.message}` });
    }
};

module.exports = {
    getAuditLogs,
    getStaff,
    getStaffTempPasswords,
    createStaff,
    deleteStaff,
    getWebAdmins,
    createWebAdmin,
    deleteWebAdmin,
    createBackup,
    getBackups,
    listTables,
    getTableData,
    deleteTableRow,
};
