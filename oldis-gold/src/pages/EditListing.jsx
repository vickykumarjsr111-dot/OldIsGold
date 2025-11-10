import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import useAuth from "../hooks/useauth";

const CATEGORIES = ["Mobiles", "Cars", "Bikes", "Home", "Electronics", "Others"];
const CONDITIONS = ["New", "Used"];

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, loading } = useAuth();

  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "listings", id));
        if (!snap.exists()) return setForm(null);
        setForm({ id: snap.id, ...snap.data() });
      } catch (e) {
        setErr(e.message || "Failed to load");
      }
    })();
  }, [id]);

  if (loading || !form) return <div className="page">{loading ? "Loading…" : "Not found"}</div>;
  if (!user || user.uid !== form.uid) {
    return (
      <div className="page">
        Not authorized. <Link to={`/listing/${id}`}>Go back</Link>
      </div>
    );
  }

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      setSaving(true);
      await updateDoc(doc(db, "listings", id), {
        title: form.title?.trim() || "",
        description: form.description || "",
        category: form.category || "Others",
        condition: form.condition || "Used",
        price: Number(form.price || 0),
        location: form.location || "",
        sellerName: form.sellerName || "",
        sellerWhatsapp: (form.sellerWhatsapp || "").replace(/\D/g, ""),
      });
      nav(`/listing/${id}`);
    } catch (e) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page" style={{ maxWidth: 800 }}>
      <h1>Edit Listing</h1>
      {err && <p className="error">{err}</p>}

      <form onSubmit={onSubmit} className="form">
        <label>Title
          <input name="title" value={form.title || ""} onChange={update} />
        </label>

        <label>Description
          <textarea name="description" rows={4} value={form.description || ""} onChange={update} />
        </label>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label>Price (₹)
            <input name="price" type="number" min="0" value={form.price || ""} onChange={update} />
          </label>

          <label>City
            <input name="location" value={form.location || ""} onChange={update} />
          </label>

          <label>Category
            <select name="category" value={form.category || "Others"} onChange={update}>
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>

          <label>Condition
            <select name="condition" value={form.condition || "Used"} onChange={update}>
              {CONDITIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label>Seller Name
            <input name="sellerName" value={form.sellerName || ""} onChange={update} />
          </label>
          <label>WhatsApp Number (digits only)
            <input name="sellerWhatsapp" value={form.sellerWhatsapp || ""} onChange={update} />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <Link className="btn" to={`/listing/${id}`}>Cancel</Link>
        </div>
      </form>

      <p className="muted" style={{ marginTop: 8 }}>Images aren’t edited here (to keep it simple).</p>
    </main>
  );
}
