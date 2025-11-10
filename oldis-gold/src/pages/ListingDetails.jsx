import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import useAuth from "../hooks/useauth";              // ✅ fix path (capital A)
import { deleteListing } from "../services/listings";
import { timeAgo } from "../utils/time";
import "../styles/listingdetails.css";               // ✅ new styles

const FALLBACK = "https://picsum.photos/800?blur=2";
const THUMB_FALLBACK = "https://picsum.photos/200?blur=2";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

// Build a WhatsApp link from a number + optional message
function toWhatsAppLink(rawNumber, message = "") {
  if (!rawNumber) return null;
  const digits = String(rawNumber).replace(/\D/g, "");
  const withCC = digits.startsWith("91") ? digits : `91${digits}`; // default India
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${withCC}${text ? `?text=${text}` : ""}`;
}

export default function ListingDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "listings", id));
        const data = snap.exists() ? { id: snap.id, ...snap.data() } : null;
        setItem(data);
        setSel(0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canEdit = !!(user && item && user.uid === item.uid);
  const images = useMemo(
    () => (Array.isArray(item?.images) && item.images.length ? item.images : []),
    [item]
  );

  if (loading) return <div className="page">Loading…</div>;
  if (!item)
    return (
      <div className="page">
        Listing not found. <Link to="/">Go home</Link>
      </div>
    );

  const priceStr = Number.isFinite(Number(item.price))
    ? INR.format(Number(item.price))
    : "—";

  const postedStr = item.createdAt ? `Posted ${timeAgo(item.createdAt)}` : "";

  const onDelete = async () => {
    if (!confirm("Delete this listing?")) return;
    try {
      await deleteListing(item);
      nav("/");
    } catch (e) {
      alert(e?.message || "Failed to delete");
    }
  };

  const waMessage = `Hi, I'm interested in your "${item.title}".`;
  const waLink = toWhatsAppLink(item.sellerWhatsapp, waMessage);

  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <Link to="/" className="btn" style={{ marginBottom: 12 }}>
        ← Back
      </Link>

      <div className="ld-grid">
        {/* Gallery */}
        <section>
          <div className="ld-img-wrap">
            <img
              key={sel}
              src={images[sel] || FALLBACK}
              alt={item.title}
              onError={(e) => (e.currentTarget.src = FALLBACK)}
            />
          </div>

          {images.length > 1 && (
            <div className="ld-thumbs">
              {images.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  className={`ld-thumb ${i === sel ? "active" : ""}`}
                  onClick={() => setSel(i)}
                  aria-label={`Preview image ${i + 1}`}
                >
                  <img
                    src={u}
                    alt={`thumb-${i}`}
                    onError={(e) => (e.currentTarget.src = THUMB_FALLBACK)}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section>
          <h1 className="ld-title">{item.title || "Untitled"}</h1>

          <div className="ld-price">{priceStr}</div>

          <div className="ld-meta">
            {item.category && <span>{item.category}</span>}
            {item.condition && <span>• {item.condition}</span>}
            {item.location && <span>• {item.location}</span>}
            {postedStr && <span>• {postedStr}</span>}
          </div>

          {item.description && <p className="ld-desc">{item.description}</p>}

          {/* Seller block + WhatsApp */}
          <div className="ld-seller">
            <div className="ld-seller-title">Seller</div>
            <div className="ld-seller-grid">
              <div><b>Name:</b> {item.sellerName || "—"}</div>
              <div><b>WhatsApp:</b> {item.sellerWhatsapp || "—"}</div>
            </div>

            {waLink && (
              <a
                className="btn primary"
                style={{ marginTop: 10, display: "inline-block" }}
                href={waLink}
                target="_blank"
                rel="noreferrer"
              >
                Contact on WhatsApp
              </a>
            )}
          </div>

          {/* Owner actions */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Link className="btn" to="/">Back</Link>
            {canEdit && (
              <>
                <Link className="btn" to={`/edit/${item.id}`}>Edit</Link>
                <button className="btn danger" onClick={onDelete}>Delete</button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
