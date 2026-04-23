const ticketModel = require("../models/ticketModel");

/**
 * Create a new support ticket for the current student.
 *
 * @param {object} req - Express request object.
 * @param {object} req.body - Request payload.
 * @param {string} req.body.type - Ticket category or type.
 * @param {string} req.body.title - Ticket title.
 * @param {string} [req.body.description] - Optional ticket description.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with created ticket or error message.
 */
const raiseTicket = async (req, res) => {
    try {
        const { type, title, description } = req.body;
        const studentId = req.user.id;

        if (!type || !title) {
            return res.status(400).json({ message: "Type and Title are required" });
        }

        const ticket = await ticketModel.createTicket(studentId, type, title, description);
        res.status(201).json({ message: "Ticket raised successfully", ticket });
    } catch (error) {
        console.error("Error raising ticket:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Retrieve tickets owned by the authenticated student.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with student tickets or error message.
 */
const getMyTickets = async (req, res) => {
    try {
        const studentId = req.user.id;
        const tickets = await ticketModel.getTicketsByStudent(studentId);
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error fetching student tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Retrieve all support tickets for admin staff.
 *
 * @param {object} req - Express request object.
 * @param {object} req.user - Authenticated user object.
 * @param {string} req.user.role - Role of the authenticated user.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with all tickets or access/error response.
 */
const getAllTickets = async (req, res) => {
    try {
        // Only admin staff may access the full ticket list.
        if (req.user.role !== "admin_staff") {
            return res.status(403).json({ message: "Access denied" });
        }
        const tickets = await ticketModel.getAllTickets();
        res.status(200).json(tickets);
    } catch (error) {
        console.error("Error fetching all tickets:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Update the status of an existing ticket and optionally add an admin comment.
 *
 * @param {object} req - Express request object.
 * @param {object} req.user - Authenticated user object.
 * @param {string} req.user.role - Role of the authenticated user.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Ticket identifier.
 * @param {object} req.body - Request payload.
 * @param {string} req.body.status - New ticket status.
 * @param {string} [req.body.adminComment] - Optional comment from admin staff.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response with updated ticket or error message.
 */
const updateTicketStatus = async (req, res) => {
    try {
        // Enforce admin staff access before any status change is attempted.
        if (req.user.role !== "admin_staff") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { id } = req.params;
        const { status, adminComment } = req.body;

        if (!status) {
            return res.status(400).json({ message: "Status is required" });
        }

        const ticket = await ticketModel.updateTicketStatus(id, status, adminComment);
        if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
        }

        res.status(200).json({ message: "Ticket updated successfully", ticket });
    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Delete a pending ticket if the authenticated student owns it and provides a valid reason.
 *
 * @param {object} req - Express request object.
 * @param {object} req.params - Route parameters.
 * @param {string} req.params.id - Ticket identifier.
 * @param {object} req.body - Request payload.
 * @param {string} req.body.reason - Reason for deleting the ticket.
 * @param {object} req.user - Authenticated user object.
 * @param {string} req.user.id - Student identifier.
 * @param {object} res - Express response object.
 * @returns {Promise<void>} Sends JSON response on successful deletion or error.
 */
const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const studentId = req.user.id;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ message: "A reason is required to delete a ticket." });
        }

        const result = await ticketModel.deleteTicket(id, studentId, reason.trim());

        // The model returns structured errors for ownership or status validation.
        if (result.error === "not_found") {
            return res.status(404).json({ message: "Ticket not found or you don't have permission." });
        }
        if (result.error === "not_pending") {
            return res.status(400).json({ message: "Only tickets with 'Pending' status can be deleted." });
        }

        res.status(200).json({ message: "Ticket deleted successfully." });
    } catch (error) {
        console.error("Error deleting ticket:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    raiseTicket,
    getMyTickets,
    getAllTickets,
    updateTicketStatus,
    deleteTicket,
};
