import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import DarkModeToggle from "./DarkModeToggle";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef(null);
  const nav = useNavigate();

  // Close drawer when route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  const links = [
    { to: "/", label: "Home", end: true },
    { to: "/create", label: "Post Ad" },
    { to: "/my-listings", label: "My Listings" },
    { to: "/profile", label: "Profile" },
  ];

  const onLogout = async () => {
    try {
      await logout();
      nav("/");
    } catch (e) {
      console.error("Logout failed", e);
      alert("Failed to logout. Try again.");
    }
  };

  return (
    <header className="nav">
      <div className="nav-left">
        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          onClick={() => setOpen((s) => !s)}
        >
          <span className={`hamburger ${open ? "open" : ""}`} />
        </button>

        <Link to="/" className="nav-brand">
          OldisGold
        </Link>
      </div>

      {/* Desktop links */}
      <nav className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {l.label}
          </NavLink>
        ))}

        {/* Auth section */}
        {!loading && user ? (
          <>
            <Link to="/profile" className="nav-user">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "U")}&background=ddd`}
                alt={user.displayName || user.email || "User"}
                className="nav-avatar"
              />
              <span className="nav-username">{user.displayName || user.email}</span>
            </Link>
            <button className="btn" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
            Login
          </NavLink>
        )}

        <DarkModeToggle />
      </nav>

      {/* Mobile drawer (role dialog) */}
      <div
        id="mobile-drawer"
        className={`mobile-drawer ${open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
      >
        {/* BACKDROP FIRST (so the inner panel is above it) */}
        <button
          className="drawer-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* PANEL on top */}
        <div className="mobile-drawer-inner" ref={panelRef}>
          <div className="mobile-header">
            <Link to="/" className="mobile-brand" onClick={() => setOpen(false)}>
              OldisGold
            </Link>
            <button
              className="drawer-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <nav className="mobile-links" onClick={() => setOpen(false)}>
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => "mobile-link" + (isActive ? " active" : "")}
              >
                {l.label}
              </NavLink>
            ))}

            {/* Mobile auth area */}
            {!loading && user ? (
              <div className="mobile-user">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || "U")}&background=ddd`}
                  alt={user.displayName || user.email || "User"}
                  className="mobile-avatar"
                />
                <div style={{ marginLeft: 10 }}>
                  <div style={{ fontWeight: 700 }}>{user.displayName || user.email}</div>
                  <button className="btn" onClick={onLogout}>Logout</button>
                </div>
              </div>
            ) : (
              <NavLink to="/login" className="mobile-link">Login</NavLink>
            )}

            <div className="mobile-toggle">
              <DarkModeToggle />
            </div>
          </nav>

          <div className="mobile-footer">
            <small>© {new Date().getFullYear()} OldisGold</small>
          </div>
        </div>
      </div>
    </header>
  );
}
