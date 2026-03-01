import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { useTheme } from "../../context/ThemeContext";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "./ApplicationForm.css";

const DEGREES = [
    "Bachelor of Science in Computer Science",
    "Bachelor of Science in Information Technology",
    "Bachelor of Engineering",
    "Bachelor of Business Administration",
    "Bachelor of Science in Data Science",
    "Bachelor of Arts",
    "Master of Science in Computer Science",
    "Master of Business Administration",
];

function ApplicationForm() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;

    const [form, setForm] = useState({
        first_name: "", last_name: "", email: "", nic_number: "", phone_number: "", address: "", degree_program: DEGREES[0]
    });

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); setError(""); setSuccess(false);

        try {
            await axios.post("/public/apply", form);
            setSuccess(true);
            setForm({
                first_name: "", last_name: "", email: "", nic_number: "", phone_number: "", address: "", degree_program: DEGREES[0]
            });
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit application. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="ap-wrapper">
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <Link to="/"><img src={logo} alt="1CAMPUS" className="lp-logo" /></Link>
                    <div className="lp-nav-links">
                        <Link to="/" className="lp-link"><i className="bi bi-arrow-left-short" /> Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="ap-container">
                <div className="ap-card">
                    <div className="ap-header">
                        <h2>University Application Form</h2>
                        <p>Please fill out your details to apply for enrolment.</p>
                    </div>

                    {success ? (
                        <div className="ap-success">
                            <i className="bi bi-check-circle-fill ap-success-icon" />
                            <h3>Application Submitted!</h3>
                            <p>Your application has been received successfully. Our administrative team will review your details shortly. Once approved, you will receive your portal login credentials via email.</p>
                            <Link to="/" className="ap-return-btn">Return to Homepage</Link>
                        </div>
                    ) : (
                        <form className="ap-form" onSubmit={handleSubmit}>
                            <div className="ap-row">
                                <div className="ap-form-group">
                                    <label>First Name *</label>
                                    <input name="first_name" value={form.first_name} onChange={handleChange} required placeholder="Jane" />
                                </div>
                                <div className="ap-form-group">
                                    <label>Last Name *</label>
                                    <input name="last_name" value={form.last_name} onChange={handleChange} required placeholder="Doe" />
                                </div>
                            </div>

                            <div className="ap-form-group">
                                <label>Email Address *</label>
                                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="jane.doe@example.com" />
                            </div>

                            <div className="ap-row">
                                <div className="ap-form-group">
                                    <label>NIC Number *</label>
                                    <input name="nic_number" value={form.nic_number} onChange={handleChange} required placeholder="200012345678" />
                                </div>
                                <div className="ap-form-group">
                                    <label>Phone Number *</label>
                                    <input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} required placeholder="+94 7X XXX XXXX" />
                                </div>
                            </div>

                            <div className="ap-form-group">
                                <label>Residential Address *</label>
                                <textarea name="address" value={form.address} onChange={handleChange} required rows={3} placeholder="House No, Street, City" />
                            </div>

                            <div className="ap-form-group">
                                <label>Intended Degree Program *</label>
                                <div className="sm-select-wrap">
                                    <select name="degree_program" value={form.degree_program} onChange={handleChange} required>
                                        {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {error && <div className="ap-error"><i className="bi bi-exclamation-triangle-fill" /> {error}</div>}

                            <button type="submit" className="ap-submit-btn" disabled={submitting}>
                                {submitting ? <><span className="sm-spinner sm-spinner--sm" /> Submitting…</> : "Submit Application"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ApplicationForm;
