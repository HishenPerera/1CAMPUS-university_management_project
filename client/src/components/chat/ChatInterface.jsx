import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "../../api/axiosInstance";
import "./ChatInterface.css";

function ChatInterface() {
    const [socket, setSocket] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const currentUserId = Number(localStorage.getItem("user_id")); // We need user_id stored or derive from token. Wait, is it? Let's assume we can fetch it, actually we'll decode token.
    const token = localStorage.getItem("token");

    // helper to get current user ID
    const getMyUserId = () => {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).id;
        } catch(e) { return null; }
    };
    const myId = getMyUserId();

    useEffect(() => {
        // Init Socket
        const newSocket = io("http://localhost:5001", {
            auth: { token: localStorage.getItem("token") }
        });
        setSocket(newSocket);

        newSocket.on("users_online", (users) => setOnlineUsers(users));

        newSocket.on("receive_message", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on("message_sent", (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        newSocket.on("messages_read_by_receiver", (data) => {
            // Update UI to show read status if active chat is with readerId
            setMessages(prev => prev.map(m => 
                m.receiver_id === data.readerId ? { ...m, is_read: true } : m
            ));
        });

        fetchContacts();

        return () => newSocket.disconnect();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark as read when messages array updates and we are the receiver
    useEffect(() => {
        if (socket && activeContact && messages.length > 0) {
            const hasUnreadFromActive = messages.some(m => m.sender_id === activeContact.id && !m.is_read);
            if (hasUnreadFromActive) {
                socket.emit("mark_read", { senderId: activeContact.id });
                // Optimistically clear unreads
                setContacts(prev => prev.map(c => c.id === activeContact.id ? { ...c, unread_count: 0 } : c));
            }
        }
    }, [messages, activeContact, socket]);

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
        setMessages([]); // Clear while loading history
        
        // Optimistically clear unread count
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
            message: newMessage.trim()
        });
        
        setNewMessage("");
    };

    const filteredContacts = contacts.filter(c => 
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="chat-container">
            {/* Sidebar */}
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
                                            <img src={`http://localhost:5001${contact.profile_image}`} alt={contact.full_name} className="chat-avatar" />
                                        ) : (
                                            <div className="chat-avatar-fallback">{contact.full_name.charAt(0)}</div>
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

            {/* Conversation View */}
            <div className={`chat-main ${!activeContact ? 'chat-main--hidden-mobile' : ''}`}>
                {activeContact ? (
                    <>
                        <div className="chat-main-header">
                            <button className="chat-back-btn" onClick={() => setActiveContact(null)}>
                                <i className="bi bi-arrow-left" />
                            </button>
                            <div className="chat-avatar-wrap">
                                {activeContact.profile_image ? (
                                    <img src={`http://localhost:5001${activeContact.profile_image}`} alt={activeContact.full_name} className="chat-avatar-sm" />
                                ) : (
                                    <div className="chat-avatar-fallback-sm">{activeContact.full_name.charAt(0)}</div>
                                )}
                            </div>
                            <div className="chat-main-header-info">
                                <span className="chat-main-name">{activeContact.full_name}</span>
                                <span className="chat-main-status">
                                    {onlineUsers.includes(activeContact.id) ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="chat-messages-area">
                            {messages.length === 0 ? (
                                <div className="chat-empty-converation">
                                    <div className="chat-wave-icon">👋</div>
                                    <p>Say hello to {activeContact.full_name}!</p>
                                </div>
                            ) : (
                                messages.map((m, idx) => {
                                    const isMe = m.sender_id === myId;
                                    return (
                                        <div key={m.id || idx} className={`chat-bubble-row ${isMe ? 'chat-bubble-me' : 'chat-bubble-them'}`}>
                                            <div className="chat-bubble">
                                                <div className="chat-bubble-text">{m.message}</div>
                                                <div className="chat-bubble-meta">
                                                    {new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && <i className={`bi bi-check2-all chat-read-icon ${m.is_read ? 'read' : ''}`} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <input 
                                type="text" 
                                className="chat-input"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
                                <i className="bi bi-send-fill" />
                            </button>
                        </form>
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
