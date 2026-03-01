import { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import UserAvatar from "../../components/UserAvatar";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";

function LecturerDashboard() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;
    const userName = localStorage.getItem("user_name") || "";
    const [profileImage, setProfileImage] = useState(
        localStorage.getItem("profile_image") || ""
    );

    const handleAvatarUpload = (newUrl) => {
        setProfileImage(newUrl);
        localStorage.setItem("profile_image", newUrl);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_name");
        localStorage.removeItem("profile_image");
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
                    <UserAvatar
                        name={userName}
                        imageUrl={profileImage || undefined}
                        onUpload={handleAvatarUpload}
                    />
                    <button className="logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <main className="dashboard-main">
                <h1 className="dashboard-greeting">Welcome back{userName ? `, ${userName.split(" ")[0]}` : ""} 👋</h1>
                <p className="dashboard-desc">Your teaching dashboard is on its way. Stay tuned!</p>
            </main>
        </div>
    );
}

export default LecturerDashboard;
