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

module.exports = {
    getMyModules
};
