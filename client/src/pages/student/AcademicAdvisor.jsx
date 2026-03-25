import { useState, useRef, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./AcademicAdvisor.css";

/* ─── Rich Markdown Renderer ──────────────────────────────────────── */
function MessageContent({ text }) {
    const lines = text.split("\n");
    const elements = [];
    let i = 0;

    const renderInline = (str) => {
        // Handle bold + code inline
        const parts = str.split(/(`[^`]+`|\*\*.*?\*\*)/g);
        return parts.map((part, j) => {
            if (part.startsWith("`") && part.endsWith("`"))
                return <code className="msg-inline-code" key={j}>{part.slice(1, -1)}</code>;
            if (part.startsWith("**") && part.endsWith("**"))
                return <strong key={j}>{part.slice(2, -2)}</strong>;
            return part;
        });
    };

    while (i < lines.length) {
        const line = lines[i];

        // Heading
        const h3 = line.match(/^###\s+(.*)/);
        const h2 = line.match(/^##\s+(.*)/);
        const h1 = line.match(/^#\s+(.*)/);
        if (h1) { elements.push(<h4 key={i} className="msg-h1">{renderInline(h1[1])}</h4>); i++; continue; }
        if (h2) { elements.push(<h5 key={i} className="msg-h2">{renderInline(h2[1])}</h5>); i++; continue; }
        if (h3) { elements.push(<h6 key={i} className="msg-h3">{renderInline(h3[1])}</h6>); i++; continue; }

        // Fenced code block
        if (line.startsWith("```")) {
            const lang = line.slice(3).trim();
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith("```")) {
                codeLines.push(lines[i]);
                i++;
            }
            elements.push(
                <pre className="msg-code-block" key={i}>
                    {lang && <span className="msg-code-lang">{lang}</span>}
                    <code>{codeLines.join("\n")}</code>
                </pre>
            );
            i++;
            continue;
        }

        // Ordered list
        const ol = line.match(/^(\d+)\.\s+(.*)/);
        if (ol) {
            const items = [];
            while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
                items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s+/, ""))}</li>);
                i++;
            }
            elements.push(<ol className="msg-ol" key={`ol-${i}`}>{items}</ol>);
            continue;
        }

        // Unordered list
        if (line.match(/^[\*\-•]\s/)) {
            const items = [];
            while (i < lines.length && lines[i].match(/^[\*\-•]\s/)) {
                items.push(<li key={i}>{renderInline(lines[i].slice(2))}</li>);
                i++;
            }
            elements.push(<ul className="msg-ul" key={`ul-${i}`}>{items}</ul>);
            continue;
        }

        // Blockquote
        if (line.startsWith("> ")) {
            elements.push(<blockquote key={i} className="msg-blockquote">{renderInline(line.slice(2))}</blockquote>);
            i++;
            continue;
        }

        // Horizontal rule
        if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
            elements.push(<hr key={i} className="msg-hr" />);
            i++;
            continue;
        }

        // Empty line → spacer
        if (line.trim() === "") {
            elements.push(<div key={i} className="msg-spacer" />);
            i++;
            continue;
        }

        // Regular paragraph
        elements.push(<p key={i}>{renderInline(line)}</p>);
        i++;
    }

    return <div className="msg-content">{elements}</div>;
}

/* ─── Suggestions data ────────────────────────────────────────────── */
const SUGGESTIONS = [
    { icon: "bi-compass", label: "Focus areas this semester" },
    { icon: "bi-lightbulb", label: "Study tips for my modules" },
    { icon: "bi-briefcase", label: "Career paths for my degree" },
    { icon: "bi-clock-history", label: "How to manage my workload" },
    { icon: "bi-book", label: "Recommend study resources" },
    { icon: "bi-graph-up-arrow", label: "How to improve my grades" },
];

/* ─── Timestamp formatter ─────────────────────────────────────────── */
function formatTime(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── Copy button ─────────────────────────────────────────────────── */
function CopyButton({ text }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };
    return (
        <button className={`msg-copy-btn ${copied ? "msg-copy-btn--done" : ""}`} onClick={handleCopy} title="Copy message">
            <i className={`bi ${copied ? "bi-check2" : "bi-clipboard"}`} />
        </button>
    );
}

/* ─── Main Component ──────────────────────────────────────────────── */
function AcademicAdvisor() {
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content:
                "👋 Hi! I'm your **AI Academic Advisor**. I already know your degree program, year, semester, and enrolled modules — so I can give you personalised guidance.\n\nWhat would you like help with today?",
            time: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const textareaRef = useRef(null);

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    // Auto-resize textarea
    const handleInput = (e) => {
        const ta = e.target;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
        setInput(ta.value);
    };

    const sendMessage = useCallback(async (text) => {
        const userMsg = (text || input).trim();
        if (!userMsg || loading) return;

        const newMessages = [
            ...messages,
            { role: "user", content: userMsg, time: new Date() },
        ];
        setMessages(newMessages);
        setInput("");
        setShowSuggestions(false);
        setLoading(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            const historyToSend = newMessages.slice(1, -1);
            const { data } = await axiosInstance.post("/student/ai-advisor", {
                message: userMsg,
                history: historyToSend,
            });
            setMessages([
                ...newMessages,
                { role: "assistant", content: data.reply, time: new Date() },
            ]);
        } catch (err) {
            setMessages([
                ...newMessages,
                {
                    role: "assistant",
                    content: `⚠️ ${err.response?.data?.message || "Something went wrong. Please try again."}`,
                    isError: true,
                    time: new Date(),
                },
            ]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [messages, input, loading]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const charCount = input.length;
    const MAX_CHARS = 1000;
    const isOverLimit = charCount > MAX_CHARS;

    return (
        <div className="advisor-page">

            {/* ── Header ── */}
            <div className="advisor-header">
                <div className="advisor-avatar">
                    <i className="bi bi-stars" />
                </div>
                <div className="advisor-header-info">
                    <h2 className="advisor-title">AI Academic Advisor</h2>
                    <p className="advisor-subtitle">Personalised academic guidance · Powered by AI</p>
                </div>
                <div className="advisor-header-actions">
                    <button
                        className="advisor-suggestions-toggle"
                        onClick={() => setShowSuggestions(v => !v)}
                        title="Toggle quick prompts"
                    >
                        <i className="bi bi-lightning-charge-fill" />
                        Quick prompts
                    </button>
                    <span className="advisor-badge">
                        <span className="advisor-dot" /> Online
                    </span>
                </div>
            </div>

            {/* ── Chat window ── */}
            <div className="advisor-chat">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`msg-row ${msg.role === "user" ? "msg-user" : "msg-ai"} msg-enter`}
                        style={{ animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}
                    >
                        {msg.role === "assistant" && (
                            <div className="msg-icon">
                                <i className="bi bi-stars" />
                            </div>
                        )}

                        <div className={`msg-bubble-wrap ${msg.role === "user" ? "msg-bubble-wrap--user" : ""}`}>
                            <div className={`msg-bubble ${msg.isError ? "msg-error" : ""}`}>
                                <MessageContent text={msg.content} />
                            </div>
                            <div className="msg-meta">
                                {msg.time && (
                                    <span className="msg-time">{formatTime(msg.time)}</span>
                                )}
                                {msg.role === "assistant" && !msg.isError && (
                                    <CopyButton text={msg.content} />
                                )}
                            </div>
                        </div>

                        {msg.role === "user" && (
                            <div className="msg-icon msg-icon-user">
                                <i className="bi bi-person-fill" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="msg-row msg-ai msg-enter">
                        <div className="msg-icon msg-icon-thinking">
                            <i className="bi bi-stars" />
                        </div>
                        <div className="msg-bubble-wrap">
                            <div className="msg-bubble msg-bubble--typing">
                                <span className="msg-typing-label">Thinking</span>
                                <div className="msg-typing">
                                    <span /><span /><span />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Suggestion chips ── */}
            {showSuggestions && (
                <div className="advisor-suggestions">
                    <span className="advisor-suggestions-label">
                        <i className="bi bi-lightning-charge-fill" /> Quick prompts
                    </span>
                    <div className="advisor-suggestions-chips">
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s.label}
                                className="suggestion-chip"
                                onClick={() => sendMessage(s.label)}
                                disabled={loading}
                            >
                                <i className={`bi ${s.icon}`} />
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Input bar ── */}
            <div className={`advisor-inputbar ${isOverLimit ? "advisor-inputbar--over" : ""}`}>
                <textarea
                    ref={(el) => { inputRef.current = el; textareaRef.current = el; }}
                    className="advisor-input"
                    placeholder="Ask anything about your studies, career, modules…"
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={loading}
                    maxLength={MAX_CHARS + 50}
                />
                <div className="advisor-inputbar-right">
                    {charCount > 400 && (
                        <span className={`advisor-char-count ${isOverLimit ? "advisor-char-count--over" : ""}`}>
                            {charCount}/{MAX_CHARS}
                        </span>
                    )}
                    <button
                        className="advisor-send"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading || isOverLimit}
                        title="Send message"
                    >
                        {loading
                            ? <i className="bi bi-hourglass-split advisor-send-spin" />
                            : <i className="bi bi-send-fill" />
                        }
                    </button>
                </div>
            </div>

            <p className="advisor-hint">
                <i className="bi bi-info-circle" /> Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
            </p>
        </div>
    );
}

export default AcademicAdvisor;
