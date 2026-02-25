function LecturerDashboard() {
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <div className="dashboard-logo">1C</div>
                    <span className="dashboard-logo-text">1CAMPUS</span>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </header>
            <main className="dashboard-main">
                <h1 className="dashboard-greeting">Welcome back, Lecturer 👋</h1>
                <p className="dashboard-desc">Your teaching dashboard is on its way. Stay tuned!</p>
            </main>
        </div>
    );
}

export default LecturerDashboard;
