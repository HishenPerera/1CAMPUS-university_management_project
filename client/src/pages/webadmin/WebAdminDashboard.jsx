import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";

function WebAdminDashboard() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <img src={logo} alt="1CAMPUS" className="dashboard-logo-img" />
                </div>
                <div className="header-actions">
                    <ThemeToggle />
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <main className="dashboard-main">
                <h1 className="dashboard-greeting">Welcome, Web Admin 👋</h1>
                <p className="dashboard-desc">System administration tools are coming soon!</p>
            </main>
        </div>
    );
}

export default WebAdminDashboard;
