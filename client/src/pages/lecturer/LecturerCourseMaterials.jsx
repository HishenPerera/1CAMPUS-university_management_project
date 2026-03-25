import { useState, useEffect } from "react";
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

function LecturerCourseMaterials({ course, onBack }) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    // Determine which months are relevant for this course's intake
    const intake = course?.intake || null;
    const janMonths = [0, 1, 2, 3, 4, 5];    // Jan–Jun
    const julMonths = [6, 7, 8, 9, 10, 11];   // Jul–Dec
    const allowedMonths = intake === 'Jan-Jun' ? janMonths : intake === 'Jul-Dec' ? julMonths : null;
    const defaultMonth = intake === 'Jan-Jun' ? 0 : intake === 'Jul-Dec' ? 6 : currentMonth;

    const [year, setYear] = useState(currentYear);
    const [activeMonth, setActiveMonth] = useState(defaultMonth);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Upload Modal State
    const [showUpload, setShowUpload] = useState(false);
    const [uploadWeek, setUploadWeek] = useState("");
    const [uploadType, setUploadType] = useState("file");
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadLink, setUploadLink] = useState("");
    const [uploadName, setUploadName] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    const fetchMaterials = async () => {
        if (!course) return;
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`/lecturer/modules/${course.id}/materials?year=${year}`);
            setMaterials(res.data);
        } catch (err) {
            setError("Failed to fetch module materials.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [course, year]);

    const weeks = getWeeksInMonth(year, activeMonth);

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
        if (!uploadName.trim()) {
            return setUploadError("Material name is required.");
        }
        if (uploadType === "file" && !uploadFile) {
            return setUploadError("Please select a file to upload.");
        }
        if (uploadType === "link" && !uploadLink.trim()) {
            return setUploadError("Please provide a valid URL.");
        }

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
                data.append("file_type", "file"); // Or dynamic based on ext
                data.append("file_url", ""); // Backend figures this out
                data.append("file_name", uploadName);
                data.append("material", uploadFile);
                headers["Content-Type"] = "multipart/form-data";
            } else {
                data = {
                    year,
                    month: activeMonth,
                    week_label: uploadWeek,
                    file_type: "link",
                    file_name: uploadName,
                    file_url: uploadLink
                };
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

    const handleDelete = async (matId) => {
        if (!window.confirm("Are you sure you want to delete this material?")) return;
        try {
            await axios.delete(`/lecturer/modules/materials/${matId}`);
            setMaterials(prev => prev.filter(m => m.id !== matId));
        } catch (err) {
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
            <div className="lcm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="lcm-back-btn" onClick={onBack}>
                        <i className="bi bi-arrow-left" /> Back
                    </button>
                    <div>
                        <h2 className="lcm-title">{course.module_name}</h2>
                        <p className="lcm-subtitle">{course.module_code} • Materials Management</p>
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
                        >
                            {m}
                        </button>
                    );
                })}
            </div>

            {error && <div className="lcm-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

            {loading ? (
                <div className="lcm-loading"><div className="lcm-spinner" /> Loading materials...</div>
            ) : (
                <div className="lcm-weeks-container">
                    {weeks.map(weekLabel => {
                        const weekMaterials = materials.filter(m => m.month === activeMonth && m.week_label === weekLabel);
                        
                        return (
                            <div key={weekLabel} className="lcm-week-card">
                                <div className="lcm-week-header">
                                    <h4 className="lcm-week-title"><i className="bi bi-calendar2-week" /> {weekLabel}</h4>
                                    <button className="lcm-btn-upload" onClick={() => openUploadModal(weekLabel)}>
                                        <i className="bi bi-cloud-arrow-up-fill" /> Upload Content
                                    </button>
                                </div>
                                <div className="lcm-week-body">
                                    {weekMaterials.length === 0 ? (
                                        <div className="lcm-week-empty">No materials uploaded for this week.</div>
                                    ) : (
                                        <ul className="lcm-materials-list">
                                            {weekMaterials.map(mat => (
                                                <li key={mat.id} className="lcm-material-item">
                                                    <div className="lcm-material-info">
                                                        <i className={`bi ${getFileIcon(mat.file_url, mat.file_type)} lcm-material-icon`} />
                                                        <a 
                                                            href={mat.file_type === 'link' ? mat.file_url : `${SERVER_BASE}${mat.file_url}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="lcm-material-link"
                                                        >
                                                            {mat.material_name || mat.file_name}
                                                        </a>
                                                    </div>
                                                    <button className="lcm-material-del" onClick={() => handleDelete(mat.id)} title="Delete material">
                                                        <i className="bi bi-trash3-fill" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Upload Modal */}
            {showUpload && createPortal(
                <div className="lcm-modal-backdrop" onClick={() => setShowUpload(false)}>
                    <div className="lcm-modal" onClick={e => e.stopPropagation()}>
                        <div className="lcm-modal-header">
                            <h3><i className="bi bi-cloud-plus-fill" /> Upload Materials</h3>
                            <button className="lcm-modal-close" onClick={() => setShowUpload(false)}><i className="bi bi-x" /></button>
                        </div>
                        <div className="lcm-modal-weekhint">Uploading for: <strong>{uploadWeek}</strong></div>
                        <form className="lcm-modal-form" onSubmit={handleUploadSubmit}>
                            <div className="form-group">
                                <label>Material Name</label>
                                <input 
                                    type="text" 
                                    value={uploadName} 
                                    onChange={e => setUploadName(e.target.value)} 
                                    placeholder="e.g. Week 4 Lecture Slides" 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Content Type</label>
                                <div className="lcm-type-toggles">
                                    <button 
                                        type="button" 
                                        className={`lcm-type-btn ${uploadType === 'file' ? 'active' : ''}`}
                                        onClick={() => setUploadType("file")}
                                    >
                                        <i className="bi bi-file-earmark-arrow-up" /> Upload File
                                    </button>
                                    <button 
                                        type="button" 
                                        className={`lcm-type-btn ${uploadType === 'link' ? 'active' : ''}`}
                                        onClick={() => setUploadType("link")}
                                    >
                                        <i className="bi bi-link-45deg" /> External Link
                                    </button>
                                </div>
                            </div>

                            {uploadType === "file" ? (
                                <div className="form-group">
                                    <label>Select File (PDF, PPTX, Doc, ZIP)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip"
                                        onChange={e => setUploadFile(e.target.files[0])} 
                                    />
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>URL / Web Link</label>
                                    <input 
                                        type="url" 
                                        value={uploadLink} 
                                        onChange={e => setUploadLink(e.target.value)} 
                                        placeholder="https://example.com/resource" 
                                    />
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
        </div>
    );
}

export default LecturerCourseMaterials;
