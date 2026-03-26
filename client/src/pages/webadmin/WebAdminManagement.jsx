import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axiosInstance";
import "./StaffManagement.css"; // Reuse styling from StaffManagement

const SERVER_BASE = "http://localhost:5001";

function AvatarCell({ src, name }) {
    const initials = (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return (
        <div className="sm-avatar-cell">
            {src ? (
                <img
                    src={`${SERVER_BASE}/${src}`}
                    alt={name}
                    className="sm-photo"
                    onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                />
            ) : null}
            <div className="sm-avatar" style={src ? { display: "none" } : {}}>{initials}</div>
        </div>
    );
}

function WebAdminManagement() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // DataTable state
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Add modal
    const [showAdd, setShowAdd] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const [tempPwds, setTempPwds] = useState([]);
    const [chosenPwd, setChosenPwd] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [form, setForm] = useState({ full_name: "", email: "", role: "web_admin" });

    // Delete modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/webadmin/admins");
            setAdmins(res.data);
        } catch {
            setError("Failed to load web administrators list.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchAdmins(); }, []);

    // ── Filtering & Pagination ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return admins;
        return admins.filter(a =>
            (a.full_name || "").toLowerCase().includes(q) ||
            (a.email || "").toLowerCase().includes(q)
        );
    }, [admins, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

    // ── Add Modal logic ───────────────────────────────────────────────────────
    const openAddModal = async () => {
        setForm({ full_name: "", email: "", role: "web_admin" });
        setAddError(""); setChosenPwd(""); setTempPwds([]);
        setShowAdd(true); setPwdLoading(true);
        try {
            const res = await axios.get("/webadmin/temp-passwords");
            setTempPwds(res.data.passwords);
            setChosenPwd(res.data.passwords[0]);
        } catch {
            setAddError("Could not generate temporary passwords.");
        } finally { setPwdLoading(false); }
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!chosenPwd) return setAddError("Please select a temporary password.");
        setAddLoading(true); setAddError("");
        try {
            await axios.post("/webadmin/admins", { ...form, chosen_password: chosenPwd });
            setShowAdd(false);
            fetchAdmins();
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to create web admin account.");
        } finally { setAddLoading(false); }
    };

    // ── Delete logic ─────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleting(true);
        setDeleteError("");
        try {
            await axios.delete(`/webadmin/admins/${id}`);
            setDeleteId(null);
            fetchAdmins();
        } catch (err) {
            setDeleteError(err.response?.data?.message || "Failed to delete web admin member.");
        } finally { setDeleting(false); }
    };

    const pageNums = () => {
        const nums = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    return (
        <div className="sm-page">
            {/* Header */}
            <div className="sm-header">
                <div>
                    <h2 className="sm-title">Web Administrators</h2>
                    <p className="sm-subtitle">Manage system access for Web Administrators</p>
                </div>
                <button className="sm-add-btn" onClick={openAddModal}>
                    <i className="bi bi-person-plus-fill" /> Add Web Admin
                </button>
            </div>

            {error && <div className="sm-error">{error}</div>}

            {/* Toolbar */}
            <div className="sm-toolbar">
                <div className="sm-search-wrap">
                    <span className="sm-search-icon"><i className="bi bi-search" /></span>
                    <input
                        type="text"
                        className="sm-search"
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={handleSearch}
                    />
                    {search && <button className="sm-search-clear" onClick={() => { setSearch(""); setPage(1); }}><i className="bi bi-x" /></button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Show:
                        <select 
                            value={pageSize} 
                            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                        >
                            {[10, 25, 50, 100].map(num => <option key={num} value={num}>{num}</option>)}
                        </select>
                    </div>
                    <div className="sm-count">
                        {loading ? "" : `${filtered.length} web admin${filtered.length !== 1 ? "s" : ""}`}
                    </div>
                </div>
            </div>

            {/* Table grid */}
            {loading ? (
                <div className="sm-loading"><div className="sm-spinner" /> Loading admins…</div>
            ) : filtered.length === 0 ? (
                <div className="sm-empty">
                    <div className="sm-empty-icon"><i className="bi bi-person-badge" /></div>
                    <p>{search ? "No administrators match your search." : "No administrators yet."}</p>
                </div>
            ) : (
                <>
                    <div className="sm-table-wrap">
                        <table className="sm-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Photo</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((a, idx) => (
                                    <tr key={a.id}>
                                        <td className="sm-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                        <td><AvatarCell src={a.profile_image} name={a.full_name} /></td>
                                        <td className="sm-name">{a.full_name}</td>
                                        <td className="sm-email">{a.email}</td>
                                        <td>
                                            <span className={`sm-badge ${a.is_temp_password ? "sm-badge--temp" : "sm-badge--active"}`}>
                                                {a.is_temp_password ? "Temp Password" : "Active"}
                                            </span>
                                        </td>
                                        <td className="sm-date">
                                            {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td>
                                            <button className="sm-del-btn" onClick={() => { setDeleteId(a.id); setDeleteError(""); }} title="Delete Administrator">
                                                <i className="bi bi-trash3-fill" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="sm-pagination">
                            <button className="sm-page-btn" onClick={() => setPage(1)} disabled={currentPage === 1}>«</button>
                            <button className="sm-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                            {pageNums().map(n => (
                                <button
                                    key={n}
                                    className={`sm-page-btn ${n === currentPage ? "sm-page-btn--active" : ""}`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </button>
                            ))}
                            <button className="sm-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                            <button className="sm-page-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                            <span className="sm-page-info">Page {currentPage} of {totalPages}</span>
                        </div>
                    )}
                </>
            )}

            {/* Add Modal */}
            {showAdd && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setShowAdd(false)}>
                    <div className="sm-modal" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h3><i className="bi bi-person-plus-fill" /> Add New Web Administrator</h3>
                            <button className="sm-modal-close" onClick={() => setShowAdd(false)}><i className="bi bi-x" /></button>
                        </div>
                        <form className="sm-modal-form" onSubmit={handleAddSubmit}>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    name="full_name"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    required
                                    placeholder="e.g. Admin User"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                    placeholder="admin@1campus.edu"
                                />
                            </div>

                            <div className="form-group sm-pwd-group">
                                <label>Temporary Password * <span className="sm-label-hint">— user must change on first login</span></label>
                                {pwdLoading ? <div className="sm-pwd-loading"><span className="sm-spinner sm-spinner--sm" /> Generating…</div> : (
                                    <div className="sm-pwd-options">
                                        {tempPwds.map((pwd, i) => (
                                            <label key={i} className={`sm-pwd-card ${chosenPwd === pwd ? "sm-pwd-card--selected" : ""}`}>
                                                <input type="radio" name="tempPwd" value={pwd} checked={chosenPwd === pwd} onChange={() => setChosenPwd(pwd)} />
                                                <code className="sm-pwd-text">{pwd}</code>
                                                {chosenPwd === pwd && <i className="bi bi-check-circle-fill sm-pwd-check" />}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {addError && <div className="sm-error sm-error--add">{addError}</div>}

                            <div className="sm-modal-actions">
                                <button type="button" className="sm-cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="sm-confirm-btn" disabled={addLoading}>
                                    {addLoading ? <><span className="sm-spinner sm-spinner--sm" /> Creating…</> : "Create Admin Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body)}

            {/* Delete Confirmation */}
            {deleteId && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setDeleteId(null)}>
                    <div className="sm-modal sm-modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header sm-modal-header--danger">
                            <h3><i className="bi bi-exclamation-triangle-fill" /> Delete Administrator</h3>
                            <button className="sm-modal-close" onClick={() => setDeleteId(null)}><i className="bi bi-x" /></button>
                        </div>
                        <p className="sm-confirm-text">
                            Are you sure you want to permanently delete this web administrator's account? They will lose all access to the system.
                        </p>
                        {deleteError && <div className="sm-error sm-error--add" style={{margin: '0 2rem'}}>{deleteError}</div>}
                        <div className="sm-modal-actions">
                            <button className="sm-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="sm-delete-btn" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                                {deleting ? <><span className="sm-spinner sm-spinner--sm" /> Deleting…</> : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}

export default WebAdminManagement;
