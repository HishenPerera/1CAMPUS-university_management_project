import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import UserAvatar from "../../components/UserAvatar";
import StudentPortalAccess from "./StudentPortalAccess";
import ApplicationManagement from "./ApplicationManagement";
import LecturerManagement from "./LecturerManagement";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "../../components/DashboardLayout.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    { id: "applications", label: "Student Applications", icon: "bi-envelope-paper-fill" },
    { id: "students", label: "Student Portal Access", icon: "bi-people-fill" },
    { id: "lecturers", label: "Lecturer & Module Mgmt", icon: "bi-person-video3" },
];

function StdAdminDashboard() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;
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
                <div className="sidebar-logo-wrap">
                    <img src={logo} alt="1CAMPUS" className="sidebar-logo" />
                </div>
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
                <header className="dash-topbar">
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)}>
                        <i className="bi bi-list" />
                    </button>
                    <div className="topbar-right">
                        <ThemeToggle />
                        <UserAvatar name={userName} imageUrl={profileImage || undefined} onUpload={handleAvatarUpload} />
                        <div className="topbar-user">
                            <span className="topbar-name">{userName || "Admin"}</span>
                            <span className="topbar-role">Admin Staff</span>
                        </div>
                    </div>
                </header>

                <main className="dash-content">
                    {activeNav === "dashboard" && (
                        <div className="dash-home">
                            <h1 className="dash-greeting">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋</h1>
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
                                    <i className="bi bi-person-video3 dash-card-icon" />
                                    <div>
                                        <div className="dash-card-title">Lecturer & Module Mgmt</div>
                                        <div className="dash-card-sub">Assign subjects & lecturers</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeNav === "applications" && <ApplicationManagement />}
                    {activeNav === "students" && <StudentPortalAccess />}
                    {activeNav === "lecturers" && <LecturerManagement />}
                </main>
            </div>
        </div>
    );
}

export default StdAdminDashboard;
