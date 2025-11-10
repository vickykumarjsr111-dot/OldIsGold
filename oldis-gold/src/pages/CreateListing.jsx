import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, storage, auth } from "../lib/firebase";
import "../styles/createListing.css";

const CATEGORIES = ["Mobiles", "Cars", "Bikes", "Home", "Electronics", "Others"];
const CONDITIONS = ["New", "Used"];

export default function CreateListing() {
  const nav = useNavigate();

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[1]);
  const [location, setLocation] = useState("");

  const [files, setFiles] = useState([]);       // File objects
  const [previews, setPreviews] = useState([]); // local blob urls
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, 5);
    setFiles(picked);
    setPreviews(picked.map((f) => URL.createObjectURL(f)));
  };

  const validate = () => {
    if (!title.trim()) return "Title is required";
    if (!price || Number(price) <= 0) return "Price must be greater than 0";
    if (!location.trim()) return "City/Location is required";
    if (files.length === 0) return "Please add at least one image";
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

      // current user (optional if you haven't built auth yet)
      const user = auth.currentUser;
      const sellerId = user ? user.uid : "guest";
      const sellerName = user?.displayName || "Guest";

      // 1) upload images
      const urls = await Promise.all(
        files.map(async (file, idx) => {
          const fileId = `${Date.now()}_${idx}_${file.name}`;
          const storageRef = ref(storage, `listings/${sellerId}/${fileId}`);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        })
      );

      // 2) save document
      const doc = {
        title: title.trim(),
        description: desc.trim(),
        price: Number(price),
        category,
        condition,
        location: location.trim(),
        images: urls,
        sellerId,
        sellerName,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "listings"), doc);

      // 3) navigate home
      nav("/");
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
                <option key={c} value={c}>
                  {c}
                </option>
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
                <option key={c} value={c}>
                  {c}
                </option>
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

        <div className="cl-row">
          <label>Photos (max 5)</label>
          <input
            className="cl-file"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
          />
          {previews.length > 0 && (
            <div className="cl-previews">
              {previews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`preview-${i}`}
                  className="cl-thumb"
                />
              ))}
            </div>
          )}
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
