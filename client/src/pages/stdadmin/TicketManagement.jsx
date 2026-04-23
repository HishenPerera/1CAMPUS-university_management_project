import { useState, useEffect } from "react";
import "./TicketManagement.css";

const TicketManagement = () => {
    // State to store the list of all tickets fetched from the API
    const [tickets, setTickets] = useState([]);
    // State to manage loading indicator while fetching tickets
    const [loading, setLoading] = useState(true);
    // State to track the currently selected ticket for the update modal
    const [selectedTicket, setSelectedTicket] = useState(null);
    // State to hold the new status value for ticket updates
    const [updateStatus, setUpdateStatus] = useState("");
    // State to hold the admin comment for ticket updates
    const [adminComment, setAdminComment] = useState("");
    // State to manage the current filter selection for ticket status
    const [filter, setFilter] = useState("All");

    // Function to fetch all tickets from the admin API endpoint and update local state
    const fetchAllTickets = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5001/api/tickets/all", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setTickets(data);
        } catch (error) {
            console.error("Error fetching admin tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch initial ticket data when the component mounts
    useEffect(() => {
        fetchAllTickets();
    }, []);

    // Function to handle ticket status updates via API call and refresh the ticket list
    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5001/api/tickets/${selectedTicket.id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: updateStatus,
                    adminComment: adminComment
                })
            });
            if (res.ok) {
                setSelectedTicket(null);
                setAdminComment("");
                fetchAllTickets();
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
        }
    };

    // Logic to filter tickets based on the selected status filter; shows all if "All" is selected
    const filteredTickets = filter === "All" 
        ? tickets 
        : tickets.filter(t => t.status === filter);

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
        <div className="ticket-mgmt-container">
            <div className="ticket-mgmt-header">
                <h2>Student Support Ticket Management</h2>
                <div className="filter-group">
                    <label>Filter Status:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                        <option>All</option>
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Rejected</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <p>Loading tickets...</p>
            ) : (
                <div className="ticket-table-wrap">
                    <table className="ticket-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Student</th>
                                <th>Type</th>
                                <th>Title</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map(ticket => (
                                <tr key={ticket.id}>
                                    <td>{new Date(ticket.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="std-info">
                                            <strong>{ticket.student_name}</strong>
                                            <span>{ticket.student_email}</span>
                                        </div>
                                    </td>
                                    <td>{ticket.type}</td>
                                    <td>{ticket.title}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn-manage" onClick={() => {
                                            setSelectedTicket(ticket);
                                            setUpdateStatus(ticket.status);
                                            setAdminComment(ticket.admin_comment || "");
                                        }}>
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedTicket && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Manage Ticket #{selectedTicket.id}</h3>
                        <div className="ticket-detail-view">
                            <p><strong>Student:</strong> {selectedTicket.student_name} ({selectedTicket.student_email})</p>
                            <p><strong>Type:</strong> {selectedTicket.type}</p>
                            <p><strong>Title:</strong> {selectedTicket.title}</p>
                            <p><strong>Description:</strong> {selectedTicket.description}</p>
                        </div>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Update Status</label>
                                <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                                    <option>Pending</option>
                                    <option>In Progress</option>
                                    <option>Resolved</option>
                                    <option>Rejected</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Admin Comment / Response</label>
                                <textarea
                                    value={adminComment}
                                    onChange={(e) => setAdminComment(e.target.value)}
                                    rows="4"
                                    placeholder="Write your response to the student here..."
                                ></textarea>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setSelectedTicket(null)}>Cancel</button>
                                <button type="submit" className="btn-save">Update Ticket</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketManagement;
