import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import useAuth from "../hooks/useAuth";
import { deleteListing } from "../services/listings";
import { timeAgo } from "../utils/time";

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
    <main className="page" style={{ maxWidth: 1000 }}>
      <Link to="/" className="btn" style={{ marginBottom: 12 }}>
        ← Back
      </Link>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 24,
        }}
      >
        {/* Gallery */}
        <section>
          <img
            key={sel}
            src={images[sel] || FALLBACK}
            alt={item.title}
            style={{
              width: "100%",
              height: 440,
              objectFit: "cover",
              borderRadius: 12,
            }}
            onError={(e) => (e.currentTarget.src = FALLBACK)}
          />

          {images.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              {images.map((u, i) => (
                <button
                  key={i}
                  onClick={() => setSel(i)}
                  style={{
                    border: i === sel ? "2px solid #111" : "1px solid #ddd",
                    borderRadius: 10,
                    padding: 0,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                  aria-label={`Preview image ${i + 1}`}
                >
                  <img
                    src={u}
                    alt={`img-${i}`}
                    width={96}
                    height={96}
                    style={{
                      width: 96,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 8,
                      display: "block",
                    }}
                    onError={(e) => (e.currentTarget.src = THUMB_FALLBACK)}
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Details */}
        <section>
          <h1 style={{ margin: "0 0 6px" }}>{item.title || "Untitled"}</h1>

          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
            {priceStr}
          </div>

          <div
            style={{
              color: "#555",
              marginBottom: 8,
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {item.category && <span>{item.category}</span>}
            {item.condition && <span>• {item.condition}</span>}
            {item.location && <span>• {item.location}</span>}
            {postedStr && <span>• {postedStr}</span>}
          </div>

          {item.description && (
            <p style={{ lineHeight: 1.6, marginTop: 12 }}>{item.description}</p>
          )}

          {/* Seller block + WhatsApp */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 10,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Seller</div>
            <div style={{ display: "grid", gap: 2 }}>
              <div>Name: {item.sellerName || "—"}</div>
              <div>WhatsApp: {item.sellerWhatsapp || "—"}</div>
            </div>

            {/* Show WhatsApp button ONLY if number exists */}
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
            <Link className="btn" to="/">
              Back
            </Link>

            {canEdit && (
              <>
                <Link className="btn" to={`/edit/${item.id}`}>
                  Edit
                </Link>
                <button className="btn danger" onClick={onDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
