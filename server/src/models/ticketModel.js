const pool = require("../config/db");

// Create a new ticket
const createTicket = async (studentId, type, title, description) => {
    const result = await pool.query(
        "INSERT INTO tickets (student_id, type, title, description) VALUES ($1, $2, $3, $4) RETURNING *",
        [studentId, type, title, description]
    );
    return result.rows[0];
};

// Get tickets for a specific student
const getTicketsByStudent = async (studentId) => {
    const result = await pool.query(
        "SELECT * FROM tickets WHERE student_id = $1 ORDER BY created_at DESC",
        [studentId]
    );
    return result.rows;
};

// Get all tickets for admin
const getAllTickets = async () => {
    const result = await pool.query(
        `SELECT t.*, u.full_name as student_name, u.email as student_email 
         FROM tickets t 
         JOIN users u ON t.student_id = u.id 
         ORDER BY t.created_at DESC`
    );
    return result.rows;
};

// Update ticket status and admin comment
const updateTicketStatus = async (id, status, adminComment) => {
    const result = await pool.query(
        "UPDATE tickets SET status = $1, admin_comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
        [status, adminComment, id]
    );
    return result.rows[0];
};

module.exports = {
    createTicket,
    getTicketsByStudent,
    getAllTickets,
    updateTicketStatus,
};
