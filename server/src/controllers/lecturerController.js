const pool = require("../config/db");

// GET /api/lecturer/modules
const getMyModules = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const result = await pool.query(`
            SELECT m.* 
            FROM modules m
            JOIN lecturer_modules lm ON m.id = lm.module_id
            WHERE lm.lecturer_id = $1
            ORDER BY m.semester, m.module_code
        `, [lecturerId]);

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching lecturer modules:", err);
        res.status(500).json({ message: "Server error fetching your modules" });
    }
};

// GET /api/lecturer/modules/:id/materials
const getModuleMaterials = async (req, res) => {
    const { id } = req.params;
    const { year } = req.query;
    try {
        const lecturerId = req.user.id;
        // Verify ownership
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [id, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to view this module's materials." });
        }

        let query = "SELECT * FROM module_materials WHERE module_id = $1 AND lecturer_id = $2";
        let params = [id, lecturerId];

        if (year) {
            query += " AND year = $3";
            params.push(year);
        }
        
        query += " ORDER BY month ASC, week_label ASC, created_at DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching materials:", err);
        res.status(500).json({ message: "Server error fetching materials." });
    }
};

// POST /api/lecturer/modules/:id/materials
const uploadModuleMaterial = async (req, res) => {
    const { id } = req.params;
    const lecturerId = req.user.id;
    const { year, month, week_label, file_type, file_name, file_url } = req.body;
    
    try {
        // Verify ownership
        const authCheck = await pool.query(
            "SELECT 1 FROM lecturer_modules WHERE module_id = $1 AND lecturer_id = $2",
            [id, lecturerId]
        );
        if (authCheck.rowCount === 0) {
            return res.status(403).json({ message: "Not authorized to upload materials to this module." });
        }

        // Determine actual file_url and file_name if uploaded
        let finalUrl = file_url;
        let finalName = file_name;

        if (req.file) {
            finalUrl = "/uploads/materials/" + req.file.filename;
            finalName = file_name || req.file.originalname;
        }

        if (!finalUrl || !finalName) {
            return res.status(400).json({ message: "File or link must be provided." });
        }

        const result = await pool.query(`
            INSERT INTO module_materials (module_id, lecturer_id, year, month, week_label, file_name, file_url, file_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [id, lecturerId, year, month, week_label, finalName, finalUrl, file_type]);

        res.status(201).json({ message: "Material uploaded successfully", material: result.rows[0] });
    } catch (err) {
        console.error("Error uploading material:", err);
        res.status(500).json({ message: "Failed to upload material." });
    }
};

// DELETE /api/lecturer/modules/materials/:material_id
const deleteModuleMaterial = async (req, res) => {
    const { material_id } = req.params;
    const lecturerId = req.user.id;
    
    try {
        const materialCheck = await pool.query(
            "SELECT * FROM module_materials WHERE id = $1 AND lecturer_id = $2", 
            [material_id, lecturerId]
        );

        if (materialCheck.rowCount === 0) {
            return res.status(404).json({ message: "Material not found or unauthorized." });
        }

        await pool.query("DELETE FROM module_materials WHERE id = $1", [material_id]);

        // If it's an uploaded file, we optionally could delete from disk `fs.unlinkSync`
        // but for simplicity/safety we just remove from DB right now.
        const fs = require('fs');
        const path = require('path');
        const mat = materialCheck.rows[0];
        if (mat.file_url.startsWith('/uploads/materials/')) {
            const filepath = path.join(__dirname, '../../', mat.file_url);
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        res.json({ message: "Material deleted successfully." });
    } catch (err) {
        console.error("Error deleting material:", err);
        res.status(500).json({ message: "Failed to delete material." });
    }
};

module.exports = {
    getMyModules,
    getModuleMaterials,
    uploadModuleMaterial,
    deleteModuleMaterial
};
