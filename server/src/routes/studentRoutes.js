const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getMyProfile, updateMyProfile, getMyModules, getStudentModuleMaterials, aiAdvisor, getAvailableQuizzes, getQuizQuestions, startQuizAttempt, submitQuizAttempt } = require("../controllers/studentController");

// Only accessible by the logged-in student (any authenticated user can call,
// controller fetches data based on token id so no cross-user access possible)
router.use(verifyToken);

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/modules", getMyModules);
router.get("/modules/:id/materials", getStudentModuleMaterials);
router.post("/ai-advisor", aiAdvisor);

// Quiz Routes
router.get("/quizzes", getAvailableQuizzes);
router.get("/quizzes/:id", getQuizQuestions);
router.post("/quizzes/:id/start", startQuizAttempt);
router.post("/quizzes/:id/submit", submitQuizAttempt);

module.exports = router;
