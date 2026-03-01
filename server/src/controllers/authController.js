const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const {
  findUserByEmail,
  createUser,
  updateProfileImage,
  changePassword,
} = require("../models/userModel");
const logActivity = require("../utils/logger");

const register = async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    const existingUser = await findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser(full_name, email, hashedPassword, role);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const imageUrl = user.profile_image
      ? `${req.protocol}://${req.get("host")}/${user.profile_image}`
      : null;

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        profile_image: imageUrl,
        is_temp_password: user.is_temp_password ?? false,
      },
    });

    await logActivity(user.id, "LOGIN", `User logged in`);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image file provided" });

    const userId = req.user.id;
    const imagePath = `uploads/${req.file.filename}`;

    const pool = require("../config/db");
    const current = await pool.query("SELECT profile_image FROM users WHERE id = $1", [userId]);
    const oldPath = current.rows[0]?.profile_image;
    if (oldPath) {
      const abs = path.join(__dirname, "../../", oldPath);
      if (fs.existsSync(abs)) fs.unlinkSync(abs);
    }

    const updated = await updateProfileImage(userId, imagePath);
    const imageUrl = `${req.protocol}://${req.get("host")}/${imagePath}`;

    res.json({
      message: "Profile image updated",
      profile_image: imageUrl,
      user: { id: updated.id, full_name: updated.full_name, role: updated.role, profile_image: imageUrl },
    });

    await logActivity(userId, "UPDATE_PROFILE_IMAGE", "User updated their profile photo");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/auth/change-password — any authenticated user
const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await changePassword(req.user.id, hashed);
    await logActivity(req.user.id, "CHANGE_PASSWORD", "User successfully changed their password");
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, uploadProfileImage, changeUserPassword };