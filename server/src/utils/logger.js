const pool = require("../config/db");

/**
 * Logs an activity to the activity_logs table.
 * @param {number|null} userId - The ID of the user performing the action (null if system/anonymous)
 * @param {string} action - Short uppercase string describing the action (e.g. 'LOGIN', 'CREATE_STUDENT')
 * @param {string} details - Human-readable details about the action
 */
const logActivity = async (userId, action, details) => {
    try {
        await pool.query(
            "INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)",
            [userId || null, action, details || ""]
        );
    } catch (error) {
        console.error("Error logging activity:", error.message);
    }
};

module.exports = logActivity;
