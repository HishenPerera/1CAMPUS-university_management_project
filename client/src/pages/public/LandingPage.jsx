import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import darkLogo from "../../assets/darkLogo.png";
import lightLogo from "../../assets/lightLogo.png";
import "./LandingPage.css";

function LandingPage() {
    const { theme } = useTheme();
    const logo = theme === "light" ? lightLogo : darkLogo;

    return (
        <div className="lp-container">
            {/* ── Navbar ──────────────────────────────────────────────────────── */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <img src={logo} alt="1CAMPUS" className="lp-logo" />
                    <div className="lp-nav-links">
                        <a href="#about" className="lp-link">About Us</a>
                        <a href="#events" className="lp-link">Events & Promos</a>
                        <ThemeToggle />
                        <Link to="/login" className="lp-login-btn">
                            <i className="bi bi-box-arrow-in-right" /> Portal Login
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ────────────────────────────────────────────────── */}
            <header className="lp-hero">
                <div className="lp-hero-content">
                    <span className="lp-badge">Admissions Open for 2026</span>
                    <h1 className="lp-title">Shape Your Future with <span className="text-gradient">1CAMPUS</span></h1>
                    <p className="lp-subtitle">
                        Join a world-class university management ecosystem. Apply today to
                        start your academic journey in technology, business, or engineering.
                    </p>
                    <div className="lp-actions">
                        <Link to="/apply" className="lp-cta-btn">
                            Apply Now <i className="bi bi-arrow-right-short" />
                        </Link>
                        <a href="#events" className="lp-secondary-btn">View Campus Events</a>
                    </div>
                </div>
            </header>

            {/* ── Promos & Events Section ─────────────────────────────────────── */}
            <section id="events" className="lp-section">
                <div className="lp-section-header">
                    <h2 className="lp-section-title">Latest University Events</h2>
                    <p className="lp-section-subtitle">Discover what's happening around the 1CAMPUS community.</p>
                </div>

                <div className="lp-grid">
                    <div className="lp-card">
                        <div className="lp-card-img temp-img-1" />
                        <div className="lp-card-body">
                            <span className="lp-card-tag">Tech Event</span>
                            <h3 className="lp-card-title">Annual Hackathon 2026</h3>
                            <p className="lp-card-text">Join 500+ students in our upcoming 48-hour coding marathon. Prizes worth $10,000.</p>
                            <div className="lp-card-footer">
                                <i className="bi bi-calendar-event" /> March 15, 2026
                            </div>
                        </div>
                    </div>

                    <div className="lp-card">
                        <div className="lp-card-img temp-img-2" />
                        <div className="lp-card-body">
                            <span className="lp-card-tag">Webinar</span>
                            <h3 className="lp-card-title">Future of AI in Business</h3>
                            <p className="lp-card-text">Guest lecture by industry leaders on the impact of artificial intelligence in modern economics.</p>
                            <div className="lp-card-footer">
                                <i className="bi bi-calendar-event" /> April 2, 2026
                            </div>
                        </div>
                    </div>

                    <div className="lp-card">
                        <div className="lp-card-img temp-img-3" />
                        <div className="lp-card-body">
                            <span className="lp-card-tag">Campus Life</span>
                            <h3 className="lp-card-title">Spring Festival</h3>
                            <p className="lp-card-text">Celebrate the new semester with live music, food stalls, and club registrations on the main lawn.</p>
                            <div className="lp-card-footer">
                                <i className="bi bi-calendar-event" /> April 10, 2026
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Apply Banner ────────────────────────────────────────────────── */}
            <section className="lp-banner">
                <div className="lp-banner-content">
                    <h2>Ready to Take the Next Step?</h2>
                    <p>Submit your application in just 5 minutes and get an instant confirmation.</p>
                    <Link to="/apply" className="lp-cta-btn lp-cta-btn--light">
                        Start Registration <i className="bi bi-journal-text" />
                    </Link>
                </div>
            </section>

            {/* ── Footer ──────────────────────────────────────────────────────── */}
            <footer className="lp-footer">
                <div className="lp-footer-inner">
                    <img src={logo} alt="1CAMPUS" className="lp-footer-logo" />
                    <p>&copy; {new Date().getFullYear()} 1CAMPUS University Management System. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
