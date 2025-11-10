// src/pages/Home.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"; // ⬅️ onSnapshot added
import { db } from "../lib/firebase";
import ListingCard from "../components/ListingCard.jsx";
import "../styles/home.css";

const CATEGORIES = ["All", "Mobiles", "Cars", "Bikes", "Home", "Electronics", "Others"];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("Any"); // New | Used | Any
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | plh | phl

  // 🔄 Realtime subscription
  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setListings(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return unsub; // cleanup
  }, []);

  // 1) Filter
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const min = Number(minPrice) || null;
    const max = Number(maxPrice) || null;
    const cityQuery = city.trim().toLowerCase();

    return listings.filter((item) => {
      const text = `${item.title ?? ""} ${item.description ?? ""}`.toLowerCase();
      if (s && !text.includes(s)) return false;

      if (category !== "All" && item.category !== category) return false;

      if (condition !== "Any" && item.condition !== condition) return false;

      const price = Number(item.price);
      if (min !== null && !Number.isNaN(price) && price < min) return false;
      if (max !== null && !Number.isNaN(price) && price > max) return false;

      if (cityQuery) {
        const loc = String(item.location ?? "").toLowerCase();
        if (!loc.includes(cityQuery)) return false;
      }

      return true;
    });
  }, [listings, search, category, condition, minPrice, maxPrice, city]);

  // 2) Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];

    if (sortBy === "newest") {
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    } else if (sortBy === "oldest") {
      arr.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
    } else if (sortBy === "plh") {
      arr.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "phl") {
      arr.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    }

    return arr;
  }, [filtered, sortBy]);

  const clearFilters = () => {
    setSearch("");
    setCategory("All");
    setCondition("Any");
    setMinPrice("");
    setMaxPrice("");
    setCity("");
    setSortBy("newest");
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader" />
        <p>Loading listings…</p>
      </div>
    );
  }

  return (
    <main className="home-container">
      <h2 className="home-title">Recent Listings</h2>

      {/* Controls */}
      <section className="home-controls">
        <input
          className="hc-input"
          type="text"
          placeholder="Search title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select className="hc-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="hc-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
          <option>Any</option>
          <option>New</option>
          <option>Used</option>
        </select>

        <input
          className="hc-input"
          type="number"
          min="0"
          placeholder="Min ₹"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          className="hc-input"
          type="number"
          min="0"
          placeholder="Max ₹"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <input
          className="hc-input"
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        {/* Sorter */}
        <select className="hc-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} title="Sort by">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="plh">Price: Low → High</option>
          <option value="phl">Price: High → Low</option>
        </select>

        <button className="hc-clear" onClick={clearFilters}>Clear</button>
      </section>

      {/* Results meta */}
      <div className="home-meta">
        <span>
          Showing <b>{sorted.length}</b> of {listings.length}
        </span>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && <p className="home-empty">No listings match your filters.</p>}

      {/* Grid */}
      <div className="home-grid">
        {sorted.map((item) => (
          <ListingCard key={item.id} item={item} />
        ))}
      </div>
    </main>
  );
}
