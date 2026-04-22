const express = require("express");
const router = express.Router();
const {
    getMyModules, getModuleMaterials, uploadModuleMaterial, deleteModuleMaterial,
    generateAIAssessment, publishQuiz, getPublishedQuizzes, getQuizSubmissions, deleteQuiz,
    postAttendanceSession, toggleAttendanceSession, deleteAttendanceSession,
    getAttendanceSessions, getAttendanceRecords, downloadAttendanceReport
} = require("../controllers/lecturerController");
const verifyToken = require("../middleware/authMiddleware");
const uploadMaterial = require("../middleware/uploadMaterial");

// Role guard — lecturer only
const requireLecturer = (req, res, next) => {
    if (!req.user || req.user.role !== "lecturer") {
        return res.status(403).json({ message: "Lecturer access required" });
    }
    next();
};

router.use(verifyToken, requireLecturer);

router.get("/modules", getMyModules);

// Lecture Materials Management
router.get("/modules/:id/materials", getModuleMaterials);
router.post("/modules/:id/materials", uploadMaterial.single("material"), uploadModuleMaterial);
router.delete("/modules/materials/:material_id", deleteModuleMaterial);

// AI Tools
router.post("/modules/:id/ai-assessment", generateAIAssessment);
router.post("/modules/:id/quizzes", publishQuiz);

// Quiz Management
router.get("/quizzes", getPublishedQuizzes);
router.get("/quizzes/:id/submissions", getQuizSubmissions);
router.delete("/quizzes/:id", deleteQuiz);

// Attendance Management
router.post("/modules/:id/attendance", postAttendanceSession);
router.get("/modules/:id/attendance", getAttendanceSessions);
router.patch("/attendance/:session_id/toggle", toggleAttendanceSession);
router.delete("/attendance/:session_id", deleteAttendanceSession);
router.get("/attendance/:session_id/records", getAttendanceRecords);
router.get("/attendance/:session_id/download", downloadAttendanceReport);

module.exports = router;
