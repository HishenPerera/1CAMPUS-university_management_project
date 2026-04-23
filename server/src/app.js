const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");
const webAdminRoutes = require("./routes/webAdminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded profile images as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/webadmin", webAdminRoutes);
app.use("/api/lecturer", lecturerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/chat", chatRoutes);

module.exports = app;