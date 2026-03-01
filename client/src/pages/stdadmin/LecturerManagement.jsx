import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./LecturerManagement.css";

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

function LecturerManagement() {
    const [modules, setModules] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [newModule, setNewModule] = useState({
        module_code: "", module_name: "", degree_program: DEGREES[0], semester: 1, studying_year: 1
    });

    const [assigningModule, setAssigningModule] = useState(null); // module_id
    const [selectedLecturer, setSelectedLecturer] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modRes, lectRes] = await Promise.all([
                axios.get("/admin/modules"),
                axios.get("/admin/lecturers")
            ]);
            setModules(modRes.data);
            setLecturers(lectRes.data);
        } catch {
            setError("Failed to load module or lecturer data.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddModule = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await axios.post("/admin/modules", newModule);
            setShowAddModal(false);
            setNewModule({ module_code: "", module_name: "", degree_program: DEGREES[0], semester: 1, studying_year: 1 });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create module.");
        }
    };

    const handleDeleteModule = async (id, code) => {
        if (!window.confirm(`Are you sure you want to delete module ${code}?`)) return;
        try {
            await axios.delete(`/admin/modules/${id}`);
            fetchData();
        } catch {
            setError("Failed to delete module.");
        }
    };

    const handleAssignSubmit = async (moduleId) => {
        if (!selectedLecturer) return;
        try {
            await axios.post(`/admin/modules/${moduleId}/assign`, { lecturer_id: selectedLecturer });
            setAssigningModule(null);
            setSelectedLecturer("");
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to assign lecturer.");
        }
    };

    const handleRemoveAssignment = async (moduleId, lecturerId, name) => {
        if (!window.confirm(`Remove ${name} from this module?`)) return;
        try {
            await axios.delete(`/admin/modules/${moduleId}/assign/${lecturerId}`);
            fetchData();
        } catch {
            setError("Failed to remove assignment.");
        }
    };

    return (
        <div className="lm-page">
            <div className="lm-header">
                <div>
                    <h2 className="lm-title">Lecturer & Module Management</h2>
                    <p className="lm-subtitle">Create modules and assign them to your academic staff.</p>
                </div>
                <div className="lm-header-actions">
                    <button className="lm-refresh-btn" onClick={fetchData} disabled={loading}>
                        <i className="bi bi-arrow-clockwise" /> Refresh
                    </button>
                    <button className="lm-add-btn" onClick={() => setShowAddModal(true)}>
                        <i className="bi bi-journal-plus" /> Create Module
                    </button>
                </div>
            </div>

            {error && <div className="lm-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {loading ? (
                <div className="lm-loading"><div className="lm-spinner" /> Loading modules…</div>
            ) : modules.length === 0 ? (
                <div className="lm-empty">
                    <i className="bi bi-journal-x lm-empty-icon" />
                    <p>No modules have been created yet.</p>
                    <button className="lm-add-btn" onClick={() => setShowAddModal(true)}>Create First Module</button>
                </div>
            ) : (
                <div className="lm-grid">
                    {modules.map((m) => (
                        <div key={m.id} className="lm-card">
                            <div className="lm-card-header">
                                <div>
                                    <span className="lm-card-code">{m.module_code}</span>
                                    <h3 className="lm-card-title">{m.module_name}</h3>
                                </div>
                                <button
                                    className="lm-delete-btn"
                                    onClick={() => handleDeleteModule(m.id, m.module_code)}
                                    title={`Delete ${m.module_code}`}
                                >
                                    <i className="bi bi-trash3" />
                                </button>
                            </div>

                            <div className="lm-card-meta">
                                <span><i className="bi bi-mortarboard" /> Year {m.studying_year} • Sem {m.semester}</span>
                                <span className="lm-meta-degree">{m.degree_program}</span>
                            </div>

                            <div className="lm-assignments">
                                <div className="lm-assign-header">Assigned Lecturers</div>

                                {m.assigned_lecturers && m.assigned_lecturers.length > 0 ? (
                                    <ul className="lm-assign-list">
                                        {m.assigned_lecturers.map(lect => (
                                            <li key={lect.id} className="lm-assign-item">
                                                <span><i className="bi bi-person-video3" /> {lect.name}</span>
                                                <button className="lm-remove-assign" onClick={() => handleRemoveAssignment(m.id, lect.id, lect.name)}>
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="lm-no-assign">No lecturers assigned yet.</div>
                                )}

                                {assigningModule === m.id ? (
                                    <div className="lm-assign-form form-group">
                                        <select
                                            value={selectedLecturer}
                                            onChange={e => setSelectedLecturer(e.target.value)}
                                        >
                                            <option value="">-- Select Lecturer --</option>
                                            {lecturers
                                                .filter(l => !m.assigned_lecturers?.find(al => al.id === l.id))
                                                .map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
                                        </select>
                                        <div className="lm-assign-actions">
                                            <button className="lm-btn-save" onClick={() => handleAssignSubmit(m.id)}>Assign</button>
                                            <button className="lm-btn-cancel" onClick={() => { setAssigningModule(null); setSelectedLecturer(""); }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="lm-start-assign-btn" onClick={() => setAssigningModule(m.id)}>
                                        <i className="bi bi-plus-circle-fill" /> Assign Lecturer
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add Module Modal ──────────────────────────────────────────────── */}
            {showAddModal && (
                <div className="lm-modal-backdrop" onClick={() => setShowAddModal(false)}>
                    <div className="lm-modal" onClick={e => e.stopPropagation()}>
                        <div className="lm-modal-header">
                            <h3><i className="bi bi-journal-plus" /> Create New Module</h3>
                            <button className="lm-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddModule}>
                            <div className="lm-modal-body form-group">
                                <label>Module Code (e.g., CS101)</label>
                                <input required value={newModule.module_code} onChange={e => setNewModule({ ...newModule, module_code: e.target.value.toUpperCase() })} />

                                <label>Module Name (e.g., Introduction to Programming)</label>
                                <input required value={newModule.module_name} onChange={e => setNewModule({ ...newModule, module_name: e.target.value })} />

                                <label>Degree Program</label>
                                <select required value={newModule.degree_program} onChange={e => setNewModule({ ...newModule, degree_program: e.target.value })}>
                                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>

                                <div className="lm-row">
                                    <div>
                                        <label>Studying Year</label>
                                        <input type="number" min="1" max="5" required value={newModule.studying_year} onChange={e => setNewModule({ ...newModule, studying_year: e.target.value })} />
                                    </div>
                                    <div>
                                        <label>Semester</label>
                                        <input type="number" min="1" max="8" required value={newModule.semester} onChange={e => setNewModule({ ...newModule, semester: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="lm-modal-actions">
                                <button type="button" className="lm-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="lm-btn-primary">Create Module</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LecturerManagement;
