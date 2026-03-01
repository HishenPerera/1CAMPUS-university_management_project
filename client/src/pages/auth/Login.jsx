import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import ThemeToggle from "../../components/ThemeToggle";
import { useTheme } from "../../context/ThemeContext";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const logo = theme === "light" ? lightLogo : darkLogo;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user_name", res.data.user.full_name || "");
      localStorage.setItem("profile_image", res.data.user.profile_image || "");
      localStorage.setItem("user_role", res.data.user.role || "");
      localStorage.setItem("is_temp_password", res.data.user.is_temp_password ? "true" : "false");

      // Force password change if using a temp password
      if (res.data.user.is_temp_password) {
        navigate("/change-password");
        return;
      }

      const role = res.data.user.role;
      if (role === "student") navigate("/student");
      else if (role === "lecturer") navigate("/lecturer");
      else if (role === "admin_staff") navigate("/admin");
      else if (role === "web_admin") navigate("/webadmin");
      else setError("Unknown role. Please contact support.");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        <div className="login-brand">
          <img src={logo} alt="1CAMPUS" className="login-logo-img" />
          <p className="login-subtitle">University Management System</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="error-icon">⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-btn ${loading ? "login-btn--loading" : ""}`}
            disabled={loading}
          >
            {loading ? (<><span className="spinner" /> Signing in…</>) : "Sign In"}
          </button>
        </form>

        <p className="login-footer">© 2026 1CAMPUS · All rights reserved</p>
      </div>
    </div>
  );
}

export default Login;