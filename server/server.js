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

    /* ─── Send message ─────────────────────────────────────────── */
    socket.on("send_message", async (data) => {
        try {
            const { receiverId, message, replyToId } = data;

            const result = await pool.query(
                `INSERT INTO chat_messages (sender_id, receiver_id, message, reply_to_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, sender_id, receiver_id, message, reply_to_id, created_at, is_read, is_edited`,
                [userId, receiverId, message, replyToId || null]
            );

            const savedMessage = result.rows[0];

            // Deliver to receiver if online
            const receiverSocketId = connectedUsers.get(Number(receiverId));
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("receive_message", savedMessage);
            }

            // Acknowledge sender
            socket.emit("message_sent", savedMessage);
        } catch (err) {
            console.error("Socket error processing message:", err);
            socket.emit("message_error", { error: "Failed to send message" });
        }
    });

    /* ─── Delete message (soft delete) ────────────────────────── */
    socket.on("delete_message", async (data) => {
        try {
            const { messageId } = data;

            const result = await pool.query(
                "UPDATE chat_messages SET is_deleted = TRUE WHERE id = $1 AND sender_id = $2 RETURNING receiver_id",
                [messageId, userId]
            );

            if (result.rowCount > 0) {
                const receiverId = result.rows[0].receiver_id;
                const notification = { messageId, senderId: userId, receiverId };

                socket.emit("message_deleted", notification);

                const receiverSocketId = connectedUsers.get(Number(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("message_deleted", notification);
                }
            }
        } catch (err) {
            console.error("Socket error deleting message:", err);
        }
    });

    /* ─── Edit message ─────────────────────────────────────────── */
    socket.on("edit_message", async (data) => {
        try {
            const { messageId, newText } = data;

            if (!newText || !newText.trim()) {
                socket.emit("message_error", { error: "Message cannot be empty." });
                return;
            }

            // Only sender can edit, and only non-deleted messages
            const result = await pool.query(
                `UPDATE chat_messages
                 SET message = $1, is_edited = TRUE
                 WHERE id = $2 AND sender_id = $3 AND is_deleted = FALSE
                 RETURNING id, sender_id, receiver_id, message, is_edited, created_at, is_read, reply_to_id`,
                [newText.trim(), messageId, userId]
            );

            if (result.rowCount > 0) {
                const updatedMessage = result.rows[0];
                const receiverId = updatedMessage.receiver_id;
                const payload = {
                    messageId,
                    newText: updatedMessage.message,
                    senderId: userId,
                    receiverId,
                };

                socket.emit("message_edited", payload);

                const receiverSocketId = connectedUsers.get(Number(receiverId));
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("message_edited", payload);
                }
            } else {
                socket.emit("message_error", { error: "Cannot edit this message." });
            }
        } catch (err) {
            console.error("Socket error editing message:", err);
            socket.emit("message_error", { error: "Failed to edit message." });
        }
    });

    /* ─── Mark messages as read ────────────────────────────────── */
    socket.on("mark_read", async (data) => {
        try {
            const { senderId } = data;
            await pool.query(
                "UPDATE chat_messages SET is_read = TRUE WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE",
                [senderId, userId]
            );
            // Notify the original sender that their messages were read
            const senderSocketId = connectedUsers.get(Number(senderId));
            if (senderSocketId) {
                io.to(senderSocketId).emit("messages_read_by_receiver", { readerId: userId });
            }
        } catch (err) {
            console.error("Socket error marking read:", err);
        }
    });

    /* ─── Disconnect ───────────────────────────────────────────── */
    socket.on("disconnect", () => {
        connectedUsers.delete(userId);
        io.emit("users_online", Array.from(connectedUsers.keys()));
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});