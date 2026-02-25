import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      const role = res.data.user.role;

      if (role === "student") navigate("/student");
      else if (role === "lecturer") navigate("/lecturer");
      else if (role === "admin_staff") navigate("/admin");
      else if (role === "web_admin") navigate("/webadmin");
      else setError("Unknown role. Please contact support.");
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo / Branding */}
        <div className="login-brand">
          <div className="login-logo">1C</div>
          <h1 className="login-title">1CAMPUS</h1>
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
            {loading ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="login-footer">
          © 2026 1CAMPUS · All rights reserved
        </p>
      </div>
    </div>
  );
}

export default Login;