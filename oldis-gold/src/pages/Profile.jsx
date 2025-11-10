import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useauth";
import { auth } from "../lib/firebase";
import {
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import "../styles/profile.css";

const AVATAR_FALLBACK =
  "https://ui-avatars.com/api/?name=User&background=111111&color=ffffff&size=160&bold=true";

export default function Profile() {
  const { user, loading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

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

  const save = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setBusy(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || null,
      });
      await auth.currentUser.reload(); // refresh auth object so Navbar etc. update
      setMsg("Profile updated.");
      setToast("Profile saved");
      // auto clear toast
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setErr(e?.message || "Failed to update profile.");
    } finally {
      setBusy(false);
    }
  };

  const onResetPassword = async () => {
    setMsg(""); setErr("");
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMsg("Password reset email sent.");
      setToast("Reset email sent");
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setErr(e?.message || "Failed to send reset email.");
    }
  };

  const onVerifyEmail = async () => {
    setMsg(""); setErr("");
    try {
      await sendEmailVerification(auth.currentUser, {
        url: window.location.origin + "/profile",
        handleCodeInApp: true,
      });
      setMsg("Verification email sent.");
      setToast("Verification email sent");
      setTimeout(() => setToast(""), 1800);
    } catch (e) {
      setErr(e?.message || "Failed to send verification email.");
    }
  };

  const onLogout = async () => { await signOut(auth); };

  const avatar = (photoURL || AVATAR_FALLBACK).trim();

  return (
    <main className="page profile-wrap">
      {/* Toast */}
      {toast && (
        <div className="toast">
          <span className="check" aria-hidden>✓</span>
          {toast}
        </div>
      )}

      <div className="profile-card">
        <header className="profile-top">
          <div className="avatar-wrap">
            <img
              src={avatar}
              alt="avatar"
              className="profile-avatar"
              onError={(e) => (e.currentTarget.src = AVATAR_FALLBACK)}
            />
            <div className={`status-dot ${user.emailVerified ? "ok" : "warn"}`} />
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
            <div>
              <div className="preview-name">{displayName || "Your name"}</div>
              <div className="muted small">{user.email}</div>
            </div>
          </div>

          <div className="profile-actions">
            <button className="btn primary" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            {!user.emailVerified && (
              <button type="button" className="btn" onClick={onVerifyEmail}>
                Send verification email
              </button>
            )}
            <button type="button" className="btn" onClick={onResetPassword}>
              Reset password
            </button>
            <button type="button" className="btn danger" onClick={onLogout}>
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
