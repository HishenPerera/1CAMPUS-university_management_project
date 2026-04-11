require("dotenv").config();
const http = require("http");
const pool = require("./src/config/db");
const app = require("./src/app");
const cronJobs = require('./cronJobs');
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const PORT = process.env.PORT || 5001;

// Create HTTP server around Express
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Socket middleware for JWT verification
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        socket.user = decoded; // { id, role, email }
        next();
    } catch (err) {
        next(new Error("Authentication error"));
    }
});

// Map of connected users for online status
const connectedUsers = new Map();

io.on("connection", (socket) => {
    const userId = socket.user.id;
    
    // Track connection
    connectedUsers.set(userId, socket.id);
    io.emit("users_online", Array.from(connectedUsers.keys()));

    // Listen for incoming messages
    socket.on("send_message", async (data) => {
        try {
            const { receiverId, message } = data;
            
            // Save to database
            const result = await pool.query(
                `INSERT INTO chat_messages (sender_id, receiver_id, message)
                 VALUES ($1, $2, $3) RETURNING id, sender_id, receiver_id, message, created_at, is_read`,
                [userId, receiverId, message]
            );
            
            const savedMessage = result.rows[0];

            // Send to receiver if online
            const receiverSocketId = connectedUsers.get(Number(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", savedMessage);
            }

            // Send acknowledgment back to sender
            socket.emit("message_sent", savedMessage);
        } catch (err) {
            console.error("Socket error processing message:", err);
            socket.emit("message_error", { error: "Failed to send message" });
        }
    });

    socket.on("mark_read", async (data) => {
        try {
            const { senderId } = data; // The user who sent the messages being read
            await pool.query(
                "UPDATE chat_messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE",
                [senderId, userId]
            );
            // Notify sender that their messages were read
            const senderSocketId = connectedUsers.get(Number(senderId));
            if (senderSocketId) {
                io.to(senderSocketId).emit("messages_read_by_receiver", { readerId: userId });
            }
        } catch (err) {
            console.error("Socket error marking read:", err);
        }
    });

    socket.on("disconnect", () => {
        connectedUsers.delete(userId);
        io.emit("users_online", Array.from(connectedUsers.keys()));
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});