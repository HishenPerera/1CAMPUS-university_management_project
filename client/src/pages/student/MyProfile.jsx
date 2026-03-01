import { useState, useEffect } from "react";
import axios from "../../api/axiosInstance";
import UserAvatar from "../../components/UserAvatar";
import { useTheme } from "../../context/ThemeContext";
import "./MyProfile.css";

const SERVER_BASE = "http://localhost:5001";

const READONLY_FIELDS = [
    { label: "Registration Number", key: "registration_number" },
    { label: "Email Address", key: "email" },
    { label: "Degree Program", key: "degree_program" },
    { label: "Studying Year", key: "studying_year", format: v => `Year ${v}` },
    { label: "Semester", key: "semester", format: v => `Semester ${v}` },
    { label: "NIC Number", key: "nic_number" },
    { label: "Enrolled Date", key: "enrolled_date", format: v => v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—" },
    { label: "Account Status", key: "status" },
];

function MyProfile() {
    const { theme } = useTheme();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profileImage, setProfileImage] = useState(localStorage.getItem("profile_image") || "");

    const userName = localStorage.getItem("user_name") || "";

    const fetchProfile = async () => {
        setLoading(true); setError("");
        try {
            const res = await axios.get("/student/profile");
            setProfile(res.data);
            setPhone(res.data.phone_number || "");
            setAddress(res.data.address || "");
        } catch {
            setError("Could not load profile. Please try again.");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setSaved(false);
        try {
            await axios.put("/student/profile", { phone_number: phone, address });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            fetchProfile();
        } catch { setError("Failed to save changes."); }
        finally { setSaving(false); }
    };

    const handleAvatarUpload = (newUrl) => {
        setProfileImage(newUrl);
        localStorage.setItem("profile_image", newUrl);
    };

    if (loading) return (
        <div className="mp-loading"><div className="mp-spinner" /> Loading your profile…</div>
    );

    if (error && !profile) return (
        <div className="mp-error-full">{error}</div>
    );

    const photoSrc = profileImage
        ? (profileImage.startsWith("http") ? profileImage : `${SERVER_BASE}/${profileImage}`)
        : null;

    return (
        <div className="mp-page">
            {/* Profile hero card */}
            <div className="mp-hero">
                <div className="mp-hero-avatar" title="Click to change photo">
                    {photoSrc ? (
                        <img src={photoSrc} alt={userName} className="mp-hero-photo" />
                    ) : (
                        <div className="mp-hero-initials">
                            {(userName || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                    )}
                    <div className="mp-hero-avatar-overlay">
                        <UserAvatar
                            name={userName}
                            imageUrl={profileImage || undefined}
                            onUpload={handleAvatarUpload}
                            size="sm"
                        />
                    </div>
                </div>
                <div className="mp-hero-info">
                    <h2 className="mp-hero-name">{profile?.first_name} {profile?.last_name}</h2>
                    <p className="mp-hero-reg">{profile?.registration_number || "—"}</p>
                    <p className="mp-hero-degree">{profile?.degree_program || "—"}</p>
                </div>
                <div className="mp-hero-tags">
                    <span className="mp-tag">Year {profile?.studying_year || "—"}</span>
                    <span className="mp-tag">Sem {profile?.semester || "—"}</span>
                    <span className={`mp-tag mp-tag--${profile?.status === "active" ? "active" : "inactive"}`}>
                        {profile?.status || "active"}
                    </span>
                </div>
            </div>

            <div className="mp-columns">
                {/* Read-only info */}
                <section className="mp-section">
                    <h3 className="mp-section-title"><i className="bi bi-lock-fill" /> Academic Information <span className="mp-readonly-hint">Read-only — managed by admin</span></h3>
                    <div className="mp-info-grid">
                        {READONLY_FIELDS.map(f => (
                            <div key={f.key} className="mp-info-card mp-info-card--readonly">
                                <span className="mp-info-label">{f.label}</span>
                                <span className="mp-info-value">
                                    {f.format ? f.format(profile?.[f.key]) : (profile?.[f.key] || "—")}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Editable fields */}
                <section className="mp-section">
                    <h3 className="mp-section-title"><i className="bi bi-pencil-fill" /> My Details <span className="mp-readonly-hint">You can update these</span></h3>

                    {/* Avatar upload hint */}
                    <div className="mp-avatar-hint">
                        <UserAvatar name={userName} imageUrl={profileImage || undefined} onUpload={handleAvatarUpload} />
                        <div>
                            <p className="mp-avatar-hint-title">Profile Photo</p>
                            <p className="mp-avatar-hint-sub">Click the avatar to upload a new photo (JPG, PNG, max 2 MB)</p>
                        </div>
                    </div>

                    <form className="mp-edit-form" onSubmit={handleSave}>
                        <div className="form-group">
                            <label>Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+94 71 234 5678"
                            />
                        </div>
                        <div className="form-group">
                            <label>Address</label>
                            <textarea
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                rows={4}
                                placeholder="123 Main Street, Colombo 03"
                            />
                        </div>

                        {error && <div className="mp-error">{error}</div>}
                        {saved && <div className="mp-success">✅ Changes saved successfully!</div>}

                        <button type="submit" className="mp-save-btn" disabled={saving}>
                            {saving ? <><span className="mp-spinner mp-spinner--sm" /> Saving…</> : "Save Changes"}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default MyProfile;
