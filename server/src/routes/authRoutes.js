const express = require("express");
const router = express.Router();
const { register, login, uploadProfileImage, changeUserPassword } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);

// Protected routes
router.patch("/profile-image", verifyToken, upload.single("profile_image"), uploadProfileImage);
router.patch("/change-password", verifyToken, changeUserPassword);

module.exports = router;