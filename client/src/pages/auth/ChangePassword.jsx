import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "./ChangePassword.css";

function ChangePassword() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            return setError("Password must be at least 6 characters.");
        }
        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }

        setLoading(true);
        try {
            await axios.patch("/auth/change-password", { newPassword });
            localStorage.setItem("is_temp_password", "false");
            setSuccess(true);
            setTimeout(() => {
                // Navigate to the user's role-based dashboard
                const role = localStorage.getItem("user_role");
                if (role === "student") navigate("/student");
                else if (role === "lecturer") navigate("/lecturer");
                else if (role === "admin_staff") navigate("/admin");
                else if (role === "web_admin") navigate("/webadmin");
                else navigate("/login");
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cp-page">
            <div className="cp-card">
                <div className="cp-brand">
                    <img src={logo} alt="1CAMPUS" className="cp-logo" />
                </div>

                <div className="cp-header">
                    <div className="cp-icon">🔐</div>
                    <h1 className="cp-title">Set Your Password</h1>
                    <p className="cp-subtitle">
                        You are using a temporary password. Please set a new password to continue.
                    </p>
                </div>

                {success ? (
                    <div className="cp-success">
                        <span>✅</span> Password updated! Redirecting…
                    </div>
                ) : (
                    <form className="cp-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repeat your new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="cp-error">
                                <span>⚠</span> {error}
                            </div>
                        )}

                        <button type="submit" className="cp-btn" disabled={loading}>
                            {loading ? <><span className="spinner" /> Saving…</> : "Set New Password"}
                        </button>
                    </form>
                )}

                <div className="cp-theme">
                    <ThemeToggle />
                </div>
            </div>
        </div>
    );
}

export default ChangePassword;
