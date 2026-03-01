const express = require("express");
const router = express.Router();
const {
    listStudents, getTempPasswords, getStudentDetail,
    addStudent, editStudent, removeStudent,
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

module.exports = router;
