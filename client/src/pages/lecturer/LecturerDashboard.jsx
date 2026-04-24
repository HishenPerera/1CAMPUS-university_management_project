import { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import LecturerCourses from "./LecturerCourses";
import LecturerCourseMaterials from "./LecturerCourseMaterials";
import AIAssessment from "./AIAssessment";
import ManageQuizzes from "./ManageQuizzes";
import ChatInterface from "../../components/chat/ChatInterface";
import "../../components/DashboardLayout.css";

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: "bi-grid-1x2-fill" },
    { id: "courses", label: "My Modules", icon: "bi-book-fill" },
    { id: "ai-assessment", label: "AI Generator", icon: "bi-robot" },
    { id: "manage-quizzes", label: "Manage Quizzes", icon: "bi-journal-check" },
    { id: "timetable", label: "Timetable", icon: "bi-calendar3" },
    { id: "grades", label: "Grade Entry", icon: "bi-pencil-square" },
    { id: "chat", label: "Messages", icon: "bi-chat-dots-fill" },
];

function LecturerDashboard() {
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
                    userRole="Lecturer"
                    profileImage={profileImage}
                    onAvatarUpload={handleAvatarUpload}
                />

                <main className="dash-content">
                    {activeNav === "dashboard" && (
                        <div className="dash-home">
                            <h1 className="dash-greeting">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} <i className="bi bi-hand-wave-fill" /></h1>
                            <p className="dash-desc">Manage your courses, grades and timetable from the sidebar.</p>
                            <div className="dash-cards">
                                {NAV_ITEMS.filter(i => i.id !== "dashboard").map(item => (
                                    <div key={item.id} className="dash-card" onClick={() => setActiveNav(item.id)}>
                                        <i className={`bi ${item.icon} dash-card-icon`} />
                                        <div>
                                            <div className="dash-card-title">{item.label}</div>
                                            <div className="dash-card-sub">
                                                {item.id === "manage-quizzes" ? "View results & export PDF" : 
                                                 item.id === "ai-assessment" ? "Generate assessments" : 
                                                 item.id === "chat" ? "Chat with students and staff" :
                                                 "Manage your " + item.label.toLowerCase()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeNav === "courses" && <LecturerCourses onNavigate={(nav, course) => { setActiveNav(nav); setActiveCourse(course); }} />}
                    {activeNav === "course-materials" && <LecturerCourseMaterials course={activeCourse} onBack={() => setActiveNav("courses")} />}
                    {activeNav === "ai-assessment" && <AIAssessment />}
                    {activeNav === "manage-quizzes" && <ManageQuizzes />}
                    {activeNav === "chat" && <ChatInterface />}
                    {activeNav !== "dashboard" && activeNav !== "courses" && activeNav !== "course-materials" && activeNav !== "ai-assessment" && activeNav !== "manage-quizzes" && activeNav !== "chat" && (
                        <div className="coming-soon">
                            <i className={`bi ${NAV_ITEMS.find(i => i.id === activeNav)?.icon || 'bi-cone-striped'} coming-soon-icon`} />
                            <h3>{NAV_ITEMS.find(i => i.id === activeNav)?.label || 'Under Construction'}</h3>
                            <p>This section is under development. Check back soon!</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default LecturerDashboard;
