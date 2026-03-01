import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./LecturerCourses.css";

function LecturerCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/lecturer/modules");
            setCourses(res.data);
        } catch {
            setError("Failed to load your assigned courses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    return (
        <div className="lc-page">
            <div className="lc-header">
                <div>
                    <h2 className="lc-title">My Courses</h2>
                    <p className="lc-subtitle">Modules assigned to you for the current academic year.</p>
                </div>
                <button className="lc-refresh-btn" onClick={fetchCourses} disabled={loading}>
                    <i className="bi bi-arrow-clockwise" /> Refresh
                </button>
            </div>

            {error && <div className="lc-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {loading ? (
                <div className="lc-loading"><div className="lc-spinner" /> Loading your courses...</div>
            ) : courses.length === 0 ? (
                <div className="lc-empty">
                    <i className="bi bi-journal-code lc-empty-icon" />
                    <p>You have not been assigned any modules yet.</p>
                    <span className="lc-empty-sub">Contact the administration office if you believe this is an error.</span>
                </div>
            ) : (
                <div className="lc-grid">
                    {courses.map((c) => (
                        <div key={c.id} className="lc-card">
                            <div className="lc-card-header">
                                <span className="lc-card-code">{c.module_code}</span>
                                <h3 className="lc-card-title">{c.module_name}</h3>
                            </div>
                            <div className="lc-card-body">
                                <div className="lc-info-row">
                                    <i className="bi bi-mortarboard" />
                                    <span>{c.degree_program}</span>
                                </div>
                                <div className="lc-info-row">
                                    <i className="bi bi-calendar3" />
                                    <span>Year {c.studying_year} • Semester {c.semester}</span>
                                </div>
                            </div>
                            <div className="lc-card-footer">
                                <button className="lc-btn-action"><i className="bi bi-folder2-open" /> View Materials</button>
                                <button className="lc-btn-action"><i className="bi bi-people" /> Students</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default LecturerCourses;
