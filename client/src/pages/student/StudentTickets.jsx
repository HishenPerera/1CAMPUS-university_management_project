import { useState, useEffect } from "react";
import "./StudentTickets.css";

const StudentTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        type: "Certificate Request",
        title: "",
        description: ""
    });
    const [message, setMessage] = useState({ text: "", type: "" });

    const fetchTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/tickets/my-tickets", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error("Error fetching tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/tickets/raise", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ text: "Ticket raised successfully!", type: "success" });
                setFormData({ type: "Certificate Request", title: "", description: "" });
                setShowForm(false);
                fetchTickets();
            } else {
                setMessage({ text: data.message || "Failed to raise ticket", type: "error" });
            }
        } catch (error) {
            setMessage({ text: "Connection error", type: "error" });
        }
    };

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case "pending": return "status-pending";
            case "in progress": return "status-progress";
            case "resolved": return "status-resolved";
            case "rejected": return "status-rejected";
            default: return "";
        }
    };

    return (
        <div className="tickets-container">
            <div className="tickets-header">
                <h2>Support Tickets</h2>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    {showForm ? "View My Tickets" : "Raise New Ticket"}
                </button>
            </div>

            {message.text && <div className={`alert-box ${message.type}`}>{message.text}</div>}

            {showForm ? (
                <div className="ticket-form-card">
                    <h3>Request Certificate, Letter or Report Issue</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Request Type</label>
                            <select name="type" value={formData.type} onChange={handleChange}>
                                <option>Certificate Request</option>
                                <option>Letter Request</option>
                                <option>Issue Report</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Brief summary of your request"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                placeholder="Provide more details here..."
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                            ></textarea>
                        </div>
                        <button type="submit" className="btn-submit">Submit Request</button>
                    </form>
                </div>
            ) : (
                <div className="tickets-list">
                    {loading ? (
                        <p>Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                        <div className="no-tickets">
                            <i className="bi bi-ticket-detailed"></i>
                            <p>You haven't raised any tickets yet.</p>
                        </div>
                    ) : (
                        <div className="ticket-grid">
                            {tickets.map((ticket) => (
                                <div key={ticket.id} className="ticket-card">
                                    <div className="ticket-card-header">
                                        <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                        <span className="ticket-date">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h4 className="ticket-type">{ticket.type}</h4>
                                    <h5 className="ticket-title">{ticket.title}</h5>
                                    <p className="ticket-desc">{ticket.description}</p>
                                    {ticket.admin_comment && (
                                        <div className="admin-reply">
                                            <strong>Admin Response:</strong>
                                            <p>{ticket.admin_comment}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentTickets;
