import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./CampusNotices.css";

const CampusNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const SERVER_BASE = "http://localhost:5001";

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const res = await axios.get(`/notices`);
                setNotices(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching notices:", error);
                setLoading(false);
            }
        };

        fetchNotices();
    }, []);

    const filteredNotices = notices.filter(notice => 
        notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notice.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="student-notices-loading">
            <div className="loader"></div>
            <p>Fetching latest notices...</p>
        </div>
    );

    return (
        <div className="student-notices-page">
            <header className="student-notices-header">
                <div className="header-info">
                    <h1>Campus Notices</h1>
                    <p>Stay updated with the latest announcements and resources.</p>
                </div>
                <div className="search-bar">
                    <i className="bi bi-search"></i>
                    <input 
                        type="text" 
                        placeholder="Search notices..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {filteredNotices.length === 0 ? (
                <div className="no-notices">
                    <i className="bi bi-megaphon-fill"></i>
                    <h3>No notices found</h3>
                    <p>There are no announcements matching your search criteria.</p>
                </div>
            ) : (
                <div className="notices-list">
                    {filteredNotices.map(notice => (
                        <div key={notice.id} className="notice-item">
                            <div className="notice-icon">
                                <i className="bi bi-megaphone"></i>
                            </div>
                            <div className="notice-details">
                                <div className="notice-meta">
                                    <span className="notice-badge">Announcement</span>
                                    <span className="notice-time">
                                        <i className="bi bi-calendar4-event"></i> {new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <h2 className="notice-heading">{notice.title}</h2>
                                <p className="notice-body">{notice.content}</p>
                                
                                {notice.file_path && (
                                    <div className="notice-attachment">
                                        <div className="attachment-info">
                                            <i className="bi bi-file-earmark-pdf"></i>
                                            <span>Attached Document</span>
                                        </div>
                                        <a 
                                            href={`${SERVER_BASE}${notice.file_path}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="download-link"
                                        >
                                            <i className="bi bi-download"></i> Download PDF
                                        </a>
                                    </div>
                                )}
                                
                                <div className="notice-author">
                                    <div className="author-avatar">
                                        {notice.lecturer_name.charAt(0)}
                                    </div>
                                    <div className="author-info">
                                        <span className="author-name">{notice.lecturer_name}</span>
                                        <span className="author-role">Lecturer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CampusNotices;
