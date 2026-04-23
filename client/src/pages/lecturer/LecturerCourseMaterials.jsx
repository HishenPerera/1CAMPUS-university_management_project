import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "../../api/axiosInstance";
import "./LecturerCourseMaterials.css";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SERVER_BASE = "http://localhost:5001";

function getWeeksInMonth(year, monthIndex) {
    const weeks = [];
    let current = new Date(year, monthIndex, 1);
    let dayOfWeek = current.getDay();
    let diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    current = new Date(current.setDate(diff));
    while (true) {
        let weekStart = new Date(current);
        let weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekStart.getFullYear() > year || (weekStart.getFullYear() === year && weekStart.getMonth() > monthIndex)) break;
        const startM = MONTH_NAMES[weekStart.getMonth()];
        const endM = MONTH_NAMES[weekEnd.getMonth()];
        weeks.push(`${startM} ${weekStart.getDate()} - ${endM} ${weekEnd.getDate()}`);
        current.setDate(current.getDate() + 7);
    }
    return weeks;
}

function LecturerCourseMaterials({ course, onBack }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const intake = course?.intake || null;
    const janMonths = [0, 1, 2, 3, 4, 5];
    const julMonths = [6, 7, 8, 9, 10, 11];
    const allowedMonths = intake === 'Jan-Jun' ? janMonths : intake === 'Jul-Dec' ? julMonths : null;
    const defaultMonth = intake === 'Jan-Jun' ? 0 : intake === 'Jul-Dec' ? 6 : currentMonth;

    const [year, setYear] = useState(currentYear);
    const [activeMonth, setActiveMonth] = useState(defaultMonth);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Attendance state
    const [attendanceSessions, setAttendanceSessions] = useState([]);
    const [toast, setToast] = useState({ msg: "", type: "" });

    // Post Attendance Modal
    const [showAttModal, setShowAttModal] = useState(false);
    const [attWeek, setAttWeek] = useState("");
    const [attTitle, setAttTitle] = useState("");
    const [attSubmitting, setAttSubmitting] = useState(false);
    const [attError, setAttError] = useState("");

    // Records Modal
    const [recordsModal, setRecordsModal] = useState(null);
    const [recordsLoading, setRecordsLoading] = useState(false);

    // Upload Material Modal
    const [showUpload, setShowUpload] = useState(false);
    const [uploadWeek, setUploadWeek] = useState("");
    const [uploadType, setUploadType] = useState("file");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLink, setUploadLink] = useState("");
    const [uploadName, setUploadName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    };

    const fetchMaterials = useCallback(async () => {
        if (!course) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`/lecturer/modules/${course.id}/materials?year=${year}`);
            setMaterials(res.data);
        } catch {
            setError("Failed to fetch module materials.");
        } finally {
            setLoading(false);
        }
    }, [course, year]);

    const fetchAttendanceSessions = useCallback(async () => {
        if (!course) return;
        try {
            const res = await axios.get(`/lecturer/modules/${course.id}/attendance?year=${year}`);
            setAttendanceSessions(res.data);
        } catch (err) {
            console.error("Failed to fetch attendance sessions", err);
        }
    }, [course, year]);

    useEffect(() => {
        fetchMaterials();
        fetchAttendanceSessions();
    }, [fetchMaterials, fetchAttendanceSessions]);

    const weeks = getWeeksInMonth(year, activeMonth);
    const getSessionsForWeek = (weekLabel) =>
        attendanceSessions.filter(s => s.month === activeMonth && s.week_label === weekLabel);

    // Open post attendance modal
    const openAttModal = (weekLabel) => {
        setAttWeek(weekLabel);
        setAttTitle("");
        setAttError("");
        setShowAttModal(true);
    };

    // Submit new attendance session
    const handlePostAttendance = async (e) => {
        e.preventDefault();
        if (!attTitle.trim()) return setAttError("Please enter a session title.");
        setAttSubmitting(true);
        setAttError("");
        try {
            await axios.post(`/lecturer/modules/${course.id}/attendance`, {
                title: attTitle.trim(),
                year,
                month: activeMonth,
                week_label: attWeek,
            });
            setShowAttModal(false);
            showToast("Attendance session created and opened!");
            await fetchAttendanceSessions();
        } catch (err) {
            setAttError(err.response?.data?.message || "Failed to create session.");
        } finally {
            setAttSubmitting(false);
        }
    };

    // Toggle open/close a session
    const handleToggleSession = async (session) => {
        try {
            const res = await axios.patch(`/lecturer/attendance/${session.id}/toggle`);
            showToast(res.data.message);
            setAttendanceSessions(prev =>
                prev.map(s => s.id === session.id ? { ...s, is_open: !s.is_open } : s)
            );
            // Also update recordsModal if open
            if (recordsModal?.session?.id === session.id) {
                setRecordsModal(prev => ({ ...prev, session: { ...prev.session, is_open: !prev.session.is_open } }));
            }
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to toggle session.", "error");
        }
    };

    // Delete a session
    const handleDeleteSession = async (session) => {
        if (!window.confirm(`Delete "${session.title}"? This will remove all attendance records.`)) return;
        try {
            await axios.delete(`/lecturer/attendance/${session.id}`);
            showToast("Attendance session deleted.");
            setAttendanceSessions(prev => prev.filter(s => s.id !== session.id));
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to delete session.", "error");
        }
    };

    // View attendance records
    const handleViewRecords = async (session) => {
        setRecordsLoading(true);
        setRecordsModal({ session, records: [] });
        try {
            const res = await axios.get(`/lecturer/attendance/${session.id}/records`);
            setRecordsModal({ session: res.data.session, records: res.data.records });
        } catch {
            setRecordsModal(null);
            showToast("Failed to load records.", "error");
        } finally {
            setRecordsLoading(false);
        }
    };

    // Download CSV report — uses a token-authenticated GET
    const handleDownload = (session) => {
        const token = localStorage.getItem("token");
        // Build a temporary form POST to force download with auth header isn't possible,
        // so we fetch it as blob instead
        axios.get(`/lecturer/attendance/${session.id}/download`, { responseType: 'blob' })
            .then(res => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                const disposition = res.headers['content-disposition'];
                const match = disposition && disposition.match(/filename="?([^"]+)"?/);
                a.download = match ? match[1] : `attendance_report.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => showToast("Failed to download report.", "error"));
    };

    // Upload material
    const openUploadModal = (weekLabel) => {
        setUploadWeek(weekLabel);
        setUploadType("file");
        setUploadFile(null);
        setUploadLink("");
        setUploadName("");
        setUploadError("");
        setShowUpload(true);
    };

    const handleUploadSubmit = async (e) => {
        e.preventDefault();
        if (!uploadName.trim()) return setUploadError("Material name is required.");
        if (uploadType === "file" && !uploadFile) return setUploadError("Please select a file to upload.");
        if (uploadType === "link" && !uploadLink.trim()) return setUploadError("Please provide a valid URL.");
        setUploading(true);
        setUploadError("");
        try {
            let data;
            const headers = {};
            if (uploadType === "file") {
                data = new FormData();
                data.append("year", year);
                data.append("month", activeMonth);
                data.append("week_label", uploadWeek);
                data.append("file_type", "file");
                data.append("file_url", "");
                data.append("file_name", uploadName);
                data.append("material", uploadFile);
                headers["Content-Type"] = "multipart/form-data";
            } else {
                data = { year, month: activeMonth, week_label: uploadWeek, file_type: "link", file_name: uploadName, file_url: uploadLink };
            }
            await axios.post(`/lecturer/modules/${course.id}/materials`, data, { headers });
            setShowUpload(false);
            fetchMaterials();
        } catch (err) {
            setUploadError(err.response?.data?.message || "Failed to upload material.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteMaterial = async (matId) => {
        if (!window.confirm("Delete this material?")) return;
        try {
            await axios.delete(`/lecturer/modules/materials/${matId}`);
            setMaterials(prev => prev.filter(m => m.id !== matId));
        } catch {
            alert("Failed to delete material.");
        }
    };

    const getFileIcon = (fileUrl, fileType) => {
        if (fileType === "link") return "bi-link-45deg";
        if (fileUrl.endsWith(".pdf")) return "bi-file-earmark-pdf-fill";
        if (fileUrl.match(/\.(ppt|pptx)$/i)) return "bi-file-earmark-slides-fill";
        if (fileUrl.match(/\.(doc|docx)$/i)) return "bi-file-earmark-word-fill";
        if (fileUrl.match(/\.(zip|rar)$/i)) return "bi-file-earmark-zip-fill";
        return "bi-file-earmark-text-fill";
    };

    if (!course) return null;

    return (
        <div className="lcm-page">
            {/* Toast */}
            {toast.msg && (
                <div className={`lcm-attendance-toast ${toast.type === 'error' ? 'lcm-toast-error' : 'lcm-toast-success'}`}>
                    {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="lcm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="lcm-back-btn" onClick={onBack}><i className="bi bi-arrow-left" /> Back</button>
                    <div>
                        <h2 className="lcm-title">{course.module_name}</h2>
                        <p className="lcm-subtitle">{course.module_code} • Materials & Attendance</p>
                    </div>
                </div>
                <div className="lcm-year-select">
                    <label>Academic Year:</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Month Tabs */}
            <div className="lcm-months-scroll">
                {SHORT_MONTHS.map((m, idx) => {
                    const isDisabled = allowedMonths && !allowedMonths.includes(idx);
                    return (
                        <button
                            key={m}
                            className={`lcm-month-tab ${activeMonth === idx ? "lcm-month-tab--active" : ""} ${isDisabled ? "lcm-month-tab--disabled" : ""}`}
                            onClick={() => !isDisabled && setActiveMonth(idx)}
                            disabled={isDisabled}
                            title={isDisabled ? `Not part of ${intake} intake window` : ''}
                        >{m}</button>
                    );
                })}
            </div>

            {error && <div className="lcm-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {loading ? (
                <div className="lcm-loading"><div className="lcm-spinner" /> Loading...</div>
            ) : (
                <div className="lcm-weeks-container">
                    {weeks.map(weekLabel => {
                        const weekMaterials = materials.filter(m => m.month === activeMonth && m.week_label === weekLabel);
                        const weekSessions = getSessionsForWeek(weekLabel);

                        return (
                            <div key={weekLabel} className="lcm-week-card">
                                {/* Week Header */}
                                <div className="lcm-week-header">
                                    <h4 className="lcm-week-title"><i className="bi bi-calendar2-week" /> {weekLabel}</h4>
                                    <div className="lcm-week-actions">
                                        <button className="lcm-att-post-btn" onClick={() => openAttModal(weekLabel)}>
                                            <i className="bi bi-clipboard-check-fill" /> Post Attendance
                                        </button>
                                        <button className="lcm-btn-upload" onClick={() => openUploadModal(weekLabel)}>
                                            <i className="bi bi-cloud-arrow-up-fill" /> Upload Content
                                        </button>
                                    </div>
                                </div>

                                {/* Week Body */}
                                <div className="lcm-week-body">

                                    {/* Attendance Sessions — listed like materials */}
                                    {weekSessions.length > 0 && (
                                        <div className="lcm-att-section">
                                            <div className="lcm-att-section-label">
                                                <i className="bi bi-person-check-fill" /> Attendance Sessions
                                            </div>
                                            <ul className="lcm-att-list">
                                                {weekSessions.map(session => (
                                                    <li key={session.id} className={`lcm-att-item ${session.is_open ? 'lcm-att-item--open' : 'lcm-att-item--closed'}`}>
                                                        <div className="lcm-att-item-left">
                                                            <i className={`bi ${session.is_open ? 'bi-door-open-fill' : 'bi-door-closed-fill'} lcm-att-item-icon`} />
                                                            <div>
                                                                <div className="lcm-att-item-title">{session.title}</div>
                                                                <div className="lcm-att-item-meta">
                                                                    <span className={`lcm-att-status-chip ${session.is_open ? 'open' : 'closed'}`}>
                                                                        {session.is_open ? 'Open' : 'Closed'}
                                                                    </span>
                                                                    <span className="lcm-att-count">
                                                                        <i className="bi bi-people-fill" /> {session.total_present} present
                                                                    </span>
                                                                    <span className="lcm-att-date">
                                                                        {new Date(session.created_at).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="lcm-att-item-actions">
                                                            <button
                                                                className="lcm-att-action-btn lcm-att-action-btn--toggle"
                                                                onClick={() => handleToggleSession(session)}
                                                                title={session.is_open ? 'Close attendance' : 'Reopen attendance'}
                                                            >
                                                                <i className={`bi ${session.is_open ? 'bi-stop-circle' : 'bi-arrow-counterclockwise'}`} />
                                                                {session.is_open ? 'Close' : 'Reopen'}
                                                            </button>
                                                            <button
                                                                className="lcm-att-action-btn lcm-att-action-btn--view"
                                                                onClick={() => handleViewRecords(session)}
                                                                title="View who attended"
                                                            >
                                                                <i className="bi bi-eye-fill" /> View
                                                            </button>
                                                            <button
                                                                className="lcm-att-action-btn lcm-att-action-btn--download"
                                                                onClick={() => handleDownload(session)}
                                                                title="Download CSV report"
                                                            >
                                                                <i className="bi bi-file-earmark-spreadsheet-fill" /> Download
                                                            </button>
                                                            <button
                                                                className="lcm-att-action-btn lcm-att-action-btn--delete"
                                                                onClick={() => handleDeleteSession(session)}
                                                                title="Delete session"
                                                            >
                                                                <i className="bi bi-trash3-fill" />
                                                            </button>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Course Materials */}
                                    {weekMaterials.length === 0 && weekSessions.length === 0 ? (
                                        <div className="lcm-week-empty">No content for this week yet.</div>
                                    ) : weekMaterials.length > 0 ? (
                                        <div className="lcm-materials-section">
                                            {weekSessions.length > 0 && (
                                                <div className="lcm-att-section-label" style={{ marginTop: '1rem' }}>
                                                    <i className="bi bi-folder2-open" /> Course Materials
                                                </div>
                                            )}
                                            <ul className="lcm-materials-list">
                                                {weekMaterials.map(mat => (
                                                    <li key={mat.id} className="lcm-material-item">
                                                        <div className="lcm-material-info">
                                                            <i className={`bi ${getFileIcon(mat.file_url, mat.file_type)} lcm-material-icon`} />
                                                            <a
                                                                href={mat.file_type === 'link' ? mat.file_url : `${SERVER_BASE}${mat.file_url}`}
                                                                target="_blank" rel="noopener noreferrer"
                                                                className="lcm-material-link"
                                                            >
                                                                {mat.material_name || mat.file_name}
                                                            </a>
                                                        </div>
                                                        <button className="lcm-material-del" onClick={() => handleDeleteMaterial(mat.id)} title="Delete">
                                                            <i className="bi bi-trash3-fill" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Post Attendance Modal */}
            {showAttModal && createPortal(
                <div className="lcm-modal-backdrop" onClick={() => setShowAttModal(false)}>
                    <div className="lcm-modal" onClick={e => e.stopPropagation()}>
                        <div className="lcm-modal-header">
                            <h3><i className="bi bi-clipboard-check-fill" /> Post Attendance</h3>
                            <button className="lcm-modal-close" onClick={() => setShowAttModal(false)}><i className="bi bi-x" /></button>
                        </div>
                        <div className="lcm-modal-weekhint">Week: <strong>{attWeek}</strong></div>
                        <form onSubmit={handlePostAttendance}>
                            <div className="form-group">
                                <label>Session Title</label>
                                <input
                                    type="text"
                                    value={attTitle}
                                    onChange={e => setAttTitle(e.target.value)}
                                    placeholder="e.g. Lecture 2 Attendance 30th March"
                                    autoFocus
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.35rem', display: 'block' }}>
                                    Give this session a descriptive name so students can identify it.
                                </small>
                            </div>
                            {attError && <div className="lcm-error-msg"><i className="bi bi-exclamation-triangle-fill" /> {attError}</div>}
                            <div className="lcm-modal-actions">
                                <button type="button" className="lcm-btn-cancel" onClick={() => setShowAttModal(false)} disabled={attSubmitting}>Cancel</button>
                                <button type="submit" className="lcm-btn-submit" disabled={attSubmitting}>
                                    {attSubmitting ? <><span className="lcm-spinner-sm" /> Creating...</> : <><i className="bi bi-clipboard-check-fill" /> Post & Open</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Upload Material Modal */}
            {showUpload && createPortal(
                <div className="lcm-modal-backdrop" onClick={() => setShowUpload(false)}>
                    <div className="lcm-modal" onClick={e => e.stopPropagation()}>
                        <div className="lcm-modal-header">
                            <h3><i className="bi bi-cloud-plus-fill" /> Upload Materials</h3>
                            <button className="lcm-modal-close" onClick={() => setShowUpload(false)}><i className="bi bi-x" /></button>
                        </div>
                        <div className="lcm-modal-weekhint">Uploading for: <strong>{uploadWeek}</strong></div>
                        <form onSubmit={handleUploadSubmit}>
                            <div className="form-group">
                                <label>Material Name</label>
                                <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. Week 4 Lecture Slides" required />
                            </div>
                            <div className="form-group">
                                <label>Content Type</label>
                                <div className="lcm-type-toggles">
                                    <button type="button" className={`lcm-type-btn ${uploadType === 'file' ? 'active' : ''}`} onClick={() => setUploadType("file")}>
                                        <i className="bi bi-file-earmark-arrow-up" /> Upload File
                                    </button>
                                    <button type="button" className={`lcm-type-btn ${uploadType === 'link' ? 'active' : ''}`} onClick={() => setUploadType("link")}>
                                        <i className="bi bi-link-45deg" /> External Link
                                    </button>
                                </div>
                            </div>
                            {uploadType === "file" ? (
                                <div className="form-group">
                                    <label>Select File (PDF, PPTX, Doc, ZIP)</label>
                                    <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip" onChange={e => setUploadFile(e.target.files[0])} />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>URL / Web Link</label>
                                    <input type="url" value={uploadLink} onChange={e => setUploadLink(e.target.value)} placeholder="https://example.com/resource" />
                                </div>
                            )}
                            {uploadError && <div className="lcm-error-msg"><i className="bi bi-exclamation-triangle-fill" /> {uploadError}</div>}
                            <div className="lcm-modal-actions">
                                <button type="button" className="lcm-btn-cancel" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
                                <button type="submit" className="lcm-btn-submit" disabled={uploading}>
                                    {uploading ? <><span className="lcm-spinner-sm" /> Uploading...</> : "Upload Content"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Attendance Records Modal */}
            {recordsModal && createPortal(
                <div className="lcm-modal-backdrop" onClick={() => setRecordsModal(null)}>
                    <div className="lcm-modal lcm-modal--wide" onClick={e => e.stopPropagation()}>
                        <div className="lcm-modal-header">
                            <h3><i className="bi bi-people-fill" /> Attendance Records</h3>
                            <button className="lcm-modal-close" onClick={() => setRecordsModal(null)}><i className="bi bi-x" /></button>
                        </div>
                        <div className="lcm-modal-weekhint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span><strong>{recordsModal.session.title}</strong></span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className={`lcm-att-status-badge ${recordsModal.session.is_open ? 'open' : 'closed'}`}>
                                    {recordsModal.session.is_open ? 'Open' : 'Closed'}
                                </span>
                                <button
                                    className="lcm-att-action-btn lcm-att-action-btn--download"
                                    onClick={() => handleDownload(recordsModal.session)}
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <i className="bi bi-file-earmark-spreadsheet-fill" /> Download CSV
                                </button>
                                <button
                                    className={`lcm-att-action-btn ${recordsModal.session.is_open ? 'lcm-att-action-btn--toggle' : 'lcm-att-action-btn--view'}`}
                                    onClick={() => handleToggleSession(recordsModal.session)}
                                    style={{ fontSize: '0.82rem' }}
                                >
                                    <i className={`bi ${recordsModal.session.is_open ? 'bi-stop-circle' : 'bi-arrow-counterclockwise'}`} />
                                    {recordsModal.session.is_open ? 'Close' : 'Reopen'}
                                </button>
                            </div>
                        </div>
                        {recordsLoading ? (
                            <div className="lcm-records-loading"><div className="lcm-spinner" /> Loading records...</div>
                        ) : recordsModal.records.length === 0 ? (
                            <div className="lcm-records-empty">
                                <i className="bi bi-person-x" />
                                <p>No students have marked attendance yet.</p>
                            </div>
                        ) : (
                            <div className="lcm-records-table-wrap">
                                <table className="lcm-records-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student Name</th>
                                            <th>Reg. Number</th>
                                            <th>Marked At</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordsModal.records.map((r, i) => (
                                            <tr key={r.id}>
                                                <td>{i + 1}</td>
                                                <td><i className="bi bi-person-circle" style={{ marginRight: '0.4rem', color: 'var(--brand-primary)' }} />{r.student_name}</td>
                                                <td><span className="lcm-reg-badge">{r.registration_number || '—'}</span></td>
                                                <td>{new Date(r.marked_at).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="lcm-records-total">
                                    Total Present: <strong>{recordsModal.records.length}</strong> student{recordsModal.records.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default LecturerCourseMaterials;
