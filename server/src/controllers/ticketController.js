const ticketModel = require("../models/ticketModel");

// Student: Raise a new ticket
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

// Student: Get my tickets
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

// Admin: Get all tickets
const getAllTickets = async (req, res) => {
    try {
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

// Admin: Update ticket status
const updateTicketStatus = async (req, res) => {
    try {
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

module.exports = {
    raiseTicket,
    getMyTickets,
    getAllTickets,
    updateTicketStatus,
};
