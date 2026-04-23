import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axiosInstance";
import "../webadmin/StaffManagement.css";
import "./StudentPortalAccess.css";

const DEGREES = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Engineering",
    "Bachelor of Business Administration",
    "Bachelor of Science in Data Science",
    "Bachelor of Arts",
    "Master of Science in Computer Science",
    "Master of Business Administration",
];
const SERVER_BASE = "http://localhost:5001";

function PhotoAvatar({ src, name }) {
    const initials = (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return src ? (
        <img
            src={`${SERVER_BASE}/${src}`}
            alt={name}
            className="spa-photo"
            onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
        />
    ) : null;
}

function AvatarCell({ src, name }) {
    const initials = (name || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    return (
        <div className="spa-avatar-cell">
            {src ? (
                <img
                    src={`${SERVER_BASE}/${src}`}
                    alt={name}
                    className="spa-photo"
                    onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling.style.display = "flex"; }}
                />
            ) : null}
            <div className="spa-avatar" style={src ? { display: "none" } : {}}>{initials}</div>
        </div>
    );
}

function StudentPortalAccess() {
    const [students, setStudents] = useState([]);
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
    const [form, setForm] = useState({
        first_name: "", last_name: "", email: "",
        personal_email: "",
        registration_number: "", degree_program: DEGREES[0], studying_year: 1,
        semester: 1, nic_number: "", phone_number: "",
        address: "", enrolled_date: new Date().toISOString().split("T")[0],
        intake: "Jan-Jun",
    });

    // Detail modal
    const [detailStudent, setDetailStudent] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [enquiryText, setEnquiryText] = useState("");
    const [enquirySuccess, setEnquirySuccess] = useState(false);

    // Delete
    const [deleteId, setDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get("/admin/students");
            setStudents(res.data);
        } catch { setError("Failed to load students."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    // ── DataTable filtering + pagination ────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return students;
        return students.filter(s =>
            `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.registration_number.toLowerCase().includes(q) ||
            (s.degree_program || "").toLowerCase().includes(q)
        );
    }, [students, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

    // ── Add modal ────────────────────────────────────────────────────
    const openAddModal = async () => {
        setForm({
            first_name: "", last_name: "", email: "", personal_email: "", registration_number: "",
            degree_program: DEGREES[0], studying_year: 1, semester: 1,
            nic_number: "", phone_number: "", address: "",
            enrolled_date: new Date().toISOString().split("T")[0],
            intake: "Jan-Jun",
        });
        setAddError(""); setChosenPwd(""); setTempPwds([]);
        setShowAdd(true); setPwdLoading(true);
        try {
            const res = await axios.get("/admin/temp-passwords");
            setTempPwds(res.data.passwords);
            setChosenPwd(res.data.passwords[0]);
        } catch { setAddError("Could not generate passwords."); }
        finally { setPwdLoading(false); }
    };

    const handleFormChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!chosenPwd) return setAddError("Please select a temporary password.");
        setAddLoading(true); setAddError("");
        try {
            await axios.post("/admin/students", { ...form, chosen_password: chosenPwd });
            setShowAdd(false); fetchStudents();
        } catch (err) {
            setAddError(err.response?.data?.message || "Failed to create student.");
        } finally { setAddLoading(false); }
    };

    // ── Detail modal ────────────────────────────────────────────────
    const openDetail = async (student) => {
        setDetailStudent(student); setEnquiryText(""); setEnquirySuccess(false); setDetailLoading(true);
        try {
            const res = await axios.get(`/admin/students/${student.id}`);
            setDetailStudent(res.data);
        } catch { }
        finally { setDetailLoading(false); }
    };

    const handleEnquirySubmit = (e) => {
        e.preventDefault();
        setEnquirySuccess(true);
        setTimeout(() => setEnquirySuccess(false), 3000);
        setEnquiryText("");
    };

    // ── Delete ───────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await axios.delete(`/admin/students/${id}`);
            setDeleteId(null);
            if (detailStudent?.id === id) setDetailStudent(null);
            fetchStudents();
        } catch { setError("Failed to delete student."); }
        finally { setDeleting(false); }
    };

    // Pagination button helper
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
                    <h2 className="sm-title">Student Portal Access Management</h2>
                    <p className="sm-subtitle">Manage student accounts, profiles and portal access</p>
                </div>
                <button className="sm-add-btn" onClick={openAddModal}>
                    <i className="bi bi-person-plus-fill" /> Add Student
                </button>
            </div>

            {error && <div className="sm-error">{error}</div>}

            {/* DataTable toolbar */}
            <div className="sm-toolbar">
                <div className="sm-search-wrap">
                    <span className="sm-search-icon"><i className="bi bi-search" /></span>
                    <input
                        type="text"
                        className="sm-search"
                        placeholder="Search by name, email, reg. no. or degree…"
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
                        {loading ? "" : `${filtered.length} student${filtered.length !== 1 ? "s" : ""}`}
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="sm-loading"><div className="sm-spinner" /> Loading students…</div>
            ) : filtered.length === 0 ? (
                <div className="sm-empty">
                    <div className="sm-empty-icon"><i className="bi bi-mortarboard-fill" /></div>
                    <p>{search ? "No students match your search." : "No students yet. Add your first student to get started."}</p>
                </div>
            ) : (
                <>
                    <div className="sm-table-wrap">
                        <table className="sm-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Photo</th>
                                    <th>Reg. No.</th>
                                    <th>Full Name</th>
                                    <th>Email</th>
                                    <th>Degree Program</th>
                                    <th>Yr / Sem</th>
                                    <th>Portal Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((s, idx) => (
                                    <tr key={s.id}>
                                        <td className="sm-num">{(currentPage - 1) * pageSize + idx + 1}</td>
                                        <td><AvatarCell src={s.profile_image} name={`${s.first_name} ${s.last_name}`} /></td>
                                        <td><code className="spa-reg">{s.registration_number}</code></td>
                                        <td>
                                            <div className="sm-name-cell">
                                                <span>{s.first_name} {s.last_name}</span>
                                            </div>
                                        </td>
                                        <td className="sm-email">{s.email}</td>
                                        <td className="spa-degree" title={s.degree_program}>{s.degree_program}</td>
                                        <td className="spa-yrsem">
                                            Y{s.studying_year} / S{s.semester}
                                            {s.intake && <><br/><span className="spa-intake-badge">{s.intake}</span></>}
                                        </td>
                                        <td>
                                            <span className={`sm-badge ${s.is_temp_password ? "sm-badge--temp" : s.user_id ? "sm-badge--active" : "spa-badge--noaccess"}`}>
                                                {s.is_temp_password ? "Temp Password" : s.user_id ? "Active" : "No Portal"}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button className="sm-del-btn" onClick={() => setDeleteId(s.id)} title="Delete Student">
                                                    <i className="bi bi-trash3-fill" />
                                                </button>
                                                <button className="sm-del-btn" onClick={() => openDetail(s)} title="View Student" style={{ color: 'var(--brand-primary)' }}>
                                                    <i className="bi bi-eye-fill" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
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

            {/* ═══════════════════════════════════════════════════════════
          DETAIL POPUP MODAL
      ═══════════════════════════════════════════════════════════ */}
            {detailStudent && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setDetailStudent(null)}>
                    <div className="sm-modal spa-modal--detail" onClick={e => e.stopPropagation()}>
                        <div className="spa-detail-modal-header">
                            <div className="spa-detail-avatar-wrap">
                                {detailStudent.profile_image ? (
                                    <img
                                        src={`${SERVER_BASE}/${detailStudent.profile_image}`}
                                        alt={detailStudent.first_name}
                                        className="spa-detail-photo"
                                    />
                                ) : (
                                    <div className="spa-detail-avatar-lg">
                                        {(detailStudent.first_name || "?").charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="spa-detail-title-block">
                                <h2 className="spa-detail-name">{detailStudent.first_name} {detailStudent.last_name}</h2>
                                <code className="spa-detail-reg">{detailStudent.registration_number}</code>
                                <span className={`spa-badge ${detailStudent.is_temp_password ? "spa-badge--temp" : detailStudent.user_id ? "spa-badge--active" : "spa-badge--noaccess"}`}>
                                    {detailStudent.is_temp_password ? "Temp Password" : detailStudent.user_id ? "Portal Active" : "No Portal Account"}
                                </span>
                            </div>
                            <button className="spa-modal-close spa-modal-close--top" onClick={() => setDetailStudent(null)}><i className="bi bi-x" /></button>
                        </div>

                        {detailLoading ? (
                            <div className="spa-loading" style={{ padding: "2rem" }}><div className="spa-spinner" /> Loading…</div>
                        ) : (
                            <div className="spa-detail-body">
                                <div className="spa-detail-section">
                                    <h3 className="spa-section-title"><i className="bi bi-person-lines-fill" /> Student Information</h3>
                                    <div className="spa-detail-grid">
                                        <DetailCard label="Email" value={detailStudent.email} />
                                        <DetailCard label="NIC Number" value={detailStudent.nic_number || "—"} />
                                        <DetailCard label="Phone" value={detailStudent.phone_number || "—"} />
                                        <DetailCard label="Degree Program" value={detailStudent.degree_program} full />
                                        <DetailCard label="Studying Year" value={`Year ${detailStudent.studying_year}`} />
                                        <DetailCard label="Semester" value={`Semester ${detailStudent.semester}`} />
                                        <DetailCard label="Intake" value={detailStudent.intake === 'Jan-Jun' ? 'January Intake (Jan–Jun)' : detailStudent.intake === 'Jul-Dec' ? 'July Intake (Jul–Dec)' : '—'} />
                                        <DetailCard label="Enrolled Date" value={detailStudent.enrolled_date ? new Date(detailStudent.enrolled_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"} />
                                        <DetailCard label="Status" value={detailStudent.status || "active"} />
                                        <DetailCard label="Address" value={detailStudent.address || "—"} full />
                                    </div>
                                </div>

                                <div className="spa-detail-section">
                                    <h3 className="spa-section-title"><i className="bi bi-envelope-fill" /> Make an Enquiry</h3>
                                    <p className="spa-enquiry-sub">Log a registration fee, academic or administrative enquiry.</p>
                                    <form className="spa-enquiry-form" onSubmit={handleEnquirySubmit}>
                                        <textarea
                                            className="spa-enquiry-input"
                                            placeholder="e.g. Registration fee pending for Semester 2…"
                                            rows={4} value={enquiryText}
                                            onChange={e => setEnquiryText(e.target.value)} required
                                        />
                                        {enquirySuccess && <div className="spa-enquiry-success"><i className="bi bi-check-circle-fill" /> Enquiry submitted successfully!</div>}
                                        <button type="submit" className="spa-enquiry-btn"><i className="bi bi-send-fill" /> Submit Enquiry</button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            , document.body)}

            {/* ═══════════════════════════════════════════════════════════
          ADD STUDENT MODAL
      ═══════════════════════════════════════════════════════════ */}
            {showAdd && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setShowAdd(false)}>
                    <div className="sm-modal" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header">
                            <h3>Add New Student</h3>
                            <button className="sm-modal-close" onClick={() => setShowAdd(false)}><i className="bi bi-x" /></button>
                        </div>
                        <form className="sm-modal-form" onSubmit={handleAdd}>
                            <div className="spa-form-row">
                                <div className="form-group"><label>First Name *</label><input name="first_name" value={form.first_name} onChange={handleFormChange} required placeholder="Alice" /></div>
                                <div className="form-group"><label>Last Name *</label><input name="last_name" value={form.last_name} onChange={handleFormChange} required placeholder="Johnson" /></div>
                            </div>
                            <div className="spa-form-row">
                                <div className="form-group"><label>Email Address * <span className="sm-label-hint">(portal login email)</span></label><input name="email" type="email" value={form.email} onChange={handleFormChange} required placeholder="cs26001@1campus.edu" /></div>
                                <div className="form-group"><label>Registration No. *</label><input name="registration_number" value={form.registration_number} onChange={handleFormChange} required placeholder="CS/2024/001" /></div>
                            </div>
                            <div className="form-group">
                                <label>Personal Email <span className="sm-label-hint">(student's contact email — enrollment details will be sent here)</span></label>
                                <input name="personal_email" type="email" value={form.personal_email} onChange={handleFormChange} placeholder="student@gmail.com" />
                            </div>
                            <div className="form-group"><label>Degree Program *</label><select name="degree_program" value={form.degree_program} onChange={handleFormChange} required>{DEGREES.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                            <div className="spa-form-row">
                                <div className="form-group"><label>Year *</label><select name="studying_year" value={form.studying_year} onChange={handleFormChange}>{[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}</select></div>
                                <div className="form-group"><label>Semester *</label><select name="semester" value={form.semester} onChange={handleFormChange}>{[1, 2].map(s => <option key={s} value={s}>Semester {s}</option>)}</select></div>
                                <div className="form-group"><label>Enrolled Date</label><input name="enrolled_date" type="date" value={form.enrolled_date} onChange={handleFormChange} /></div>
                            </div>
                            <div className="form-group">
                                <label>Intake *</label>
                                <select name="intake" value={form.intake} onChange={handleFormChange} required>
                                    <option value="Jan-Jun">January Intake (Jan–Jun)</option>
                                    <option value="Jul-Dec">July Intake (Jul–Dec)</option>
                                </select>
                            </div>
                            <div className="spa-form-row">
                                <div className="form-group"><label>NIC Number</label><input name="nic_number" value={form.nic_number} onChange={handleFormChange} placeholder="200012345678" /></div>
                                <div className="form-group"><label>Phone Number</label><input name="phone_number" value={form.phone_number} onChange={handleFormChange} placeholder="+94 71 234 5678" /></div>
                            </div>
                            <div className="form-group"><label>Address</label><textarea name="address" value={form.address} onChange={handleFormChange} rows={2} placeholder="123 Main Street, Colombo" /></div>
                            <div className="form-group">
                                <label>Temporary Password * <span className="sm-label-hint">— student must change on first login</span></label>
                                {pwdLoading ? <div className="sm-pwd-loading">Generating passwords…</div> : (
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
                            {addError && <div className="sm-error">{addError}</div>}
                            <div className="sm-modal-actions">
                                <button type="button" className="sm-cancel-btn" onClick={() => setShowAdd(false)}>Cancel</button>
                                <button type="submit" className="sm-confirm-btn" disabled={addLoading}>{addLoading ? "Creating…" : "Create Student"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body)}

            {/* Delete Confirm */}
            {deleteId && createPortal(
                <div className="sm-modal-backdrop" onClick={() => setDeleteId(null)}>
                    <div className="sm-modal sm-modal--sm" onClick={e => e.stopPropagation()}>
                        <div className="sm-modal-header sm-modal-header--danger">
                            <h3>Delete Student</h3>
                            <button className="sm-modal-close" onClick={() => setDeleteId(null)}><i className="bi bi-x" /></button>
                        </div>
                        <p className="sm-confirm-text">This will permanently remove the student's profile and portal login.</p>
                        <div className="sm-modal-actions">
                            <button className="sm-cancel-btn" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="sm-delete-btn" onClick={() => handleDelete(deleteId)} disabled={deleting}>{deleting ? "Deleting…" : "Yes, Delete"}</button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}

function DetailCard({ label, value, full }) {
    return (
        <div className={`spa-detail-card ${full ? "spa-detail-card--full" : ""}`}>
            <span className="spa-detail-label">{label}</span>
            <span className="spa-detail-value">{value}</span>
        </div>
    );
}

export default StudentPortalAccess;
