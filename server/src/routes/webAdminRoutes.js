const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const webAdminController = require('../controllers/webAdminController');

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
    deleteStaff,
    getWebAdmins,
    createWebAdmin,
    deleteWebAdmin,
    listTables,
    getTableData,
    deleteTableRow,
} = require("../controllers/webAdminController");

// Secure all routes
router.use(verifyToken);
router.use(checkWebAdmin);

router.get("/logs", getAuditLogs);
router.get("/staff", getStaff);
router.get("/temp-passwords", getStaffTempPasswords);
router.post("/staff", createStaff);
router.delete("/staff/:id", deleteStaff);

router.get("/admins", getWebAdmins);
router.post("/admins", createWebAdmin);
router.delete("/admins/:id", deleteWebAdmin);

// Database Backup Routes
router.post('/backup', webAdminController.createBackup);
router.get('/backups', webAdminController.getBackups);
router.get('/backup/download/:filename', webAdminController.downloadBackup);
router.delete('/backup/:filename', webAdminController.deleteBackup);

// Database Management Routes
router.get('/db/tables', listTables);
router.get('/db/tables/:table', getTableData);
router.delete('/db/tables/:table/:id', deleteTableRow);

// Email Test Route — POST /api/webadmin/test-email  { "to": "test@example.com" }
router.post('/test-email', async (req, res) => {
    const { sendEnrollmentEmail } = require('../utils/emailService');
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Provide a "to" email address' });
    try {
        await sendEnrollmentEmail({
            toEmail: to,
            studentName: 'Test Student',
            portalEmail: 'cs260001@1campus.edu',
            tempPassword: 'TestPass@123',
            regNumber: 'CS260001',
            degreeProgram: 'Bachelor of Science in Computer Science',
        });
        res.json({ success: true, message: `Test email sent to ${to}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;


