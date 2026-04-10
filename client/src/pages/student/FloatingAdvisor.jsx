import { useState, useRef, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./FloatingAdvisor.css";

/* ─── Rich Markdown Renderer (Extracted from AcademicAdvisor) ────────── */
function MessageContent({ text }) {
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    const renderInline = (str) => {
        const parts = str.split(/(`[^`]+`|\*\*.*?\*\*)/g);
        return parts.map((part, j) => {
            if (part.startsWith("`") && part.endsWith("`"))
                return <code className="fa-inline-code" key={j}>{part.slice(1, -1)}</code>;
            if (part.startsWith("**") && part.endsWith("**"))
                return <strong key={j}>{part.slice(2, -2)}</strong>;
            return part;
        });
    };

    while (i < lines.length) {
        const line = lines[i];
        if (line.match(/^###\s+(.*)/)) { elements.push(<h6 key={i} className="fa-h3">{renderInline(line.match(/^###\s+(.*)/)[1])}</h6>); i++; continue; }
        if (line.match(/^##\s+(.*)/)) { elements.push(<h6 key={i} className="fa-h2">{renderInline(line.match(/^##\s+(.*)/)[1])}</h6>); i++; continue; }
        
        if (line.startsWith("```")) {
            i++;
            const codeLines = [];
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(<pre className="fa-code-block" key={i}><code>{codeLines.join("\n")}</code></pre>);
            i++; continue;
        }

        if (line.match(/^[\*\-•]\s/)) {
            const items = [];
            while (i < lines.length && lines[i].match(/^[\*\-•]\s/)) {
                items.push(<li key={i}>{renderInline(lines[i].slice(2))}</li>);
                i++;
            }
            elements.push(<ul className="fa-ul" key={`ul-${i}`}>{items}</ul>);
            continue;
        }

        if (line.trim() === "") {
            elements.push(<div key={i} className="fa-spacer" />);
            i++; continue;
        }

        elements.push(<p key={i}>{renderInline(line)}</p>);
        i++;
    }
    return <div className="fa-content">{elements}</div>;
}

const SUGGESTIONS = [
    { icon: "bi-compass", label: "Focus areas this semester" },
    { icon: "bi-lightbulb", label: "Study tips for my modules" },
    { icon: "bi-briefcase", label: "Career paths" },
    { icon: "bi-clock-history", label: "Workload management" },
];

function FloatingAdvisor() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "👋 Hi! I'm your **AI Academic Advisor**. How can I help you today?",
            time: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            inputRef.current?.focus();
        }
    }, [messages, loading, isOpen]);

    const sendMessage = async (text) => {
        const userMsg = (typeof text === 'string' ? text : input).trim();
        if (!userMsg || loading) return;

        const newMessages = [...messages, { role: "user", content: userMsg, time: new Date() }];
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            const history = newMessages.slice(1, -1);
            const { data } = await axiosInstance.post("/student/ai-advisor", {
                message: userMsg,
                history: history,
            });
            setMessages(prev => [...prev, { role: "assistant", content: data.reply, time: new Date() }]);
        } catch (err) {
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: "Sorry, I'm having trouble connecting. Please try again.",
                isError: true,
                time: new Date() 
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        sendMessage();
    };

    return (
        <div className={`fa-wrapper ${isOpen ? "fa-open" : ""} ${isMaximized ? "fa-maximized" : ""}`}>
            {/* Floating Toggle Button */}
            <button className="fa-toggle" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <i className="bi bi-x-lg" /> : <i className="bi bi-stars" />}
                <span className="fa-hover-label">AI Academic Advisor</span>
                {!isOpen && <span className="fa-pulse" />}
            </button>

            {/* Chat Window */}
            <div className="fa-window">
                <div className="fa-header">
                    <div className="fa-header-icon">
                        <i className="bi bi-stars" />
                    </div>
                    <div>
                        <h4>Academic Advisor</h4>
                        <span>AI Assistant · Online</span>
                    </div>
                    <button className="fa-btn-maximize" onClick={() => setIsMaximized(!isMaximized)}>
                        {isMaximized ? <i className="bi bi-fullscreen-exit" /> : <i className="bi bi-fullscreen" />}
                    </button>
                </div>

                <div className="fa-chat-body">
                    {messages.map((msg, i) => (
                        <div key={i} className={`fa-msg ${msg.role === "user" ? "fa-msg-user" : "fa-msg-ai"}`}>
                            <div className="fa-bubble">
                                <MessageContent text={msg.content} />
                                <span className="fa-time">
                                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="fa-msg fa-msg-ai">
                            <div className="fa-bubble fa-typing">
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick Prompts */}
                {!loading && messages.length < 3 && (
                    <div className="fa-suggestions">
                        {SUGGESTIONS.map((s, idx) => (
                            <button key={idx} className="fa-suggestion-chip" onClick={() => sendMessage(s.label)}>
                                <i className={`bi ${s.icon}`} /> {s.label}
                            </button>
                        ))}
                    </div>
                )}

                <form className="fa-input-area" onSubmit={handleFormSubmit}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask me anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                    />
                    <button type="submit" disabled={!input.trim() || loading}>
                        <i className="bi bi-send-fill" />
                    </button>
                </form>
            </div>
        </div>
    );
}

export default FloatingAdvisor;
