import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./StudentCourseMaterials.css";

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

        if (weekStart.getFullYear() > year || (weekStart.getFullYear() === year && weekStart.getMonth() > monthIndex)) {
            break;
        }

        const startM = MONTH_NAMES[weekStart.getMonth()];
        const endM = MONTH_NAMES[weekEnd.getMonth()];
        const label = `${startM} ${weekStart.getDate()} - ${endM} ${weekEnd.getDate()}`;
        weeks.push(label);

        current.setDate(current.getDate() + 7);
    }
    return weeks;
}

function StudentCourseMaterials({ course, onBack }) {
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
    const [markingLoading, setMarkingLoading] = useState({});
    const [toast, setToast] = useState({ msg: "", type: "" });

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "" }), 3500);
    };

    const fetchMaterials = useCallback(async () => {
        if (!course) return;
        setLoading(true);
        setError("");
        try {
            const res = await axiosInstance.get(`/student/modules/${course.id}/materials?year=${year}`);
            setMaterials(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch module materials. You might not have access.");
        } finally {
            setLoading(false);
        }
    }, [course, year]);

    const fetchAttendanceSessions = useCallback(async () => {
        if (!course) return;
        try {
            const res = await axiosInstance.get(`/student/modules/${course.id}/attendance?year=${year}`);
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

    const handleMarkAttendance = async (session) => {
        setMarkingLoading(prev => ({ ...prev, [session.id]: true }));
        try {
            const res = await axiosInstance.post(`/student/attendance/${session.id}/mark`);
            showToast(res.data.message);
            await fetchAttendanceSessions();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to mark attendance.", "error");
        } finally {
            setMarkingLoading(prev => ({ ...prev, [session.id]: false }));
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
        <div className="scm-page">
            {toast.msg && (
                <div className={`scm-att-toast ${toast.type === 'error' ? 'scm-toast-error' : 'scm-toast-success'}`}>
                    {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
                </div>
            )}

            <div className="scm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="scm-back-btn" onClick={onBack}>
                        <i className="bi bi-arrow-left" /> Back
                    </button>
                    <div>
                        <h2 className="scm-title">{course.module_name}</h2>
                        <p className="scm-subtitle">{course.module_code} • Course Materials</p>
                    </div>
                </div>
                <div className="scm-year-select">
                    <label>Academic Year:</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))}>
                        {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="scm-months-scroll">
                {SHORT_MONTHS.map((m, idx) => {
                    const isDisabled = allowedMonths && !allowedMonths.includes(idx);
                    return (
                        <button
                            key={m}
                            className={`scm-month-tab ${activeMonth === idx ? "scm-month-tab--active" : ""} ${isDisabled ? "scm-month-tab--disabled" : ""}`}
                            onClick={() => !isDisabled && setActiveMonth(idx)}
                            disabled={isDisabled}
                            title={isDisabled ? `Not part of ${intake} intake window` : ''}
                        >
                            {m}
                        </button>
                    );
                })}
            </div>

            {error && <div className="scm-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {loading ? (
                <div className="scm-loading"><div className="scm-spinner" /> Loading materials...</div>
            ) : (
                <div className="scm-weeks-container">
                    {weeks.map(weekLabel => {
                        const weekMaterials = materials.filter(m => m.month === activeMonth && m.week_label === weekLabel);
                        const weekSessions = getSessionsForWeek(weekLabel);

                        return (
                            <div key={weekLabel} className="scm-week-card">
                                <div className="scm-week-header">
                                    <h4 className="scm-week-title"><i className="bi bi-calendar2-week" /> {weekLabel}</h4>
                                </div>
                                <div className="scm-week-body">
                                    {/* Attendance Sessions */}
                                    {weekSessions.length > 0 && (
                                        <div className="scm-att-section">
                                            <div className="scm-att-section-label">
                                                <i className="bi bi-person-check-fill" /> Attendance
                                            </div>
                                            <ul className="scm-att-list">
                                                {weekSessions.map(session => {
                                                    const alreadyMarked = !!session.my_record;
                                                    const isMarking = !!markingLoading[session.id];

                                                    return (
                                                        <li key={session.id} className={`scm-att-item ${alreadyMarked ? 'scm-att-item--marked' : session.is_open ? 'scm-att-item--open' : 'scm-att-item--closed'}`}>
                                                            <div className="scm-att-info">
                                                                <div className="scm-att-title">{session.title}</div>
                                                                <div className="scm-att-meta">
                                                                    <span className={`scm-att-status-chip ${alreadyMarked ? 'marked' : session.is_open ? 'open' : 'closed'}`}>
                                                                        {alreadyMarked ? 'Marked Present' : session.is_open ? 'Open' : 'Closed'}
                                                                    </span>
                                                                    {session.is_open && !alreadyMarked && (
                                                                        <span className="scm-att-indicator">
                                                                            <span className="scm-att-pulse" />
                                                                            Mark your attendance now
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="scm-att-actions">
                                                                {alreadyMarked ? (
                                                                    <div className="scm-att-marked-badge">
                                                                        <i className="bi bi-patch-check-fill" /> Present
                                                                    </div>
                                                                ) : session.is_open ? (
                                                                    <button
                                                                        className="scm-att-mark-btn"
                                                                        onClick={() => handleMarkAttendance(session)}
                                                                        disabled={isMarking}
                                                                        id={`mark-attendance-${session.id}`}
                                                                    >
                                                                        {isMarking ? (
                                                                            <><span className="scm-spinner-sm" /> Marking...</>
                                                                        ) : (
                                                                            <><i className="bi bi-hand-thumbs-up-fill" /> Mark Attendance</>
                                                                        )}
                                                                    </button>
                                                                ) : (
                                                                    <div className="scm-att-closed-badge">
                                                                        <i className="bi bi-door-closed-fill" /> Closed
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}

                                    {/* materials list */}
                                    {weekMaterials.length === 0 && weekSessions.length === 0 ? (
                                        <div className="scm-week-empty">No contents for this week.</div>
                                    ) : weekMaterials.length > 0 ? (
                                        <div className="scm-materials-section">
                                            {weekSessions.length > 0 && <div className="scm-att-section-label" style={{marginTop: '1rem'}}><i className="bi bi-folder2-open" /> Materials</div>}
                                            <ul className="scm-materials-list">
                                                {weekMaterials.map(mat => (
                                                    <li key={mat.id} className="scm-material-item">
                                                        <div className="scm-material-info">
                                                            <i className={`bi ${getFileIcon(mat.file_url, mat.file_type)} scm-material-icon`} />
                                                            <a
                                                                href={mat.file_type === 'link' ? mat.file_url : `${SERVER_BASE}${mat.file_url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="scm-material-link"
                                                            >
                                                                {mat.material_name || mat.file_name}
                                                            </a>
                                                        </div>
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
        </div>
    );
}

export default StudentCourseMaterials;
