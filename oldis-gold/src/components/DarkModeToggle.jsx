// src/components/DarkModeToggle.jsx
import { useEffect, useState } from "react";

const initial = () => {
  const saved = localStorage.getItem("theme");
  if (saved) return saved === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

export default function DarkModeToggle() {
  const [dark, setDark] = useState(initial);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("theme-dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("theme-dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button className="btn" onClick={() => setDark(d => !d)}>
      {dark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
