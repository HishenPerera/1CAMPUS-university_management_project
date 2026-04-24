import { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import StudentPortalAccess from "./StudentPortalAccess";
import ApplicationManagement from "./ApplicationManagement";
import LecturerManagement from "./LecturerManagement";
import TicketManagement from "./TicketManagement";
import AILetterGenerator from "./AILetterGenerator";
import "../../components/DashboardLayout.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    { id: "applications", label: "Student Applications", icon: "bi-envelope-paper-fill" },
    { id: "students", label: "Student Portal Access", icon: "bi-people-fill" },
    { id: "lecturers", label: "Lecturer & Module Mgmt", icon: "bi-person-video3" },
    { id: "tickets", label: "Ticket Management", icon: "bi-ticket-perforated-fill" },
    { id: "ai_letters", label: "AI Letter Generator", icon: "bi-magic" },
];

function StdAdminDashboard() {
    const userName = localStorage.getItem("user_name") || "";
    const [profileImage, setProfileImage] = useState(localStorage.getItem("profile_image") || "");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleAvatarUpload = (url) => {
        setProfileImage(url);
        localStorage.setItem("profile_image", url);
    };

    const handleLogout = () => {
        ["token", "user_name", "profile_image", "user_role", "is_temp_password"].forEach(k => localStorage.removeItem(k));
        window.location.href = "/";
    };

    return (
        <div className={`dash-layout ${sidebarOpen ? "" : "sidebar-closed"}`}>
            <aside className="dash-sidebar">
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <i className={`bi ${item.icon} nav-icon`} />
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-left" /> Logout
                    </button>
                </div>
            </aside>

            <div className="dash-main">
                <DashboardHeader 
                    sidebarCollapsed={!sidebarOpen}
                    setSidebarCollapsed={(collapsed) => setSidebarOpen(!collapsed)}
                    userName={userName}
                    userRole="Admin Staff"
                    profileImage={profileImage}
                    onAvatarUpload={handleAvatarUpload}
                />

                <main className="dash-content">
                    {activeNav === "dashboard" && (
                        <div className="dash-home">
                            <h1 className="dash-greeting">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} <i className="bi bi-hand-wave-fill" /></h1>
                            <p className="dash-desc">Use the sidebar to manage students and administration tasks.</p>
                            <div className="dash-cards">
                                <div className="dash-card" onClick={() => setActiveNav("applications")}>
                                    <i className="bi bi-envelope-paper-fill dash-card-icon" />
                                    <div>
                                        <div className="dash-card-title">Student Applications</div>
                                        <div className="dash-card-sub">Review & approve 1CAMPUS applicants</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("students")}>
                                    <i className="bi bi-people-fill dash-card-icon" />
                                    <div>
                                        <div className="dash-card-title">Student Portal Access</div>
                                        <div className="dash-card-sub">Add, view & manage student profiles</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("lecturers")}>
                                    <i className="bi bi-person-video3 dash-card-icon" style={{ color: "#8b5cf6" }} />
                                    <div>
                                        <div className="dash-card-title">Lecturer & Module Management</div>
                                        <div className="dash-card-sub">Assign subjects & lecturers</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("tickets")}>
                                    <i className="bi bi-ticket-perforated-fill dash-card-icon" style={{ color: "#ef4444" }} />
                                    <div>
                                        <div className="dash-card-title">Ticket Management</div>
                                        <div className="dash-card-sub">Handle student requests & issues</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("ai_letters")}>
                                    <i className="bi bi-magic dash-card-icon" style={{ color: "#ec4899" }} />
                                    <div>
                                        <div className="dash-card-title">AI Letter Generator</div>
                                        <div className="dash-card-sub">Draft official documents instantly</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeNav === "applications" && <ApplicationManagement />}
                    {activeNav === "students" && <StudentPortalAccess />}
                    {activeNav === "lecturers" && <LecturerManagement />}
                    {activeNav === "tickets" && <TicketManagement />}
                    {activeNav === "ai_letters" && <AILetterGenerator />}
                </main>
            </div>
        </div>
    );
}

export default StdAdminDashboard;
