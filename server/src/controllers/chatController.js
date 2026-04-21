const pool = require("../config/db");

const getContacts = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // typically "student" or "lecturer"

        let query = "";
        let queryParams = [];

        if (userRole === 'student') {
            // Students only see lecturers
            query = `
                SELECT id, full_name, email, role, profile_image
                FROM users
                WHERE role = 'lecturer'
                ORDER BY full_name ASC
            `;
        } else if (userRole === 'lecturer') {
            // Lecturers see only students who have an existing message history with them
            query = `
                SELECT DISTINCT u.id, u.full_name, u.email, u.role, u.profile_image
                FROM users u
                JOIN chat_messages cm ON (cm.sender_id = u.id OR cm.receiver_id = u.id)
                WHERE u.role = 'student' 
                  AND (cm.sender_id = $1 OR cm.receiver_id = $1)
                  AND u.id != $1
                ORDER BY u.full_name ASC
            `;
            queryParams = [userId];
        } else {
            // Admins see everyone
            query = `
                SELECT id, full_name, email, role, profile_image
                FROM users
                WHERE id != $1
                ORDER BY full_name ASC
            `;
            queryParams = [userId];
        }

        const contactsResult = await pool.query(query, queryParams);
        
        // Also get unread counts for each contact
        const unreadRows = await pool.query(
            `SELECT sender_id, COUNT(*) as unread_count 
             FROM chat_messages 
             WHERE receiver_id = $1 AND is_read = FALSE 
             GROUP BY sender_id`,
            [userId]
        );
        
        const unreadMap = {};
        unreadRows.rows.forEach(r => {
            unreadMap[r.sender_id] = parseInt(r.unread_count, 10);
        });

        const contacts = contactsResult.rows.map(contact => ({
            ...contact,
            unread_count: unreadMap[contact.id] || 0
        }));

        res.json(contacts);
    } catch (err) {
        console.error("Error fetching contacts:", err);
        res.status(500).json({ message: "Server error fetching contacts" });
    }
};

const getChatHistory = async (req, res) => {
    try {
        const userId = req.user.id; // me
        const { contactId } = req.params; // them

        const result = await pool.query(
            `SELECT cm1.id, cm1.sender_id, cm1.receiver_id, cm1.message, cm1.created_at,
                    cm1.is_read, cm1.reply_to_id, cm1.is_deleted, cm1.is_edited,
                    cm2.message AS reply_message_text, cm2.is_deleted AS reply_is_deleted
             FROM chat_messages cm1
             LEFT JOIN chat_messages cm2 ON cm1.reply_to_id = cm2.id
             WHERE (cm1.sender_id = $1 AND cm1.receiver_id = $2)
                OR (cm1.sender_id = $2 AND cm1.receiver_id = $1)
             ORDER BY cm1.created_at ASC`,
            [userId, contactId]
        );

        // Mark as read immediately when history is fetched
        await pool.query(
            "UPDATE chat_messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE",
            [contactId, userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching chat history:", err);
        res.status(500).json({ message: "Server error fetching chat history" });
    }
};

module.exports = {
    getContacts,
    getChatHistory
};
