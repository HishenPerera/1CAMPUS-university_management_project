const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const { getMyProfile, updateMyProfile } = require("../controllers/studentController");

// Only accessible by the logged-in student (any authenticated user can call,
// controller fetches data based on token id so no cross-user access possible)
router.use(verifyToken);

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);

module.exports = router;
