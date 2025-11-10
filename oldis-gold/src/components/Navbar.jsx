import { NavLink, Link } from "react-router-dom";
import "../styles/navbar.css";
import DarkModeToggle from "./DarkModeToggle";

export default function Navbar() {
  return (
    <header className="nav">
      <Link to="/" className="nav-brand">
        OldisGold
      </Link>

      <nav className="nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/create">Post Ad</NavLink>
        <NavLink to="/my-listings">My Listings</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/login">Login</NavLink>

        {/* ✅ Dark mode toggle */}
        <DarkModeToggle />
      </nav>
    </header>
  );
}
