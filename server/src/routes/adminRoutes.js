const express = require("express");
const router = express.Router();
const {
    listStudents, getTempPasswords, getStudentDetail,
    addStudent, editStudent, removeStudent,
    getApplications, acceptApplication, approveApplication, rejectApplication,
    listModules, getLecturers, addModule, deleteModule, assignModule, removeModuleAssignment
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");

// Role guard — admin_staff or web_admin
const requireAdmin = (req, res, next) => {
    if (!req.user || !["admin_staff", "web_admin"].includes(req.user.role)) {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};

router.use(verifyToken, requireAdmin);

router.get("/students", listStudents);
router.get("/temp-passwords", getTempPasswords);
router.get("/students/:id", getStudentDetail);
router.post("/students", addStudent);
router.put("/students/:id", editStudent);
router.delete("/students/:id", removeStudent);

/* ── Application Review Routes ─────────────────────────────────────────── */
router.get("/applications", getApplications);
router.post("/applications/:id/accept", acceptApplication);
router.post("/applications/:id/approve", approveApplication);
router.post("/applications/:id/reject", rejectApplication);

/* ── Module & Lecturer Management Routes ─────────────────────────────── */
router.get("/modules", listModules);
router.get("/lecturers", getLecturers);
router.post("/modules", addModule);
router.delete("/modules/:id", deleteModule);
router.post("/modules/:id/assign", assignModule);
router.delete("/modules/:id/assign/:lecturerId", removeModuleAssignment);

module.exports = router;
