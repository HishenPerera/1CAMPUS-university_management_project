import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import UserAvatar from "../../components/UserAvatar";
import StudentManagement from "./StudentManagement";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "./StdAdminDashboard.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "students", label: "Student Management", icon: "🎓" },
];

function StdAdminDashboard() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;
    const userName = localStorage.getItem("user_name") || "";
    const [profileImage, setProfileImage] = useState(localStorage.getItem("profile_image") || "");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleAvatarUpload = (newUrl) => {
        setProfileImage(newUrl);
        localStorage.setItem("profile_image", newUrl);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("profile_image");
        localStorage.removeItem("user_role");
        localStorage.removeItem("is_temp_password");
        window.location.href = "/login";
    };

    return (
        <div className={`stdadmin-layout ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

            {/* ── Sidebar ──────────────────────────────────────────────── */}
            <aside className="stdadmin-sidebar">
                <div className="sidebar-logo-wrap">
                    <img src={logo} alt="1CAMPUS" className="sidebar-logo" />
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar-nav-item ${activeNav === item.id ? "active" : ""}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="sidebar-logout" onClick={handleLogout}>
                        <span>⎋</span> Logout
                    </button>
                </div>
            </aside>

            {/* ── Main Area ────────────────────────────────────────────── */}
            <div className="stdadmin-main">

                {/* Top bar */}
                <header className="stdadmin-topbar">
                    <button
                        className="sidebar-toggle"
                        onClick={() => setSidebarOpen((o) => !o)}
                        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                        ☰
                    </button>
                    <div className="topbar-right">
                        <ThemeToggle />
                        <UserAvatar
                            name={userName}
                            imageUrl={profileImage || undefined}
                            onUpload={handleAvatarUpload}
                        />
                        <div className="topbar-user">
                            <span className="topbar-name">{userName || "Admin"}</span>
                            <span className="topbar-role">Admin Staff</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="stdadmin-content">
                    {activeNav === "dashboard" && (
                        <div className="stdadmin-home">
                            <h1 className="dash-greeting">
                                Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
                            </h1>
                            <p className="dash-desc">Use the sidebar to manage students and administration tasks.</p>

                            <div className="dash-cards">
                                <div className="dash-card" onClick={() => setActiveNav("students")}>
                                    <div className="dash-card-icon">🎓</div>
                                    <div>
                                        <div className="dash-card-title">Student Management</div>
                                        <div className="dash-card-sub">Add, view & remove students</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeNav === "students" && <StudentManagement />}
                </main>
            </div>
        </div>
    );
}

export default StdAdminDashboard;
