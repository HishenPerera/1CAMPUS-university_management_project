const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const verifyToken = require("../middleware/authMiddleware");

// Student routes
router.post("/raise", verifyToken, ticketController.raiseTicket);
router.get("/my-tickets", verifyToken, ticketController.getMyTickets);
router.delete("/:id", verifyToken, ticketController.deleteTicket);

// Admin routes
router.get("/all", verifyToken, ticketController.getAllTickets);
router.patch("/:id/status", verifyToken, ticketController.updateTicketStatus);

module.exports = router;
