import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import UserAvatar from "../../components/UserAvatar";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "../../components/DashboardLayout.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    { id: "users", label: "User Management", icon: "bi-people-fill" },
    { id: "system", label: "System Settings", icon: "bi-gear-fill" },
    { id: "logs", label: "Audit Logs", icon: "bi-journal-text" },
];

function WebAdminDashboard() {
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
        window.location.href = "/login";
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
                            <span className="topbar-name">{userName || "Web Admin"}</span>
                            <span className="topbar-role">Web Administrator</span>
                        </div>
                    </div>
                </header>

                <main className="dash-content">
                    {activeNav === "dashboard" && (
                        <div className="dash-home">
                            <h1 className="dash-greeting">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋</h1>
                            <p className="dash-desc">System-wide administration tools are available from the sidebar.</p>
                            <div className="dash-cards">
                                {NAV_ITEMS.filter(i => i.id !== "dashboard").map(item => (
                                    <div key={item.id} className="dash-card" onClick={() => setActiveNav(item.id)}>
                                        <i className={`bi ${item.icon} dash-card-icon`} />
                                        <div>
                                            <div className="dash-card-title">{item.label}</div>
                                            <div className="dash-card-sub">Coming soon</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeNav !== "dashboard" && (
                        <div className="coming-soon">
                            <i className={`bi ${NAV_ITEMS.find(i => i.id === activeNav)?.icon} coming-soon-icon`} />
                            <h3>{NAV_ITEMS.find(i => i.id === activeNav)?.label}</h3>
                            <p>This section is under development. Check back soon!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default WebAdminDashboard;
