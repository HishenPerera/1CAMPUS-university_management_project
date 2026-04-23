const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

exports.getAllNotices = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT n.*, u.full_name as lecturer_name 
            FROM notices n
            JOIN users u ON n.lecturer_id = u.id
            ORDER BY n.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching notices:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.createNotice = async (req, res) => {
    const { title, content } = req.body;
    const lecturer_id = req.user.id;
    const file_path = req.file ? `/uploads/notices/${req.file.filename}` : null;

    try {
        const result = await pool.query(
            "INSERT INTO notices (title, content, lecturer_id, file_path) VALUES ($1, $2, $3, $4) RETURNING *",
            [title, content, lecturer_id, file_path]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error creating notice:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.updateNotice = async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const lecturer_id = req.user.id;

    try {
        // Check if notice exists and belongs to this lecturer
        const noticeCheck = await pool.query("SELECT * FROM notices WHERE id = $1", [id]);
        if (noticeCheck.rows.length === 0) {
            return res.status(404).json({ message: "Notice not found" });
        }

        if (noticeCheck.rows[0].lecturer_id !== lecturer_id && req.user.role !== "web_admin") {
            return res.status(403).json({ message: "Unauthorized to update this notice" });
        }

        let file_path = noticeCheck.rows[0].file_path;
        if (req.file) {
            // Delete old file if exists
            if (file_path) {
                const oldPath = path.join(__dirname, "../..", file_path);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            file_path = `/uploads/notices/${req.file.filename}`;
        }

        const result = await pool.query(
            "UPDATE notices SET title = $1, content = $2, file_path = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
            [title, content, file_path, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating notice:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.deleteNotice = async (req, res) => {
    const { id } = req.params;
    const lecturer_id = req.user.id;

    try {
        const noticeCheck = await pool.query("SELECT * FROM notices WHERE id = $1", [id]);
        if (noticeCheck.rows.length === 0) {
            return res.status(404).json({ message: "Notice not found" });
        }

        if (noticeCheck.rows[0].lecturer_id !== lecturer_id && req.user.role !== "web_admin") {
            return res.status(403).json({ message: "Unauthorized to delete this notice" });
        }

        // Delete associated file
        const file_path = noticeCheck.rows[0].file_path;
        if (file_path) {
            const fullPath = path.join(__dirname, "../..", file_path);
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
            }
        }

        await pool.query("DELETE FROM notices WHERE id = $1", [id]);
        res.json({ message: "Notice deleted successfully" });
    } catch (error) {
        console.error("Error deleting notice:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
