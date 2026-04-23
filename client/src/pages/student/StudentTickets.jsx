import { useState, useEffect } from "react";
import "./StudentTickets.css";

/* ─── Status helpers ─────────────────────────────────────────── */
const STATUS_META = {
    pending:     { cls: "st-s-pending",   icon: "bi-clock",              label: "Pending"     },
    "in progress":{ cls: "st-s-progress", icon: "bi-arrow-repeat",       label: "In Progress" },
    resolved:    { cls: "st-s-resolved",  icon: "bi-check-circle-fill",  label: "Resolved"    },
    rejected:    { cls: "st-s-rejected",  icon: "bi-x-circle-fill",      label: "Rejected"    },
};

const TYPE_ICON = {
    "Certificate Request": "bi-file-earmark-text",
    "Letter Request":      "bi-envelope-paper",
    "Issue Report":        "bi-bug",
};

function getStatusMeta(status) {
    return STATUS_META[status?.toLowerCase()] || { cls: "", icon: "bi-circle", label: status };
}

/* ═══════════════════════════════════════════════════════════════
   Main Page
═══════════════════════════════════════════════════════════════ */
const StudentTickets = () => {
    const [tickets,    setTickets]    = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [activeTab,  setActiveTab]  = useState("all");
    const [showForm,   setShowForm]   = useState(false);
    const [toast,      setToast]      = useState(null);      // { msg, type }
    const [formData,   setFormData]   = useState({ type: "Certificate Request", title: "", description: "" });
    const [submitting, setSubmitting] = useState(false);

    /* fetch */
    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            const res   = await fetch("http://localhost:5001/api/tickets/my-tickets", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTickets(await res.json());
        } catch { /* silent */ }
        finally  { setLoading(false); }
    };

    useEffect(() => { fetchTickets(); }, []);

    /* toast helper */
    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3800);
    };

    /* submit new ticket */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/tickets/raise", {
                method:  "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify(formData),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Ticket raised successfully!");
                setFormData({ type: "Certificate Request", title: "", description: "" });
                setShowForm(false);
                fetchTickets();
            } else {
                showToast(data.message || "Failed to raise ticket.", "error");
            }
        } catch {
            showToast("Connection error.", "error");
        } finally { setSubmitting(false); }
    };

    /* callback when ticket deleted */
    const handleDeleted = (id) => {
        setTickets(prev => prev.filter(t => t.id !== id));
        showToast("Ticket withdrawn successfully.");
    };

    /* tab counts */
    const counts = {
        all:         tickets.length,
        pending:     tickets.filter(t => t.status.toLowerCase() === "pending").length,
        "in progress": tickets.filter(t => t.status.toLowerCase() === "in progress").length,
        resolved:    tickets.filter(t => t.status.toLowerCase() === "resolved").length,
        rejected:    tickets.filter(t => t.status.toLowerCase() === "rejected").length,
    };

    const filtered = activeTab === "all"
        ? tickets
        : tickets.filter(t => t.status.toLowerCase() === activeTab);

    const TABS = [
        { key: "all",         label: "All",         icon: "bi-grid-3x2-gap"       },
        { key: "pending",     label: "Pending",      icon: "bi-clock"              },
        { key: "in progress", label: "In Progress",  icon: "bi-arrow-repeat"       },
        { key: "resolved",    label: "Resolved",     icon: "bi-check-circle"       },
        { key: "rejected",    label: "Rejected",     icon: "bi-x-circle"           },
    ];

    return (
        <div className="st-page">

            {/* Toast */}
            {toast && (
                <div className={`st-toast st-toast--${toast.type}`}>
                    <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"}`}></i>
                    {toast.msg}
                </div>
            )}

            {/* ── Header ── */}
            <div className="st-header">
                <div className="st-header-left">
                    <div className="st-header-icon">
                        <i className="bi bi-headset"></i>
                    </div>
                    <div>
                        <h1 className="st-header-title">Support Tickets</h1>
                        <p className="st-header-sub">Submit and track your support requests</p>
                    </div>
                </div>
                <button className="st-btn-new" onClick={() => setShowForm(v => !v)}>
                    <i className={`bi ${showForm ? "bi-x-lg" : "bi-plus-lg"}`}></i>
                    {showForm ? "Close Form" : "New Ticket"}
                </button>
            </div>

            {/* ── Stats bar ── */}
            <div className="st-stats">
                {[
                    { label: "Total",       val: counts.all,           color: "var(--brand-primary)"   },
                    { label: "Pending",     val: counts.pending,       color: "#f59e0b"                },
                    { label: "In Progress", val: counts["in progress"],color: "#3b82f6"                },
                    { label: "Resolved",    val: counts.resolved,      color: "#10b981"                },
                    { label: "Rejected",    val: counts.rejected,      color: "#ef4444"                },
                ].map(s => (
                    <div className="st-stat-card" key={s.label}>
                        <span className="st-stat-val" style={{ color: s.color }}>{s.val}</span>
                        <span className="st-stat-label">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* ── New Ticket Drawer ── */}
            <div className={`st-form-drawer ${showForm ? "st-form-drawer--open" : ""}`}>
                <div className="st-form-inner">
                    <h2 className="st-form-title">
                        <i className="bi bi-pencil-square"></i> Raise a New Ticket
                    </h2>
                    <form onSubmit={handleSubmit} className="st-form">
                        <div className="st-form-row">
                            {/* Type */}
                            <div className="st-field">
                                <label className="st-label">Request Type</label>
                                <div className="st-type-select-wrap">
                                    {["Certificate Request", "Letter Request", "Issue Report"].map(opt => (
                                        <label key={opt}
                                            className={`st-type-chip ${formData.type === opt ? "st-type-chip--active" : ""}`}>
                                            <input type="radio" name="type" value={opt}
                                                checked={formData.type === opt}
                                                onChange={e => setFormData(d => ({ ...d, type: e.target.value }))} />
                                            <i className={`bi ${TYPE_ICON[opt]}`}></i>
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="st-form-row st-form-row--2col">
                            {/* Title */}
                            <div className="st-field">
                                <label className="st-label">Title <span className="st-req">*</span></label>
                                <input className="st-input" type="text"
                                    placeholder="Brief summary of your request"
                                    value={formData.title}
                                    onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
                                    required />
                            </div>
                            {/* Description */}
                            <div className="st-field">
                                <label className="st-label">Description</label>
                                <textarea className="st-input st-textarea"
                                    placeholder="Provide more details here…"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData(d => ({ ...d, description: e.target.value }))} />
                            </div>
                        </div>
                        <div className="st-form-footer">
                            <button type="button" className="st-btn-cancel"
                                onClick={() => setShowForm(false)} disabled={submitting}>
                                Cancel
                            </button>
                            <button type="submit" className="st-btn-submit" disabled={submitting}>
                                {submitting
                                    ? <><span className="st-spinner"></span> Submitting…</>
                                    : <><i className="bi bi-send"></i> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Tabs ── */}
            <div className="st-tabs">
                {TABS.map(tab => (
                    <button key={tab.key}
                        className={`st-tab ${activeTab === tab.key ? "st-tab--active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}>
                        <i className={`bi ${tab.icon}`}></i>
                        {tab.label}
                        {counts[tab.key] > 0 && (
                            <span className="st-tab-count">{counts[tab.key]}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Ticket List ── */}
            {loading ? (
                <div className="st-loading">
                    <span className="st-spinner st-spinner--lg"></span>
                    <span>Loading your tickets…</span>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState tab={activeTab} onNew={() => setShowForm(true)} />
            ) : (
                <div className="st-grid">
                    {filtered.map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} onDeleted={handleDeleted} />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─── Single Ticket Card ─────────────────────────────────────── */
const TicketCard = ({ ticket, onDeleted }) => {
    const [showModal, setShowModal] = useState(false);
    const meta = getStatusMeta(ticket.status);

    return (
        <>
            <div className="st-card">
                {/* Card top accent line */}
                <div className={`st-card-accent ${meta.cls}-accent`}></div>

                {/* Header row */}
                <div className="st-card-head">
                    <span className={`st-badge ${meta.cls}`}>
                        <i className={`bi ${meta.icon}`}></i>
                        {meta.label}
                    </span>
                    <span className="st-card-date">
                        <i className="bi bi-calendar3"></i>
                        {new Date(ticket.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                </div>

                {/* Type chip */}
                <div className="st-card-type">
                    <i className={`bi ${TYPE_ICON[ticket.type] || "bi-tag"}`}></i>
                    {ticket.type}
                </div>

                {/* Title & description */}
                <h3 className="st-card-title">{ticket.title}</h3>
                {ticket.description && (
                    <p className="st-card-desc">{ticket.description}</p>
                )}

                {/* Admin reply */}
                {ticket.admin_comment && (
                    <div className="st-admin-reply">
                        <div className="st-admin-reply-head">
                            <i className="bi bi-chat-left-text-fill"></i> Admin Response
                        </div>
                        <p>{ticket.admin_comment}</p>
                    </div>
                )}

                {/* Footer */}
                <div className="st-card-footer">
                    <span className="st-card-id">#{ticket.id}</span>
                    {ticket.status.toLowerCase() === "pending" && (
                        <button className="st-btn-withdraw" onClick={() => setShowModal(true)}>
                            <i className="bi bi-trash3"></i> Withdraw
                        </button>
                    )}
                </div>
            </div>

            {showModal && (
                <WithdrawModal
                    ticket={ticket}
                    onClose={() => setShowModal(false)}
                    onDeleted={onDeleted}
                />
            )}
        </>
    );
};

/* ─── Withdraw Modal ─────────────────────────────────────────── */
const WithdrawModal = ({ ticket, onClose, onDeleted }) => {
    const [reason,    setReason]    = useState("");
    const [error,     setError]     = useState("");
    const [deleting,  setDeleting]  = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        if (!reason.trim()) { setError("A reason is required."); return; }
        setDeleting(true); setError("");
        try {
            const token = localStorage.getItem("token");
            const res   = await fetch(`http://localhost:5001/api/tickets/${ticket.id}`, {
                method:  "DELETE",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body:    JSON.stringify({ reason: reason.trim() }),
            });
            const data = await res.json();
            if (res.ok) { onDeleted(ticket.id); onClose(); }
            else        { setError(data.message || "Failed to withdraw ticket."); }
        } catch {
            setError("Connection error. Please try again.");
        } finally { setDeleting(false); }
    };

    return (
        <div className="st-overlay" onClick={onClose}>
            <div className="st-modal" onClick={e => e.stopPropagation()}>

                <div className="st-modal-icon-wrap">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                </div>

                <h3 className="st-modal-title">Withdraw Ticket?</h3>
                <p className="st-modal-sub">
                    You are about to withdraw <strong>#{ticket.id} — {ticket.title}</strong>.
                    This cannot be undone.
                </p>

                <form onSubmit={handleDelete}>
                    <div className="st-field">
                        <label className="st-label">
                            Reason for withdrawal <span className="st-req">*</span>
                        </label>
                        <textarea
                            className="st-input st-textarea"
                            rows="3"
                            placeholder="e.g. I submitted this ticket by mistake…"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            disabled={deleting}
                        />
                    </div>

                    {error && (
                        <div className="st-field-error">
                            <i className="bi bi-exclamation-circle"></i> {error}
                        </div>
                    )}

                    <div className="st-modal-actions">
                        <button type="button" className="st-btn-cancel"
                            onClick={onClose} disabled={deleting}>
                            Cancel
                        </button>
                        <button type="submit" className="st-btn-danger" disabled={deleting}>
                            {deleting
                                ? <><span className="st-spinner"></span> Withdrawing…</>
                                : <><i className="bi bi-trash3"></i> Confirm Withdrawal</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Empty State ─────────────────────────────────────────────── */
const EmptyState = ({ tab, onNew }) => (
    <div className="st-empty">
        <div className="st-empty-icon">
            <i className="bi bi-ticket-detailed"></i>
        </div>
        <h3>No tickets found</h3>
        <p>{tab === "all"
            ? "You haven't raised any support tickets yet."
            : `You have no "${tab}" tickets.`}</p>
        {tab === "all" && (
            <button className="st-btn-new" onClick={onNew}>
                <i className="bi bi-plus-lg"></i> Raise Your First Ticket
            </button>
        )}
    </div>
);

export default StudentTickets;
