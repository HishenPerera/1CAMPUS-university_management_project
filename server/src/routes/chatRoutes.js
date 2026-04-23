const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getContacts, getChatHistory } = require("../controllers/chatController");

router.use(verifyToken);

router.get("/contacts", getContacts);
router.get("/history/:contactId", getChatHistory);

module.exports = router;
