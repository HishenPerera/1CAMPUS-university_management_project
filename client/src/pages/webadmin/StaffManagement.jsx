import { useState, useEffect, useMemo } from "react";
import axios from "../../api/axiosInstance";
import "./StaffManagement.css";

const ROLES = [
    { value: "lecturer", label: "Lecturer" },
    { value: "admin_staff", label: "Administrative Staff" }
];

const SERVER_BASE = "http://localhost:5001";
const PAGE_SIZE = 10;

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

function StaffManagement() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // DataTable state
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Add modal
    const [showAdd, setShowAdd] = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const [tempPwds, setTempPwds] = useState([]);
    const [chosenPwd, setChosenPwd] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);
    const [form, setForm] = useState({ full_name: "", email: "", role: "lecturer" });

    // Delete modal
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/webadmin/staff");
            setStaff(res.data);
        } catch {
            setError("Failed to load staff list.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchStaff(); }, []);

    // ── Filtering & Pagination ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return staff;
        return staff.filter(s =>
            (s.full_name || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q) ||
            s.role.toLowerCase().includes(q)
        );
    }, [staff, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

    // ── Add Modal logic ───────────────────────────────────────────────────────
    const openAddModal = async () => {
        setForm({ full_name: "", email: "", role: "lecturer" });
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
            await axios.post("/webadmin/staff", { ...form, chosen_password: chosenPwd });
            setShowAdd(false);
            fetchStaff();
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to create staff account.");
        } finally { setAddLoading(false); }
    };

    // ── Delete logic ─────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await axios.delete(`/webadmin/staff/${id}`);
            setDeleteId(null);
            fetchStaff();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to delete staff member.");
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
                    <h2 className="sm-title">Staff Management</h2>
                    <p className="sm-subtitle">Manage system access for Lecturers and Administrative Staff</p>
                </div>
                <button className="sm-add-btn" onClick={openAddModal}>
                    <i className="bi bi-person-plus-fill" /> Add Staff Member
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
                        placeholder="Search by name, email, or role…"
                        value={search}
                        onChange={handleSearch}
                    />
                    {search && <button className="sm-search-clear" onClick={() => { setSearch(""); setPage(1); }}>✕</button>}
                </div>
                <div className="sm-count">
                    {loading ? "" : `${filtered.length} staff member${filtered.length !== 1 ? "s" : ""}`}
                </div>
            </div>

            {/* Table grid */}
            {loading ? (
                <div className="sm-loading"><div className="sm-spinner" /> Loading staff…</div>
            ) : filtered.length === 0 ? (
                <div className="sm-empty">
                    <div className="sm-empty-icon"><i className="bi bi-people" /></div>
                    <p>{search ? "No staff match your search." : "No staff members yet. Add your first staff member to get started."}</p>
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
                                    <th>Role</th>
                                    <th>Portal Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td className="sm-num">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                                        <td><AvatarCell src={s.profile_image} name={s.full_name} /></td>
                                        <td className="sm-name">{s.full_name}</td>
                                        <td className="sm-email">{s.email}</td>
                                        <td>
                                            <span className={`sm-role-badge sm-role--${s.role}`}>
                                                {s.role === 'admin_staff' ? 'Admin Staff' : 'Lecturer'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`sm-badge ${s.is_temp_password ? "sm-badge--temp" : "sm-badge--active"}`}>
                                                {s.is_temp_password ? "Temp Password" : "Active"}
                                            </span>
                                        </td>
                                        <td className="sm-date">
                                            {new Date(s.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td>
                                            <button className="sm-del-btn" onClick={() => setDeleteId(s.id)} title="Delete Staff Member">
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
            {showAdd && (
                <div className="sm-modal-backdrop" onClick={() => setShowAdd(false)}>
                    <div className="sm-modal" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h3><i className="bi bi-person-plus-fill" /> Add New Staff Member</h3>
                            <button className="sm-modal-close" onClick={() => setShowAdd(false)}>✕</button>
                        </div>
                        <form className="sm-modal-form" onSubmit={handleAddSubmit}>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    name="full_name"
                                    value={form.full_name}
                                    onChange={e => setForm({ ...form, full_name: e.target.value })}
                                    required
                                    placeholder="e.g. Dr. John Doe"
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
                                    placeholder="john.doe@1campus.edu"
                                />
                            </div>
                            <div className="form-group">
                                <label>System Role *</label>
                                <div className="sm-select-wrap">
                                    <select
                                        name="role"
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                        required
                                    >
                                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
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
                                    {addLoading ? <><span className="sm-spinner sm-spinner--sm" /> Creating…</> : "Create Staff Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="sm-modal-backdrop" onClick={() => setDeleteId(null)}>
                    <div className="sm-modal sm-modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header sm-modal-header--danger">
                            <h3><i className="bi bi-exclamation-triangle-fill" /> Delete Staff</h3>
                            <button className="sm-modal-close" onClick={() => setDeleteId(null)}>✕</button>
                        </div>
                        <p className="sm-confirm-text">
                            Are you sure you want to permanently delete this staff member's account? They will lose all access to the system.
                        </p>
                        <div className="sm-modal-actions">
                            <button className="sm-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="sm-delete-btn" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                                {deleting ? <><span className="sm-spinner sm-spinner--sm" /> Deleting…</> : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffManagement;
