import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import UserAvatar from "../../components/UserAvatar";
import MyProfile from "./MyProfile";
import MyModules from "./MyModules";
import FloatingAdvisor from "./FloatingAdvisor";
import StudentCourseMaterials from "./StudentCourseMaterials";
import OnlineEbooks from "./OnlineEbooks";
import StudentTickets from "./StudentTickets";
import StudentQuizzes from "./StudentQuizzes";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "../../components/DashboardLayout.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    { id: "modules", label: "My Modules", icon: "bi-journal-bookmark-fill" },
    { id: "quizzes", label: "AI Quizzes", icon: "bi-cpu-fill" },
    { id: "ebooks", label: "E-Books", icon: "bi-book-half" },
    { id: "tickets", label: "Support Tickets", icon: "bi-ticket-detailed-fill" },
    { id: "profile", label: "My Profile", icon: "bi-person-circle" },
];

function StudentDashboard() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;
    const userName = localStorage.getItem("user_name") || "";
    const [profileImage, setProfileImage] = useState(localStorage.getItem("profile_image") || "");
    const [activeNav, setActiveNav] = useState("dashboard");
    const [activeCourse, setActiveCourse] = useState(null);
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
                            <span className="topbar-name">{userName || "Student"}</span>
                            <span className="topbar-role">Student</span>
                        </div>
                    </div>
                </header>

                <main className="dash-content">
                    {activeNav === "dashboard" && (
                        <div className="dash-home">
                            <h1 className="dash-greeting">Welcome{userName ? `, ${userName.split(" ")[0]}` : ""} <i className="bi bi-hand-wave-fill" /></h1>
                            <p className="dash-desc">Your student portal is ready. Use the sidebar to navigate.</p>
                            <div className="dash-cards">
                                <div className="dash-card" onClick={() => setActiveNav("profile")}>
                                    <i className="bi bi-person-circle dash-card-icon" />
                                    <div>
                                        <div className="dash-card-title">My Profile</div>
                                        <div className="dash-card-sub">View and update your details</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("quizzes")}>
                                    <i className="bi bi-cpu-fill dash-card-icon" style={{ color: "#10b981" }} />
                                    <div>
                                        <div className="dash-card-title">AI Quizzes</div>
                                        <div className="dash-card-sub">Test your knowledge with AI</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("modules")}>
                                    <i className="bi bi-journal-bookmark-fill dash-card-icon" />
                                    <div>
                                        <div className="dash-card-title">My Modules</div>
                                        <div className="dash-card-sub">View your enrolled modules</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("ebooks")}>
                                    <i className="bi bi-book-half dash-card-icon" style={{ color: "#f59e0b" }} />
                                    <div>
                                        <div className="dash-card-title">E-Books</div>
                                        <div className="dash-card-sub">Search and read online e-books</div>
                                    </div>
                                </div>
                                <div className="dash-card" onClick={() => setActiveNav("tickets")}>
                                    <i className="bi bi-ticket-detailed-fill dash-card-icon" style={{ color: "#ec4899" }} />
                                    <div>
                                        <div className="dash-card-title">Support Tickets</div>
                                        <div className="dash-card-sub">Request certificates or report issues</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeNav === "modules" && <MyModules onNavigate={(nav, course) => { setActiveNav(nav); setActiveCourse(course); }} />}
                    {activeNav === "quizzes" && <StudentQuizzes />}
                    {activeNav === "ebooks" && <OnlineEbooks />}
                    {activeNav === "tickets" && <StudentTickets />}
                    {activeNav === "profile" && <MyProfile />}
                    {activeNav === "course-materials" && <StudentCourseMaterials course={activeCourse} onBack={() => setActiveNav("modules")} />}
                </main>
            </div>
            <FloatingAdvisor />
        </div>
    );
}

export default StudentDashboard;