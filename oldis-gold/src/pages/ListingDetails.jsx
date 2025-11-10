import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import useAuth from "../hooks/useauth";          // ✅ fixed
import { deleteListing } from "../services/listings";
import { timeAgo } from "../utils/time";
import "../styles/listingdetails.css";

const FALLBACK = "https://picsum.photos/800?blur=2";
const THUMB_FALLBACK = "https://picsum.photos/200?blur=2";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/* WhatsApp link */
function toWhatsAppLink(rawNumber, message = "") {
  if (!rawNumber) return null;
  const digits = String(rawNumber).replace(/\D/g, "");
  const withCC = digits.startsWith("91") ? digits : `91${digits}`;
  const text = encodeURIComponent(message || "");
  return `https://wa.me/${withCC}${text ? `?text=${text}` : ""}`;
}

/* --- Lightweight carousel (no libs) --- */
function ImageCarousel({ images = [], alt = "" }) {
  const [i, setI] = useState(0);
  const n = images.length || 1;
  const list = n ? images : [FALLBACK];

  const go = (d) => setI((p) => (p + d + n) % n);
  const jump = (idx) => setI(idx);

  // swipe
  const [startX, setStartX] = useState(null);
  const onDown = (e) => setStartX(e.clientX ?? e.touches?.[0]?.clientX);
  const onUp = (e) => {
    if (startX == null) return;
    const x = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const dx = x - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    setStartX(null);
  };

  return (
    <div className="car-wrap" tabIndex={0} onKeyDown={(e)=>{ if(e.key==="ArrowLeft") go(-1); if(e.key==="ArrowRight") go(1); }}>
      <div
        className="car-stage"
        onMouseDown={onDown}
        onMouseUp={onUp}
        onTouchStart={onDown}
        onTouchEnd={onUp}
      >
        <img
          key={i}
          src={list[i] || FALLBACK}
          alt={alt}
          onError={(e)=> (e.currentTarget.src = FALLBACK)}
        />
        {n > 1 && (
          <>
            <button className="car-arrow left" onClick={()=>go(-1)} aria-label="Previous">‹</button>
            <button className="car-arrow right" onClick={()=>go(1)} aria-label="Next">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <>
          <div className="car-dots">
            {list.map((_, idx) => (
              <button
                key={idx}
                className={`car-dot ${idx === i ? "active" : ""}`}
                onClick={()=>jump(idx)}
                aria-label={`Image ${idx+1}`}
              />
            ))}
          </div>

          <div className="car-thumbs">
            {list.map((u, idx) => (
              <button
                key={idx}
                className={`car-thumb ${idx === i ? "active" : ""}`}
                onClick={()=>jump(idx)}
                aria-label={`Thumbnail ${idx+1}`}
              >
                <img src={u} alt={`thumb-${idx}`} onError={(e)=> (e.currentTarget.src = THUMB_FALLBACK)} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ListingDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "listings", id));
        setItem(snap.exists() ? { id: snap.id, ...snap.data() } : null);
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
  if (!item) return <div className="page">Listing not found. <Link to="/">Go home</Link></div>;

  const priceStr = Number.isFinite(Number(item.price)) ? INR.format(Number(item.price)) : "—";
  const postedStr = item.createdAt ? `Posted ${timeAgo(item.createdAt)}` : "";
  const waMessage = `Hi, I'm interested in your "${item.title}".`;
  const waLink = toWhatsAppLink(item.sellerWhatsapp, waMessage);

  return (
    <main className="page" style={{ maxWidth: 1100 }}>
      <Link to="/" className="btn" style={{ marginBottom: 12 }}>← Back</Link>

      <div className="ld-grid">
        {/* Gallery as carousel */}
        <section>
          <ImageCarousel images={images} alt={item.title} />
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

          <div className="ld-seller">
            <div className="ld-seller-title">Seller</div>
            <div className="ld-seller-grid">
              <div><b>Name:</b> {item.sellerName || "—"}</div>
              <div><b>WhatsApp:</b> {item.sellerWhatsapp || "—"}</div>
            </div>

            {waLink && (
              <a className="btn primary" style={{ marginTop: 10, display: "inline-block" }} href={waLink} target="_blank" rel="noreferrer">
                Contact on WhatsApp
              </a>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Link className="btn" to="/">Back</Link>
            {canEdit && (
              <>
                <Link className="btn" to={`/edit/${item.id}`}>Edit</Link>
                <button className="btn danger" onClick={async ()=>{
                  if (!confirm("Delete this listing?")) return;
                  try { await deleteListing(item); nav("/"); } catch (e) { alert(e?.message || "Failed to delete"); }
                }}>Delete</button>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
