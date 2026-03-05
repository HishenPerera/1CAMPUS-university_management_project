import { useState, useRef, useEffect } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./AcademicAdvisor.css";

// Simple markdown-like renderer for bold and bullet lists
function MessageContent({ text }) {
    const lines = text.split("\n");
    return (
        <div className="msg-content">
            {lines.map((line, i) => {
                // Bold **text**
                const parts = line.split(/\*\*(.*?)\*\*/g);
                const rendered = parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p));
                if (line.match(/^[\*\-•]\s/)) {
                    return <li key={i}>{rendered.slice(1)}</li>;
                }
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{rendered}</p>;
            })}
        </div>
    );
}

const SUGGESTIONS = [
    "What should I focus on this semester?",
    "Give me study tips for my modules",
    "What career paths suit my degree?",
    "How do I manage my workload?",
    "Recommend resources for my subjects",
];

function AcademicAdvisor() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "👋 Hi! I'm your **AI Academic Advisor**. I already know your degree program, year, semester, and enrolled modules — so I can give you personalised guidance.\n\nWhat would you like help with today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (text) => {
        const userMsg = text || input.trim();
        if (!userMsg || loading) return;

        const newMessages = [...messages, { role: "user", content: userMsg }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // Send history excluding the first greeting so Gemini doesn't see it as history
            const historyToSend = newMessages.slice(1, -1); // exclude greeting & latest user msg
            const { data } = await axiosInstance.post("/student/ai-advisor", {
                message: userMsg,
                history: historyToSend,
            });
            setMessages([...newMessages, { role: "assistant", content: data.reply }]);
        } catch (err) {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: `⚠️ ${err.response?.data?.message || "Something went wrong. Please try again."}`,
                    isError: true,
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="advisor-page">
            {/* Header */}
            <div className="advisor-header">
                <div className="advisor-avatar">
                    <i className="bi bi-robot" />
                </div>
                <div>
                    <h2 className="advisor-title">AI Academic Advisor</h2>
                    <p className="advisor-subtitle">Powered by Groq · Llama 3.3 70B</p>
                </div>
                <span className="advisor-badge">
                    <span className="advisor-dot" /> Online
                </span>
            </div>

            {/* Chat window */}
            <div className="advisor-chat">
                {messages.map((msg, i) => (
                    <div key={i} className={`msg-row ${msg.role === "user" ? "msg-user" : "msg-ai"}`}>
                        {msg.role === "assistant" && (
                            <div className="msg-icon">
                                <i className="bi bi-robot" />
                            </div>
                        )}
                        <div className={`msg-bubble ${msg.isError ? "msg-error" : ""}`}>
                            <MessageContent text={msg.content} />
                        </div>
                        {msg.role === "user" && (
                            <div className="msg-icon msg-icon-user">
                                <i className="bi bi-person-fill" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="msg-row msg-ai">
                        <div className="msg-icon">
                            <i className="bi bi-robot" />
                        </div>
                        <div className="msg-bubble msg-typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Suggestion chips — only show at start */}
            {messages.length === 1 && (
                <div className="advisor-suggestions">
                    {SUGGESTIONS.map((s) => (
                        <button key={s} className="suggestion-chip" onClick={() => sendMessage(s)}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div className="advisor-inputbar">
                <textarea
                    ref={inputRef}
                    className="advisor-input"
                    placeholder="Ask anything about your studies, career, modules…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={loading}
                />
                <button
                    className="advisor-send"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                >
                    <i className="bi bi-send-fill" />
                </button>
            </div>
            <p className="advisor-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>
    );
}

export default AcademicAdvisor;
