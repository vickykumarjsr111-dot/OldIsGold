import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import "../styles/navbar.css";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const panelRef = useRef(null);

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
    { to: "/login", label: "Login" },
  ];

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
                className={({ isActive }) =>
                  "mobile-link" + (isActive ? " active" : "")
                }
              >
                {l.label}
              </NavLink>
            ))}

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
