import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import "./CampusNotices.css";

const CampusNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        file: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const SERVER_BASE = "http://localhost:5001";

    useEffect(() => {
        fetchNotices();
    }, []);

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

    const handleOpenModal = (notice = null) => {
        if (notice) {
            setEditingNotice(notice);
            setFormData({ title: notice.title, content: notice.content, file: null });
        } else {
            setEditingNotice(null);
            setFormData({ title: "", content: "", file: null });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNotice(null);
        setFormData({ title: "", content: "", file: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", formData.content);
        if (formData.file) data.append("file", formData.file);

        try {
            if (editingNotice) {
                await axios.put(`/notices/${editingNotice.id}`, data, {
                    headers: { 
                        "Content-Type": "multipart/form-data"
                    }
                });
                alert("Notice updated successfully!");
            } else {
                await axios.post(`/notices`, data, {
                    headers: { 
                        "Content-Type": "multipart/form-data"
                    }
                });
                alert("Notice published successfully!");
            }
            fetchNotices();
            handleCloseModal();
        } catch (error) {
            console.error("Error saving notice:", error);
            alert(`Failed to save notice: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this notice?")) return;
        try {
            await axios.delete(`/notices/${id}`);
            fetchNotices();
        } catch (error) {
            console.error("Error deleting notice:", error);
        }
    };

    if (loading) return <div className="notices-loading">Loading notices...</div>;

    return (
        <div className="campus-notices-container">
            <header className="notices-header">
                <div>
                    <h2 className="notices-title">Campus Notices</h2>
                    <p className="notices-subtitle">Manage campus-wide announcements and documents</p>
                </div>
                <button className="add-notice-btn" onClick={() => handleOpenModal()}>
                    <i className="bi bi-plus-lg"></i> New Notice
                </button>
            </header>

            <div className="notices-grid">
                {notices.map(notice => (
                    <div key={notice.id} className="notice-card">
                        <div className="notice-card-content">
                            <div className="notice-card-header">
                                <span className="notice-date">{new Date(notice.created_at).toLocaleDateString()}</span>
                                <div className="notice-actions">
                                    <button onClick={() => handleOpenModal(notice)} title="Edit">
                                        <i className="bi bi-pencil-square"></i>
                                    </button>
                                    <button onClick={() => handleDelete(notice.id)} title="Delete" className="delete-btn">
                                        <i className="bi bi-trash3"></i>
                                    </button>
                                </div>
                            </div>
                            <h3 className="notice-card-title">{notice.title}</h3>
                            <p className="notice-card-text">{notice.content}</p>
                            {notice.file_path && (
                                <div className="notice-file-link">
                                    <i className="bi bi-file-earmark-pdf-fill"></i>
                                    <a href={`${SERVER_BASE}${notice.file_path}`} target="_blank" rel="noreferrer">
                                        View Attachment
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="notice-card-footer">
                            <span className="notice-lecturer">
                                <i className="bi bi-person"></i> {notice.lecturer_name}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="notice-modal-overlay">
                    <div className="notice-modal">
                        <div className="modal-header">
                            <h3>{editingNotice ? "Edit Notice" : "Create New Notice"}</h3>
                            <button className="close-modal" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit} className="notice-form">
                            <div className="form-group">
                                <label>Title</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    required 
                                    placeholder="Enter notice title"
                                />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea 
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})} 
                                    required 
                                    placeholder="Write the notice content here..."
                                    rows="5"
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Attachment (PDF, optional)</label>
                                <div className="file-input-wrapper">
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={e => setFormData({...formData, file: e.target.files[0]})}
                                    />
                                    <i className="bi bi-cloud-upload"></i>
                                    <span>{formData.file ? formData.file.name : "Click to upload PDF"}</span>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : (editingNotice ? "Update Notice" : "Publish Notice")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CampusNotices;
