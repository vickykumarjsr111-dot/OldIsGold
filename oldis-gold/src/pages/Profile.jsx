// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { auth } from "../lib/firebase";
import {
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import "../styles/profile.css";

const AVATAR_FALLBACK =
  "https://ui-avatars.com/api/?name=User&background=111111&color=ffffff&size=160&bold=true";

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setPhotoURL(user.photoURL || "");
  }, [user]);

  if (loading) return <div className="page">Loading…</div>;
  if (!user) {
    return (
      <div className="page">
        Please <Link to="/login">login</Link> to view your profile.
      </div>
    );
  }

  const showToast = (t) => {
    setToast(t);
    setTimeout(() => setToast(""), 2200);
  };

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim() || null,
        photoURL: photoURL.trim() || null,
      });
      // reload so onAuthStateChanged picks new data
      await auth.currentUser.reload();
      setMsg("Profile updated.");
      showToast("Profile saved");
    } catch (e) {
      setErr(e?.message || "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async () => {
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMsg("Password reset email sent.");
      showToast("Reset email sent");
    } catch (e) {
      setErr(e?.message || "Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyEmail = async () => {
    setMsg("");
    setErr("");
    setBusy(true);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + "/profile",
        handleCodeInApp: true,
      });
      setMsg("Verification email sent.");
      showToast("Verification email sent");
    } catch (e) {
      setErr(e?.message || "Failed to send verification email.");
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async () => {
    // ask to confirm so user doesn't logout by mistake
    if (!confirm("Logout now?")) return;
    try {
      await logout();
      // optionally redirect handled elsewhere by route
    } catch (e) {
      console.error(e);
      alert("Logout failed. Try again.");
    }
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1600);
      showToast("Copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const avatar = (photoURL || AVATAR_FALLBACK).trim();

  return (
    <main className="page profile-wrap">
      {/* Toast (floating) */}
      {toast && <div className="toast">{toast}</div>}

      <div className="profile-card">
        <header className="profile-top">
          <div className="avatar-wrap">
            <img
              src={avatar}
              alt="avatar"
              className="profile-avatar"
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div
              className={`status-dot ${user.emailVerified ? "ok" : "warn"}`}
              title={user.emailVerified ? "Email verified" : "Email not verified"}
            />
          </div>

          <div className="profile-id">
            <div className="profile-name">{user.displayName || "User"}</div>
            <div className="profile-email">{user.email || "—"}</div>

            <div className="profile-meta">
              <span className={user.emailVerified ? "ok" : "warn"}>
                {user.emailVerified ? "Email verified" : "Email not verified"}
              </span>
              <span className="muted">UID: {user.uid}</span>
            </div>

            <div className="quick-row">
              <Link to="/create" className="btn primary">Post Ad</Link>
              <Link to="/my-listings" className="btn">My Listings</Link>
            </div>
          </div>
        </header>

        {/* Alerts */}
        {err && <div className="alert error">{err}</div>}
        {msg && <div className="alert ok">{msg}</div>}

        <form onSubmit={save} className="profile-form">
          <label>
            Display Name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label>
            Photo URL (direct link)
            <input
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://…/avatar.png"
            />
          </label>

          {/* Live preview below fields */}
          <div className="preview">
            <img
              src={(photoURL || AVATAR_FALLBACK).trim()}
              alt="preview"
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div className="preview-info">
              <div className="preview-name">{displayName || user.displayName || "Your name"}</div>
              <div className="muted small">{user.email}</div>

              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => copyToClipboard(user.uid, "UID")}
                >
                  {copied === "UID" ? "Copied" : "Copy UID"}
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => copyToClipboard(user.email || "", "Email")}
                >
                  {copied === "Email" ? "Copied" : "Copy Email"}
                </button>
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>

            {!user.emailVerified && (
              <button
                type="button"
                className="btn"
                onClick={onVerifyEmail}
                disabled={busy}
                aria-disabled={busy}
              >
                Send verification email
              </button>
            )}

            <button
              type="button"
              className="btn"
              onClick={onResetPassword}
              disabled={busy}
              aria-disabled={busy}
            >
              Reset password
            </button>

            <button
              type="button"
              className="btn danger"
              onClick={onLogout}
              disabled={busy}
              aria-disabled={busy}
            >
              Logout
            </button>
          </div>
        </form>

        <p className="muted tip">
          Tip: No Storage? Host your avatar on Cloudinary/ImgBB and paste the direct URL here.
        </p>
      </div>
    </main>
  );
}
