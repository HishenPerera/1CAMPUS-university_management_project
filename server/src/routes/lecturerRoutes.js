const express = require("express");
const router = express.Router();
const { getMyModules } = require("../controllers/lecturerController");
const verifyToken = require("../middleware/authMiddleware");

// Role guard — lecturer only
const requireLecturer = (req, res, next) => {
    if (!req.user || req.user.role !== "lecturer") {
        return res.status(403).json({ message: "Lecturer access required" });
    }
    next();
};

router.use(verifyToken, requireLecturer);

router.get("/modules", getMyModules);

module.exports = router;
