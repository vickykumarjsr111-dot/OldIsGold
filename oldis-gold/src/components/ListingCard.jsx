import { Link } from "react-router-dom";
import "../styles/listingCard.css";

export default function ListingCard({ item }) {
  const img =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : "";

  return (
    <Link to={`/listing/${item.id}`} className="lc-card">
      {img ? (
        <img src={img} alt={item.title} className="lc-img" />
      ) : (
        <div className="lc-img placeholder">No Image</div>
      )}

      <div className="lc-info">
        <h3 className="lc-title">{item.title}</h3>
        <div className="lc-price">₹{item.price}</div>
        <div className="lc-meta">{item.location ?? "Unknown"}</div>
      </div>
    </Link>
  );
}
