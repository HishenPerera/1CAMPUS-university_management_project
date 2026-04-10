import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./MaintenancePage.css";

const MaintenancePage = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBackups = async () => {
        try {
            const res = await axios.get("/webadmin/backups");
            setBackups(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Failed to fetch backups", error);
        }
    };

    const handleBackup = async () => {
        setLoading(true);
        try {
            await axios.post("/webadmin/backup");
            alert("Backup completed successfully!");
            fetchBackups();
        } catch (error) {
            console.error("Backup failed", error);
            alert("Backup failed. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (filename) => {
        try {
            const res = await axios.get(`/webadmin/backup/download/${filename}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download backup", error);
            alert("Failed to download backup.");
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;
        try {
            await axios.delete(`/webadmin/backup/${filename}`);
            fetchBackups();
        } catch (error) {
            console.error("Failed to delete backup", error);
            alert("Failed to delete backup.");
        }
    };

    useEffect(() => {
        fetchBackups();
    }, []);

    return (
        <div className="al-page">
            <div className="al-header">
                <div>
                    <h2 className="al-title">Database Maintenance & Backups</h2>
                    <p className="al-subtitle">Create manual snapshots and view backup history.</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="al-refresh-btn" onClick={fetchBackups}>
                        <i className="bi bi-arrow-clockwise" /> Refresh
                    </button>
                    <button className="al-refresh-btn" style={{ background: "var(--brand-primary)", color: "#fff", border: "none" }} onClick={handleBackup} disabled={loading}>
                        {loading ? <><div className="al-spinner" style={{ width: 14, height: 14, margin: 0 }} /> Creating...</> : <><i className="bi bi-database-add" /> Create Backup</>}
                    </button>
                </div>
            </div>

            <div className="al-table-wrap mt-4">
                <table className="al-table">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Size</th>
                            <th>Creation Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backups.length > 0 ? (
                            backups.map((b, i) => (
                                <tr key={i}>
                                    <td style={{ fontFamily: "monospace", color: "var(--color-primary)" }}>{b.name}</td>
                                    <td>{b.size}</td>
                                    <td className="al-time">{new Date(b.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                                    <td>
                                        <button className="al-action-btn-outline" onClick={() => handleDownload(b.name)} title="Download Backup">
                                            <i className="bi bi-download" /> Download
                                        </button>
                                        <button className="al-action-btn-danger" onClick={() => handleDelete(b.name)} title="Delete Backup">
                                            <i className="bi bi-trash" /> Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>No backups found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="maintenance-info">
                <h4><i className="bi bi-info-circle-fill" /> How to Restore</h4>
                <p>Use the following command in your server's terminal to restore a database from one of these files:</p>
                <code>psql -U postgres -d your_db_name -f server/backups/filename.sql</code>
            </div>
        </div>
    );
};

export default MaintenancePage;