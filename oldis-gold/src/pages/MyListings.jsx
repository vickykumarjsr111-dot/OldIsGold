import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useauth";
import { listenMyListings } from "../services/listings";
import ListingCard from "../components/ListingCard";

export default function MyListings() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenMyListings(user.uid, setRows);
    return () => unsub?.();
  }, [user]);

  if (loading) return <div className="page">Loading…</div>;
  if (!user) return (
    <div className="page">
      Please <Link to="/login">login</Link> to see your listings.
    </div>
  );

  return (
    <main className="page">
      <h1>My Listings</h1>
      {rows.length === 0 ? (
        <p>No listings yet. <Link to="/create">Post one</Link>.</p>
      ) : (
        <div className="grid">
          {rows.map((r) => (<ListingCard key={r.id} item={r} />))}
        </div>
      )}
    </main>
  );
}
