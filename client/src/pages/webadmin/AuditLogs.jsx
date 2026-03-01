import { useState, useEffect, useMemo } from "react";
import axios from "../../api/axiosInstance";
import "./AuditLogs.css";

const PAGE_SIZE = 15;

function AuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/webadmin/logs");
            setLogs(res.data);
        } catch {
            setError("Failed to load audit logs. Please try again later.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, []);

    // ── Filtering & Pagination ────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return logs;
        return logs.filter(log =>
            (log.action || "").toLowerCase().includes(q) ||
            (log.details || "").toLowerCase().includes(q) ||
            (log.email || "").toLowerCase().includes(q) ||
            (log.role || "").toLowerCase().includes(q)
        );
    }, [logs, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

    const pageNums = () => {
        const nums = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        for (let i = start; i <= end; i++) nums.push(i);
        return nums;
    };

    return (
        <div className="al-page">
            <div className="al-header">
                <div>
                    <h2 className="al-title">System Audit Logs</h2>
                    <p className="al-subtitle">Track all system events, logins, and administrative actions.</p>
                </div>
                <button className="al-refresh-btn" onClick={fetchLogs} disabled={loading}>
                    <i className="bi bi-arrow-clockwise" /> Refresh
                </button>
            </div>

            {error && <div className="al-error">{error}</div>}

            <div className="al-toolbar">
                <div className="al-search-wrap">
                    <span className="al-search-icon"><i className="bi bi-search" /></span>
                    <input
                        type="text"
                        className="al-search"
                        placeholder="Search action, details, user email or role…"
                        value={search}
                        onChange={handleSearch}
                    />
                    {search && <button className="al-search-clear" onClick={() => { setSearch(""); setPage(1); }}>✕</button>}
                </div>
                <div className="al-count">
                    {loading ? "" : `Showing ${filtered.length} log${filtered.length !== 1 ? "s" : ""}`}
                </div>
            </div>

            {loading ? (
                <div className="al-loading"><div className="al-spinner" /> Fetching latest logs…</div>
            ) : filtered.length === 0 ? (
                <div className="al-empty">
                    <div className="al-empty-icon"><i className="bi bi-journal-x" /></div>
                    <p>{search ? "No logs match your search." : "No system events recorded yet."}</p>
                </div>
            ) : (
                <>
                    <div className="al-table-wrap">
                        <table className="al-table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>User Role</th>
                                    <th>Action performed by</th>
                                    <th>Action Type</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((log) => (
                                    <tr key={log.id}>
                                        <td className="al-time">
                                            {new Date(log.created_at).toLocaleString("en-GB", {
                                                day: "2-digit", month: "short", year: "numeric",
                                                hour: "2-digit", minute: "2-digit", second: "2-digit"
                                            })}
                                        </td>
                                        <td>
                                            {log.role ? (
                                                <span className={`al-role-badge al-role--${log.role}`}>
                                                    {log.role.replace("_", " ")}
                                                </span>
                                            ) : (
                                                <span className="al-role-badge al-role--system">System</span>
                                            )}
                                        </td>
                                        <td className="al-user">
                                            <div className="al-user-email">{log.email || "System automated event"}</div>
                                        </td>
                                        <td>
                                            <span className={`al-action-badge al-action--${log.action.split("_")[0]}`}>
                                                <i className={`bi bi-${log.action.includes("DELETE") ? "trash" : log.action.includes("CREATE") ? "plus-circle" : log.action.includes("LOGIN") ? "box-arrow-in-right" : "pencil"}`} />
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="al-details">{log.details || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="al-pagination">
                            <button className="al-page-btn" onClick={() => setPage(1)} disabled={currentPage === 1}>«</button>
                            <button className="al-page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>‹</button>
                            {pageNums().map(n => (
                                <button
                                    key={n}
                                    className={`al-page-btn ${n === currentPage ? "al-page-btn--active" : ""}`}
                                    onClick={() => setPage(n)}
                                >
                                    {n}
                                </button>
                            ))}
                            <button className="al-page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>›</button>
                            <button className="al-page-btn" onClick={() => setPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                            <span className="al-page-info">Page {currentPage} of {totalPages}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default AuditLogs;
