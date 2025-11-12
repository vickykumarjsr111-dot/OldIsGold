import { Link } from "react-router-dom";
import "../styles/listingcard.css";

export default function ListingCard({ item }) {
  const img =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : "";

  return (
    // inside ListingCard.jsx return(...)
<Link to={`/listing/${item.id}`} className="lc-card">
  <img
    src={img}
    alt={item.title}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = "";
    }}
  />
  <div className="lc-body">
    <h3 className="lc-title">{item.title}</h3>
    <div className="lc-price">₹{Number(item.price) || "—"}</div>
    <div className="lc-meta">
      <span>{item.location || "—"}</span>
      {item.condition && <span>• {item.condition}</span>}
    </div>
  </div>
</Link>

  );
}
