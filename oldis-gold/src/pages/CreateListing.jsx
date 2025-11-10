import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import "../styles/createListing.css";

const CATEGORIES = ["Mobiles", "Cars", "Bikes", "Home", "Electronics", "Others"];
const CONDITIONS = ["New", "Used"];

// Keep only digits (handy for WhatsApp field)
const digitsOnly = (v) => String(v || "").replace(/\D/g, "");

// Split comma/newline separated URLs and sanitize
const parseUrls = (str) =>
  String(str || "")
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10); // max 10

export default function CreateListing() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [location, setLocation] = useState("");

  // Seller info
  const [sellerName, setSellerName] = useState("");
  const [sellerWhatsapp, setSellerWhatsapp] = useState("");

  // NEW: image URLs instead of file uploads
  const [imageUrls, setImageUrls] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prefill name from auth (if available)
  useEffect(() => {
    const u = auth.currentUser;
    if (u?.displayName && !sellerName) setSellerName(u.displayName);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    if (!title.trim()) return "Title is required";
    if (!price || Number(price) <= 0) return "Price must be greater than 0";
    if (!location.trim()) return "City/Location is required";

    const urls = parseUrls(imageUrls);
    if (urls.length === 0) return "Please add at least one image URL";

    const phone = digitsOnly(sellerWhatsapp);
    if (!phone) return "WhatsApp number is required";
    if (phone.length < 10 || phone.length > 13) return "Enter a valid WhatsApp number";

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    try {
      setSubmitting(true);

      const user = auth.currentUser;
      const sellerId = user ? user.uid : "guest";
      const finalSellerName = sellerName?.trim() || user?.displayName || "Guest";

      // No uploads — just parsed URLs
      const urls = parseUrls(imageUrls);

      const docData = {
        title: title.trim(),
        description: desc.trim(),
        price: Number(price),
        category,
        condition,
        location: location.trim(),
        images: urls,                // ← saved as plain URLs
        uid: sellerId,
        sellerName: finalSellerName,
        sellerWhatsapp: digitsOnly(sellerWhatsapp),
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "listings"), docData);
      nav(`/listing/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to create listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="cl-container">
      <h2 className="cl-title">Post an Ad</h2>

      <form className="cl-form" onSubmit={onSubmit}>
        {error && <div className="cl-error">{error}</div>}

        <div className="cl-row">
          <label>Title</label>
          <input
            className="cl-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., iPhone 12, Honda Activa…"
          />
        </div>

        <div className="cl-row">
          <label>Description</label>
          <textarea
            className="cl-textarea"
            rows={4}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Add key details, condition, reason for selling…"
          />
        </div>

        <div className="cl-grid">
          <div className="cl-row">
            <label>Price (₹)</label>
            <input
              className="cl-input"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="₹"
            />
          </div>

          <div className="cl-row">
            <label>Category</label>
            <select
              className="cl-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="cl-row">
            <label>Condition</label>
            <select
              className="cl-select"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="cl-row">
            <label>City</label>
            <input
              className="cl-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City"
            />
          </div>
        </div>

        {/* Seller info */}
        <div className="cl-grid">
          <div className="cl-row">
            <label>Seller Name</label>
            <input
              className="cl-input"
              type="text"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="cl-row">
            <label>WhatsApp Number (without +)</label>
            <input
              className="cl-input"
              type="tel"
              value={sellerWhatsapp}
              onChange={(e) => setSellerWhatsapp(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>

        {/* NEW: URLs instead of file uploads */}
        <div className="cl-row">
          <label>Image URLs (comma or new line; max 10)</label>
          <textarea
            className="cl-textarea"
            rows={3}
            value={imageUrls}
            onChange={(e) => setImageUrls(e.target.value)}
            placeholder={`https://.../photo1.jpg\nhttps://.../photo2.jpg`}
          />
          <small style={{ color: "#666" }}>
            Tip: paste direct image links (.jpg/.png).
          </small>
        </div>

        <div className="cl-actions">
          <button className="cl-btn" type="submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post Ad"}
          </button>
        </div>
      </form>
    </main>
  );
}
