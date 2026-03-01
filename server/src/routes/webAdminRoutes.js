const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

// Role checker for web admin
const checkWebAdmin = (req, res, next) => {
    if (req.user && req.user.role === "web_admin") {
        next();
    } else {
        res.status(403).json({ message: "Access forbidden: Web Admin only" });
    }
};

const {
    getAuditLogs,
    getStaff,
    getStaffTempPasswords,
    createStaff,
    deleteStaff
} = require("../controllers/webAdminController");

// Secure all routes
router.use(verifyToken);
router.use(checkWebAdmin);

router.get("/logs", getAuditLogs);
router.get("/staff", getStaff);
router.get("/temp-passwords", getStaffTempPasswords);
router.post("/staff", createStaff);
router.delete("/staff/:id", deleteStaff);

module.exports = router;
