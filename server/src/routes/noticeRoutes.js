const express = require("express");
const router = express.Router();
const {
    getAllNotices,
    createNotice,
    updateNotice,
    deleteNotice
} = require("../controllers/noticeController");
const verifyToken = require("../middleware/authMiddleware");
const uploadNotice = require("../middleware/uploadNotice");

// Role guard — lecturer only for write operations
const requireLecturer = (req, res, next) => {
    if (!req.user || (req.user.role !== "lecturer" && req.user.role !== "web_admin")) {
        return res.status(403).json({ message: "Lecturer access required" });
    }
    next();
};

// All authenticated users can view notices
router.get("/", verifyToken, getAllNotices);

// Lecturer/Admin only routes
router.post("/", verifyToken, requireLecturer, uploadNotice.single("file"), createNotice);
router.put("/:id", verifyToken, requireLecturer, uploadNotice.single("file"), updateNotice);
router.delete("/:id", verifyToken, requireLecturer, deleteNotice);

module.exports = router;
