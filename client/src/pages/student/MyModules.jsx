import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./MyModules.css";

function MyModules({ onNavigate }) {
    const [data, setData] = useState(null);   // { degree_program, studying_year, semester, intake, modules[] }
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axiosInstance
            .get("/student/modules")
            .then((res) => setData(res.data))
            .catch((err) => {
                console.error(err);
                setError(err.response?.data?.message || "Failed to load modules.");
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="modules-loading">
                <i className="bi bi-arrow-repeat modules-spinner" />
                <span>Loading your modules…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="modules-error">
                <i className="bi bi-exclamation-circle" />
                <p>{error}</p>
            </div>
        );
    }

    const { degree_program, studying_year, semester, intake, modules } = data;
    const ordinalYear = ["", "1st", "2nd", "3rd", "4th"][studying_year] || `${studying_year}th`;
    const intakeLabel = intake === 'Jan-Jun' ? 'January Intake (Jan–Jun)' : intake === 'Jul-Dec' ? 'July Intake (Jul–Dec)' : null;

    return (
        <div className="modules-page">
            {/* ── Enrollment info banner ── */}
            <div className="modules-banner">
                <div className="modules-banner-icon">
                    <i className="bi bi-mortarboard-fill" />
                </div>
                <div className="modules-banner-info">
                    <h2 className="modules-banner-title">{degree_program}</h2>
                    <div className="modules-banner-meta">
                        <span className="modules-pill">
                            <i className="bi bi-calendar3" /> Year {studying_year} — {ordinalYear} Year
                        </span>
                        <span className="modules-pill">
                            <i className="bi bi-bookmark-fill" /> Semester {semester}
                        </span>
                        {intakeLabel && (
                            <span className="modules-pill modules-pill--intake">
                                <i className="bi bi-calendar2-range-fill" /> {intakeLabel}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Section heading ── */}
            <div className="modules-section-header">
                <h3 className="modules-section-title">
                    <i className="bi bi-journal-bookmark-fill" />
                    Enrolled Modules
                </h3>
                <span className="modules-count">{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
            </div>

            {/* ── Module cards ── */}
            {modules.length === 0 ? (
                <div className="modules-empty">
                    <i className="bi bi-inbox modules-empty-icon" />
                    <p>No modules have been assigned for your current year and semester yet.</p>
                    <span>Please check back later or contact your academic office.</span>
                </div>
            ) : (
                <div className="modules-grid">
                    {modules.map((mod) => (
                        <div key={mod.id} className="module-card">
                            <div className="module-card-top">
                                <span className="module-code">{mod.module_code}</span>
                            </div>
                            <div className="module-card-body">
                                <h4 className="module-name">{mod.module_name}</h4>
                                <div className="module-lecturers">
                                    <i className="bi bi-person-fill module-lect-icon" />
                                    {mod.assigned_lecturers && mod.assigned_lecturers.length > 0 ? (
                                        <span>{mod.assigned_lecturers.map((l) => l.name).join(", ")}</span>
                                    ) : (
                                        <span className="module-lect-tba">Lecturer TBA</span>
                                    )}
                                </div>
                                <div style={{ marginTop: '1.25rem' }}>
                                    <button 
                                        className="btn btn-primary w-100" 
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '0.6rem', borderRadius: '8px', fontWeight: '500', transition: 'all 0.2s', cursor: 'pointer' }}
                                        onClick={() => onNavigate && onNavigate("course-materials", mod)}
                                    >
                                        <i className="bi bi-folder2-open" /> View Materials
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyModules;
