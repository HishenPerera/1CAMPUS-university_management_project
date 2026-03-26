import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axiosInstance";
import "./StudentManagement.css";

function StudentManagement() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Add student form state
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [tempPwds, setTempPwds] = useState([]);
    const [chosenPwd, setChosenPwd] = useState("");
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");
    const [pwdLoading, setPwdLoading] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get("/admin/students");
            setStudents(res.data);
        } catch {
            setError("Failed to load students.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const pageNums = () => {
        const nums = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    const openAddModal = async () => {
        setFullName(""); setEmail(""); setAddError("");
        setTempPwds([]); setChosenPwd("");
        setShowModal(true);
        setPwdLoading(true);
        try {
            const res = await axios.get("/admin/temp-passwords");
            setTempPwds(res.data.passwords);
            setChosenPwd(res.data.passwords[0]);
        } catch {
            setAddError("Could not generate passwords.");
        } finally {
            setPwdLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!chosenPwd) return setAddError("Please select a temporary password.");
        setAddLoading(true); setAddError("");
        try {
            await axios.post("/admin/students", {
                full_name: fullName,
                email,
                chosen_password: chosenPwd,
            });
            setShowModal(false);
            fetchStudents();
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to create student.");
        } finally {
            setAddLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await axios.delete(`/admin/students/${id}`);
            setDeleteId(null);
            fetchStudents();
        } catch {
            setError("Failed to delete student.");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="sm-page">
            {/* Page Header */}
            <div className="sm-page-header">
                <div>
                    <h2 className="sm-title">Student Management</h2>
                    <p className="sm-subtitle">Manage student accounts — add, view, or remove students</p>
                </div>
                <button className="sm-add-btn" onClick={openAddModal}>
                    <span>＋</span> Add Student
                </button>
            </div>

            {/* Error banner */}
            {error && <div className="sm-error">{error}</div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem 1.25rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px var(--shadow)' }}>
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
                    {loading ? "" : `${students.length} student${students.length !== 1 ? "s" : ""}`}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="sm-loading">
                    <div className="sm-spinner" /> Loading students…
                </div>
            ) : students.length === 0 ? (
                <div className="sm-empty">
                    <div className="sm-empty-icon"><i className="bi bi-mortarboard-fill" /></div>
                    <p>No students found. Add your first student to get started.</p>
                </div>
            ) : (
                <div className="sm-table-wrap">
                    <table className="sm-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((s, i) => (
                                <tr key={s.id}>
                                    <td className="sm-num">{(currentPage - 1) * pageSize + i + 1}</td>
                                    <td>
                                        <div className="sm-name-cell">
                                            <div className="sm-avatar">{s.full_name.charAt(0).toUpperCase()}</div>
                                            {s.full_name}
                                        </div>
                                    </td>
                                    <td className="sm-email">{s.email}</td>
                                    <td>
                                        <span className={`sm-badge ${s.is_temp_password ? "sm-badge--temp" : "sm-badge--active"}`}>
                                            {s.is_temp_password ? "Temp Password" : "Active"}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="sm-del-btn"
                                            onClick={() => setDeleteId(s.id)}
                                            title="Delete student"
                                        >
                                            <i className="bi bi-trash3-fill" /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => setPage(1)} disabled={currentPage === 1} style={{ width: '36px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>«</button>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ width: '36px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '8px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>‹</button>
                    {pageNums().map(n => (
                        <button key={n} onClick={() => setPage(n)} style={{ width: '36px', height: '36px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: n === currentPage ? 'var(--brand-primary)' : 'var(--bg-card)', color: n === currentPage ? 'white' : 'var(--text-primary)' }}>
                            {n}
                        </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ width: '36px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>›</button>
                    <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} style={{ width: '36px', height: '36px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '8px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}>»</button>
                </div>
            )}

            {/* ── Add Student Modal ─────────────────────────────────────── */}
            {showModal && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h3>Add New Student</h3>
                            <button className="sm-modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x" /></button>
                        </div>

                        <form className="sm-modal-form" onSubmit={handleAdd}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Alice Johnson"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    disabled={addLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="student@university.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={addLoading}
                                />
                            </div>

                            {/* Temp Password Selection */}
                            <div className="form-group">
                                <label>Temporary Password <span className="sm-label-hint">(student must change on first login)</span></label>
                                {pwdLoading ? (
                                    <div className="sm-pwd-loading">Generating passwords…</div>
                                ) : (
                                    <div className="sm-pwd-options">
                                        {tempPwds.map((pwd, i) => (
                                            <label
                                                key={i}
                                                className={`sm-pwd-card ${chosenPwd === pwd ? "sm-pwd-card--selected" : ""}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="tempPwd"
                                                    value={pwd}
                                                    checked={chosenPwd === pwd}
                                                    onChange={() => setChosenPwd(pwd)}
                                                />
                                                <code className="sm-pwd-text">{pwd}</code>
                                                {chosenPwd === pwd && <i className="bi bi-check-circle-fill sm-pwd-check" />}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {addError && <div className="sm-error">{addError}</div>}

                            <div className="sm-modal-actions">
                                <button type="button" className="sm-cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="sm-confirm-btn" disabled={addLoading}>
                                    {addLoading ? "Creating…" : "Create Student"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body)}

            {/* ── Delete Confirm Modal ──────────────────────────────────── */}
            {deleteId && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setDeleteId(null)}>
                    <div className="sm-modal sm-modal--sm" onClick={(e) => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h3>Delete Student</h3>
                            <button className="sm-modal-close" onClick={() => setDeleteId(null)}><i className="bi bi-x" /></button>
                        </div>
                        <p className="sm-confirm-text">Are you sure you want to permanently delete this student? This action cannot be undone.</p>
                        <div className="sm-modal-actions">
                            <button className="sm-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button
                                className="sm-delete-confirm-btn"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting…" : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}

export default StudentManagement;
