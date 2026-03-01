import { useState, useEffect, useMemo } from "react";
import axios from "../../api/axiosInstance";
import "./ApplicationManagement.css";

const PAGE_SIZE = 10;

function ApplicationManagement() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");

    const [processingId, setProcessingId] = useState(null);
    const [newPassword, setNewPassword] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedRegNumber, setGeneratedRegNumber] = useState("");
    const [generatedEmail, setGeneratedEmail] = useState("");

    const [selectedApp, setSelectedApp] = useState(null);
    const [approveForm, setApproveForm] = useState({
        first_name: "", last_name: "", nic_number: "", phone_number: "",
        address: "", degree_program: "", studying_year: 1, semester: 1
    });

    const openApproveModal = (app) => {
        setApproveForm({
            first_name: app.first_name || "",
            last_name: app.last_name || "",
            nic_number: app.nic_number || "",
            phone_number: app.phone_number || "",
            address: app.address || "",
            degree_program: app.degree_program || "",
            studying_year: 1,
            semester: 1
        });
        setSelectedApp(app);
    };

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/admin/applications");
            setApplications(res.data);
        } catch {
            setError("Failed to load applications.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchApplications(); }, []);

    // ── Filtering & Pagination ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        let result = applications;

        if (statusFilter !== "all") {
            result = result.filter(a => a.status === statusFilter);
        }

        const q = search.toLowerCase();
        if (q) {
            result = result.filter(a =>
                (a.first_name || "").toLowerCase().includes(q) ||
                (a.last_name || "").toLowerCase().includes(q) ||
                (a.email || "").toLowerCase().includes(q) ||
                (a.nic_number || "").toLowerCase().includes(q) ||
                (a.degree_program || "").toLowerCase().includes(q)
            );
        }
        return result;
    }, [applications, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
    const handleFilter = (e) => { setStatusFilter(e.target.value); setPage(1); };

    // ── Action Handlers ───────────────────────────────────────────────────────
    const handleAccept = async (id) => {
        setProcessingId(id); setError("");
        try {
            await axios.post(`/admin/applications/${id}/accept`);
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to accept application.");
        } finally { setProcessingId(null); }
    };

    const handleApproveSubmit = async (e) => {
        e.preventDefault();
        setProcessingId(selectedApp.id); setError("");
        try {
            const res = await axios.post(`/admin/applications/${selectedApp.id}/approve`, approveForm);
            setNewPassword(res.data.temp_password);
            setGeneratedRegNumber(res.data.reg_number);
            setGeneratedEmail(res.data.portal_email);
            setSelectedApp(null);
            setShowPasswordModal(true);
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create portal account.");
        } finally { setProcessingId(null); }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject this application?")) return;
        setProcessingId(id); setError("");
        try {
            await axios.post(`/admin/applications/${id}/reject`);
            fetchApplications();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to reject application.");
        } finally { setProcessingId(null); }
    };

    const pageNums = () => {
        const nums = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    return (
        <div className="am-page">
            <div className="am-header">
                <div>
                    <h2 className="am-title">Applications</h2>
                    <p className="am-subtitle">Review prospective student applications and generate portal credentials.</p>
                </div>
                <button className="am-refresh-btn" onClick={fetchApplications} disabled={loading}>
                    <i className="bi bi-arrow-clockwise" /> Refresh
                </button>
            </div>

            {error && <div className="am-error">{error}</div>}

            <div className="am-toolbar">
                <div className="am-search-wrap">
                    <span className="am-search-icon"><i className="bi bi-search" /></span>
                    <input
                        type="text"
                        className="am-search"
                        placeholder="Search name, email, NIC, degree…"
                        value={search}
                        onChange={handleSearch}
                    />
                    {search && <button className="am-search-clear" onClick={() => { setSearch(""); setPage(1); }}>✕</button>}
                </div>

                <div className="am-filters">
                    <select className="am-filter-select" value={statusFilter} onChange={handleFilter}>
                        <option value="all">All Applications</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="enrolled">Enrolled in Portal</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <div className="am-count">
                        {loading ? "" : `${filtered.length} application${filtered.length !== 1 ? "s" : ""}`}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="am-loading"><div className="am-spinner" /> Loading applications…</div>
            ) : filtered.length === 0 ? (
                <div className="am-empty">
                    <div className="am-empty-icon"><i className="bi bi-inbox" /></div>
                    <p>{search || statusFilter !== 'all' ? "No applications match your filters." : "No applications received yet."}</p>
                </div>
            ) : (
                <>
                    <div className="am-table-wrap">
                        <table className="am-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Applicant Name</th>
                                    <th>Email & Contact</th>
                                    <th>Intended Degree</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((app) => (
                                    <tr key={app.id}>
                                        <td className="am-date">
                                            {new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="am-name">
                                            {app.first_name} {app.last_name}
                                            <div className="am-nic">NIC: {app.nic_number}</div>
                                        </td>
                                        <td className="am-contact">
                                            <div>{app.email}</div>
                                            <div className="am-phone">{app.phone_number}</div>
                                        </td>
                                        <td className="am-degree">{app.degree_program}</td>
                                        <td>
                                            <span className={`am-status am-status--${app.status}`}>
                                                {app.status}
                                            </span>
                                            {(app.status === 'accepted' || app.status === 'enrolled') && app.approver_name && (
                                                <div className="am-approver">by {app.approver_name.split(" ")[0]}</div>
                                            )}
                                        </td>
                                        <td>
                                            {app.status === 'pending' ? (
                                                <div className="am-actions-group">
                                                    <button
                                                        className="am-action-btn am-btn-accept"
                                                        onClick={() => handleAccept(app.id)}
                                                        disabled={processingId === app.id}
                                                        title="Accept Application"
                                                    >
                                                        <i className="bi bi-person-check-fill" />
                                                    </button>
                                                    <button
                                                        className="am-action-btn am-btn-reject"
                                                        onClick={() => handleReject(app.id)}
                                                        disabled={processingId === app.id}
                                                        title="Reject Application"
                                                    >
                                                        <i className="bi bi-x-lg" />
                                                    </button>
                                                </div>
                                            ) : app.status === 'accepted' ? (
                                                <div className="am-actions-group">
                                                    <button
                                                        className="am-action-btn am-btn-approve"
                                                        onClick={() => openApproveModal(app)}
                                                        disabled={processingId === app.id}
                                                        title="Add to Portal"
                                                    >
                                                        <i className="bi bi-person-plus-fill" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="am-no-action">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="am-pagination">
                            <button className="am-page-btn" onClick={() => setPage(1)} disabled={currentPage === 1}>«</button>
                            <button className="am-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                            {pageNums().map(n => (
                                <button
                                    key={n}
                                    className={`am-page-btn ${n === currentPage ? "am-page-btn--active" : ""}`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </button>
                            ))}
                            <button className="am-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                            <button className="am-page-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                            <span className="am-page-info">Page {currentPage} of {totalPages}</span>
                        </div>
                    )}
                </>
            )}

            {/* Password Generated Modal */}
            {showPasswordModal && (
                <div className="am-modal-backdrop" onClick={() => setShowPasswordModal(false)}>
                    <div className="am-modal" onClick={e => e.stopPropagation()}>
                        <div className="am-modal-header am-modal-header--success">
                            <h3><i className="bi bi-check-circle-fill" /> Application Approved</h3>
                            <button className="am-modal-close" onClick={() => setShowPasswordModal(false)}>✕</button>
                        </div>
                        <div className="am-modal-body">
                            <p>The student's portal account and official profile have been created successfully.</p>
                            <div className="am-pwd-box">
                                <span className="am-pwd-label">Registration No:</span>
                                <code className="am-pwd-code" style={{ color: "var(--brand-primary)" }}>{generatedRegNumber}</code>
                            </div>
                            <div className="am-pwd-box">
                                <span className="am-pwd-label">Portal Email:</span>
                                <code className="am-pwd-code" style={{ color: "var(--brand-primary)" }}>{generatedEmail}</code>
                            </div>
                            <div className="am-pwd-box">
                                <span className="am-pwd-label">Temporary Password:</span>
                                <code className="am-pwd-code">{newPassword}</code>
                            </div>
                            <p className="am-pwd-help">Please securely transmit these credentials to the student. They will be forced to change their password upon first login.</p>
                        </div>
                        <div className="am-modal-actions">
                            <button className="am-confirm-btn" onClick={() => setShowPasswordModal(false)}>Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Form Modal */}
            {selectedApp && (
                <div className="am-modal-backdrop" onClick={() => setSelectedApp(null)}>
                    <div className="am-modal am-modal-large" onClick={e => e.stopPropagation()}>
                        <div className="am-modal-header">
                            <h3><i className="bi bi-person-lines-fill" /> Confirm Student Details</h3>
                            <button className="am-modal-close" onClick={() => setSelectedApp(null)}>✕</button>
                        </div>
                        <form onSubmit={handleApproveSubmit}>
                            <div className="am-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <p className="am-pwd-help" style={{ marginBottom: '1rem' }}>
                                    Review the applicant's details below. An official Registration ID will be
                                    auto-generated securely based on the selected Degree Program.
                                </p>

                                <div className="am-row">
                                    <div>
                                        <label>First Name</label>
                                        <input required value={approveForm.first_name} onChange={e => setApproveForm({ ...approveForm, first_name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label>Last Name</label>
                                        <input required value={approveForm.last_name} onChange={e => setApproveForm({ ...approveForm, last_name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="am-row">
                                    <div>
                                        <label>NIC Number</label>
                                        <input required value={approveForm.nic_number} onChange={e => setApproveForm({ ...approveForm, nic_number: e.target.value })} />
                                    </div>
                                    <div>
                                        <label>Phone Number</label>
                                        <input required value={approveForm.phone_number} onChange={e => setApproveForm({ ...approveForm, phone_number: e.target.value })} />
                                    </div>
                                </div>

                                <label>Address</label>
                                <textarea value={approveForm.address} onChange={e => setApproveForm({ ...approveForm, address: e.target.value })} rows="2" />

                                <label>Degree Program (Prefixes ID)</label>
                                <select required value={approveForm.degree_program} onChange={e => setApproveForm({ ...approveForm, degree_program: e.target.value })}>
                                    <option value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science (CS)</option>
                                    <option value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology (IT)</option>
                                    <option value="Bachelor of Engineering">Bachelor of Engineering (ENG)</option>
                                    <option value="Bachelor of Business Administration">Bachelor of Business Administration (BBA)</option>
                                    <option value="Bachelor of Science in Data Science">Bachelor of Science in Data Science (DS)</option>
                                    <option value="Bachelor of Arts">Bachelor of Arts (BA)</option>
                                    <option value="Master of Science in Computer Science">Master of Science in Computer Science (MCS)</option>
                                    <option value="Master of Business Administration">Master of Business Administration (MBA)</option>
                                </select>

                                <div className="am-row">
                                    <div>
                                        <label>Studying Year</label>
                                        <input type="number" min="1" max="5" required value={approveForm.studying_year} onChange={e => setApproveForm({ ...approveForm, studying_year: e.target.value })} />
                                    </div>
                                    <div>
                                        <label>Semester</label>
                                        <input type="number" min="1" max="8" required value={approveForm.semester} onChange={e => setApproveForm({ ...approveForm, semester: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="am-modal-actions">
                                <button type="button" className="am-btn-cancel" onClick={() => setSelectedApp(null)}>Cancel</button>
                                <button type="submit" className="am-confirm-btn" disabled={processingId === selectedApp.id}>
                                    {processingId === selectedApp.id ? "Approving..." : "Approve & Generate ID"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApplicationManagement;
