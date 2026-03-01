const express = require("express");
const router = express.Router();
const {
    listStudents, getTempPasswords, getStudentDetail,
    addStudent, editStudent, removeStudent,
} = require("../controllers/adminController");
const verifyToken = require("../middleware/authMiddleware");

// Role guard — admin_staff only
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin_staff") {
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

module.exports = router;
