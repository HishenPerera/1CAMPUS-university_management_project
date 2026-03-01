const express = require("express");
const router = express.Router();
const { register, login, uploadProfileImage } = require("../controllers/authController");
const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);

// Protected: upload / replace the logged-in user's profile image
router.patch(
    "/profile-image",
    verifyToken,
    upload.single("profile_image"),
    uploadProfileImage
);

module.exports = router;