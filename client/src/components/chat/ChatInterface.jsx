import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "../../api/axiosInstance";
import "./ChatInterface.css";

function ChatInterface() {
    const [socket,        setSocket]        = useState(null);
    const [contacts,      setContacts]      = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages,      setMessages]      = useState([]);
    const [newMessage,    setNewMessage]    = useState("");
    const [searchQuery,   setSearchQuery]   = useState("");
    const [loading,       setLoading]       = useState(true);
    const [onlineUsers,   setOnlineUsers]   = useState([]);
    const [replyingTo,    setReplyingTo]    = useState(null);

    // Edit state
    const [editingId,   setEditingId]   = useState(null);   // message id being edited
    const [editText,    setEditText]    = useState("");      // current edit draft
    const [editError,   setEditError]   = useState("");

    const messagesEndRef = useRef(null);
    const editInputRef   = useRef(null);
    const token          = localStorage.getItem("token");

    // Decode current user id from JWT
    const getMyUserId = () => {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64   = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const json      = decodeURIComponent(
                atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            return JSON.parse(json).id;
        } catch { return null; }
    };
    const myId = getMyUserId();

    /* ─── Socket setup ─────────────────────────────────────────── */
    useEffect(() => {
        const newSocket = io("http://localhost:5001", {
            auth: { token: localStorage.getItem("token") }
        });
        setSocket(newSocket);

        newSocket.on("users_online",           (users) => setOnlineUsers(users));
        newSocket.on("receive_message",        (msg)   => setMessages(prev => [...prev, msg]));
        newSocket.on("message_sent",           (msg)   => setMessages(prev => [...prev, msg]));

        newSocket.on("messages_read_by_receiver", (data) => {
            setMessages(prev =>
                prev.map(m => m.receiver_id === data.readerId ? { ...m, is_read: true } : m)
            );
        });

        newSocket.on("message_deleted", ({ messageId }) => {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m));
        });

        // ← New: handle real-time edit updates
        newSocket.on("message_edited", ({ messageId, newText }) => {
            setMessages(prev =>
                prev.map(m => m.id === messageId ? { ...m, message: newText, is_edited: true } : m)
            );
        });

        fetchContacts();
        return () => newSocket.disconnect();
    }, []);

    /* ─── Auto-scroll ──────────────────────────────────────────── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ─── Mark as read ─────────────────────────────────────────── */
    useEffect(() => {
        if (socket && activeContact && messages.length > 0) {
            const hasUnread = messages.some(m => m.sender_id === activeContact.id && !m.is_read);
            if (hasUnread) {
                socket.emit("mark_read", { senderId: activeContact.id });
                setContacts(prev =>
                    prev.map(c => c.id === activeContact.id ? { ...c, unread_count: 0 } : c)
                );
            }
        }
    }, [messages, activeContact, socket]);

    /* ─── Focus edit input when editing starts ─────────────────── */
    useEffect(() => {
        if (editingId !== null) {
            setTimeout(() => editInputRef.current?.focus(), 50);
        }
    }, [editingId]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/chat/contacts");
            setContacts(res.data);
        } catch (err) {
            console.error("Failed to load contacts:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectContact = async (contact) => {
        setActiveContact(contact);
        setMessages([]);
        setReplyingTo(null);
        cancelEdit();
        setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread_count: 0 } : c));

        try {
            const res = await axios.get(`/chat/history/${contact.id}`);
            setMessages(res.data);
            if (socket && res.data.length > 0) {
                socket.emit("mark_read", { senderId: contact.id });
            }
        } catch (err) {
            console.error("Failed to load chat history:", err);
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact || !socket) return;
        socket.emit("send_message", {
            receiverId: activeContact.id,
            message:    newMessage.trim(),
            replyToId:  replyingTo ? replyingTo.id : null,
        });
        setNewMessage("");
        setReplyingTo(null);
    };

    const handleDeleteMessage = (messageId) => {
        if (!socket) return;
        socket.emit("delete_message", { messageId });
    };

    /* ─── Edit helpers ─────────────────────────────────────────── */
    const startEdit = (msg) => {
        setEditingId(msg.id);
        setEditText(msg.message);
        setEditError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
        setEditError("");
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editText.trim()) { setEditError("Message cannot be empty."); return; }
        if (!socket) return;
        socket.emit("edit_message", { messageId: editingId, newText: editText.trim() });
        cancelEdit();
    };

    const filteredContacts = contacts.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="chat-container">

            {/* ── Sidebar ── */}
            <div className={`chat-sidebar ${activeContact ? 'chat-sidebar--hidden-mobile' : ''}`}>
                <div className="chat-sidebar-header">
                    <h2><i className="bi bi-chat-dots-fill" /> Messages</h2>
                    <div className="chat-search-wrap">
                        <i className="bi bi-search chat-search-icon" />
                        <input
                            type="text"
                            className="chat-search"
                            placeholder="Find students & lecturers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-contacts-list">
                    {loading ? (
                        <div className="chat-loading"><span className="chat-spinner" /></div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="chat-empty-msg">No contacts found.</div>
                    ) : (
                        filteredContacts.map(contact => {
                            const isOnline = onlineUsers.includes(contact.id);
                            const isActive = activeContact?.id === contact.id;
                            return (
                                <div
                                    key={contact.id}
                                    className={`chat-contact-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSelectContact(contact)}
                                >
                                    <div className="chat-avatar-wrap">
                                        {contact.profile_image ? (
                                            <img src={`http://localhost:5001${contact.profile_image}`} alt={contact.full_name || "User"} className="chat-avatar" />
                                        ) : (
                                            <div className="chat-avatar-fallback">
                                                {contact.full_name ? contact.full_name.charAt(0).toUpperCase() : "?"}
                                            </div>
                                        )}
                                        <span className={`chat-online-badge ${isOnline ? 'online' : ''}`} />
                                    </div>
                                    <div className="chat-contact-info">
                                        <div className="chat-contact-name">{contact.full_name}</div>
                                        <div className="chat-contact-role">{contact.role.replace('_', ' ')}</div>
                                    </div>
                                    {contact.unread_count > 0 && (
                                        <div className="chat-unread-badge">{contact.unread_count}</div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Conversation panel ── */}
            <div className={`chat-main ${!activeContact ? 'chat-main--hidden-mobile' : ''}`}>
                {activeContact ? (
                    <>
                        {/* Header */}
                        <div className="chat-main-header">
                            <button className="chat-back-btn" onClick={() => setActiveContact(null)}>
                                <i className="bi bi-arrow-left" />
                            </button>
                            <div className="chat-avatar-wrap">
                                {activeContact.profile_image ? (
                                    <img src={`http://localhost:5001${activeContact.profile_image}`} alt={activeContact.full_name || "User"} className="chat-avatar-sm" />
                                ) : (
                                    <div className="chat-avatar-fallback-sm">
                                        {activeContact.full_name ? activeContact.full_name.charAt(0).toUpperCase() : "?"}
                                    </div>
                                )}
                                <span className={`chat-online-badge ${onlineUsers.includes(activeContact.id) ? 'online' : ''}`} />
                            </div>
                            <div className="chat-main-header-info">
                                <span className="chat-main-name">{activeContact.full_name}</span>
                                <span className="chat-main-status">
                                    {onlineUsers.includes(activeContact.id) ? '● Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages-area">
                            {messages.length === 0 ? (
                                <div className="chat-empty-converation">
                                    <div className="chat-wave-icon">👋</div>
                                    <p>Say hello to {activeContact.full_name}!</p>
                                </div>
                            ) : (
                                messages.map((m, idx) => {
                                    const isMe    = m.sender_id === myId;
                                    const editing = editingId === m.id;

                                    return (
                                        <div
                                            key={m.id || idx}
                                            className={`chat-bubble-row ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}
                                        >
                                            {/* Reply button for received messages */}
                                            {!isMe && !m.is_deleted && (
                                                <button className="chat-action-btn reply" title="Reply" onClick={() => setReplyingTo(m)}>
                                                    <i className="bi bi-reply-fill" />
                                                </button>
                                            )}

                                            <div className={`chat-bubble ${m.is_deleted ? 'chat-bubble-deleted' : ''}`}>

                                                {/* Reply reference */}
                                                {m.reply_to_id && !m.is_deleted && (
                                                    <div className="chat-bubble-reply-ref">
                                                        <i className="bi bi-reply-fill" />{' '}
                                                        {m.reply_is_deleted
                                                            ? <em>This message was deleted</em>
                                                            : (m.reply_message_text || "Original message")}
                                                    </div>
                                                )}

                                                {/* Message text OR inline edit input */}
                                                {editing ? (
                                                    <form className="chat-edit-form" onSubmit={submitEdit}>
                                                        <input
                                                            ref={editInputRef}
                                                            className="chat-edit-input"
                                                            value={editText}
                                                            onChange={e => { setEditText(e.target.value); setEditError(""); }}
                                                            onKeyDown={e => { if (e.key === "Escape") cancelEdit(); }}
                                                        />
                                                        {editError && <span className="chat-edit-error">{editError}</span>}
                                                        <div className="chat-edit-actions">
                                                            <button type="button" className="chat-edit-cancel" onClick={cancelEdit}>
                                                                <i className="bi bi-x-lg" /> Cancel
                                                            </button>
                                                            <button type="submit" className="chat-edit-save">
                                                                <i className="bi bi-check-lg" /> Save
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    <div className="chat-bubble-text">
                                                        {m.is_deleted ? (
                                                            <em><i className="bi bi-slash-circle" /> This message was deleted.</em>
                                                        ) : (
                                                            m.message
                                                        )}
                                                    </div>
                                                )}

                                                {/* Timestamp + edited badge + read tick */}
                                                {!editing && (
                                                    <div className="chat-bubble-meta">
                                                        {m.is_edited && !m.is_deleted && (
                                                            <span className="chat-edited-label">edited</span>
                                                        )}
                                                        {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {isMe && !m.is_deleted && (
                                                            <i className={`bi bi-check2-all chat-read-icon ${m.is_read ? 'read' : ''}`} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions for my own messages */}
                                            {isMe && !m.is_deleted && !editing && (
                                                <div className="chat-action-group">
                                                    <button className="chat-action-btn reply" title="Reply" onClick={() => setReplyingTo(m)}>
                                                        <i className="bi bi-reply-fill" />
                                                    </button>
                                                    <button className="chat-action-btn edit" title="Edit message" onClick={() => startEdit(m)}>
                                                        <i className="bi bi-pencil" />
                                                    </button>
                                                    <button className="chat-action-btn delete" title="Delete message" onClick={() => handleDeleteMessage(m.id)}>
                                                        <i className="bi bi-trash-fill" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="chat-input-wrapper">
                            {replyingTo && (
                                <div className="chat-replying-indicator">
                                    <div className="chat-reply-content">
                                        <i className="bi bi-reply-fill" />
                                        <span>Replying to:</span>
                                        <strong>{replyingTo.message}</strong>
                                    </div>
                                    <button className="chat-reply-cancel" onClick={() => setReplyingTo(null)}>
                                        <i className="bi bi-x" />
                                    </button>
                                </div>
                            )}
                            <form className="chat-input-area" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    className="chat-input"
                                    placeholder="Type a message…"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                                    <i className="bi bi-send-fill" />
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="chat-no-selection">
                        <div className="chat-illustration">
                            <i className="bi bi-chat-square-dots" />
                        </div>
                        <h3>Your Messages</h3>
                        <p>Select a student or lecturer from the contact list to start a conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatInterface;
