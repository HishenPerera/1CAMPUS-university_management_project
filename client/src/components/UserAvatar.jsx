import { useRef } from "react";
import axios from "../api/axiosInstance";
import "./UserAvatar.css";

/**
 * Shows the user's real photo (if available) or their initials.
 * When `onUpload` is provided, clicking opens a file picker.
 *
 * Props:
 *   name       – full name string  (e.g. "Alice Johnson")
 *   imageUrl   – absolute URL of the profile image (optional)
 *   onUpload   – callback(newImageUrl) called after a successful upload (optional)
 *   size       – "sm" | "md" (default "md")
 */
function UserAvatar({ name = "", imageUrl, onUpload, size = "md" }) {
    const fileRef = useRef(null);

    const initials = name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0].toUpperCase())
        .slice(0, 2)
        .join("") || "?";

    const handleClick = () => {
        if (onUpload) fileRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profile_image", file);

        try {
            const res = await axios.patch("/auth/profile-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const newUrl = res.data.profile_image;
            localStorage.setItem("profile_image", newUrl);
            onUpload?.(newUrl);
        } catch (err) {
            console.error("Upload failed:", err);
        }
        // Reset input so same file can be re-selected
        e.target.value = "";
    };

    return (
        <div
            className={`user-avatar user-avatar--${size} ${onUpload ? "user-avatar--clickable" : ""}`}
            title={onUpload ? `${name || "User"} — click to change photo` : name || "User"}
            onClick={handleClick}
        >
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={name || "User"}
                    className="user-avatar__photo"
                />
            ) : (
                <span className="user-avatar__initials">{initials}</span>
            )}

            {onUpload && (
                <>
                    <div className="user-avatar__overlay">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="user-avatar__file-input"
                        onChange={handleFileChange}
                    />
                </>
            )}
        </div>
    );
}

export default UserAvatar;
