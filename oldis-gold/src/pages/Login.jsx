// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { auth, signInWithGooglePopup, signInWithGoogleRedirect, finishRedirectSignIn } from "../lib/firebase";
import "../styles/login.css";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const redirectTo = loc.state?.from?.pathname || "/";

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // If the app was redirected from Google sign-in, finish it here
  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const res = await finishRedirectSignIn();
        if (res && res.user) {
          // Successfully signed in via redirect
          nav(redirectTo, { replace: true });
        }
      } catch (e) {
        // optional: show a friendly message for redirect errors
        console.error("Redirect sign-in error:", e);
        // you can setErr(...) if you want to show it to the user
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        await createUserWithEmailAndPassword(auth, email, pass);
      }
      nav(redirectTo, { replace: true });
    } catch (e) {
      setErr(cleanFirebaseError(e?.message || "Authentication failed"));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setErr("");
    setBusy(true);
    try {
      // Try popup sign-in first (best UX on desktop)
      await signInWithGooglePopup();
      nav(redirectTo, { replace: true });
    } catch (e) {
      const code = (e?.code || "").toString().toLowerCase();
      const msg = (e?.message || "").toLowerCase();

      // Fallback conditions (popup blocked, closed, iframe issues, etc.)
      if (
        code.includes("popup-blocked") ||
        code.includes("cancelled-popup-request") ||
        code.includes("popup_closed_by_user") ||
        /popup|blocked|iframe|cancelled|access_denied/.test(msg)
      ) {
        // start redirect flow (works in mobile browsers)
        try {
          await signInWithGoogleRedirect();
          // note: redirect will navigate away; the completion is handled in useEffect above
        } catch (err) {
          setErr(cleanFirebaseError(err?.message || "Google redirect failed"));
        }
      } else {
        setErr(cleanFirebaseError(e?.message || "Google sign-in failed"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 style={{ marginBottom: 8 }}>{mode === "login" ? "Login" : "Create account"}</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {mode === "login"
          ? "Welcome back! Login to continue."
          : "Create a new account to post and manage your listings."}
      </p>

      {err && (
        <div style={{ padding: "10px 12px", border: "1px solid #f5c2c7", background: "#f8d7da", color: "#842029", borderRadius: 8, marginBottom: 12 }}>
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="form" style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>

        <button className="btn primary" disabled={busy}>
          {busy ? (mode === "login" ? "Logging in…" : "Creating…") : (mode === "login" ? "Login" : "Create account")}
        </button>
      </form>

      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <button className="btn" onClick={onGoogle} disabled={busy}>
          Continue with Google
        </button>
        <button
          className="btn"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}
          disabled={busy}
        >
          {mode === "login" ? "Create a new account" : "I already have an account"}
        </button>
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        By continuing, you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy</Link>.
      </p>
    </main>
  );
}

/** Optional: make Firebase errors friendlier */
function cleanFirebaseError(msg) {
  if (!msg) return "";
  const m = msg.toLowerCase();
  if (m.includes("auth/invalid-credential") || m.includes("invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (m.includes("auth/email-already-in-use")) {
    return "This email is already in use. Try logging in.";
  }
  if (m.includes("auth/weak-password")) {
    return "Password should be at least 6 characters.";
  }
  if (m.includes("network") || m.includes("timeout")) {
    return "Network error. Please check your connection.";
  }
  if (m.includes("popup-blocked") || m.includes("popup_closed_by_user")) {
    return "Popup blocked or closed. Try again or use a different device.";
  }
  return msg.replace("Firebase:", "").trim();
}
