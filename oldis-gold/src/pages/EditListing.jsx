import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import useAuth from "../hooks/useAuth";
import "../styles/editlisting.css";

const CATEGORIES = ["Mobiles", "Cars", "Bikes", "Home", "Electronics", "Others"];
const CONDITIONS = ["New", "Used"];

const onlyDigits = (v) => String(v || "").replace(/\D/g, "");
const parseUrls = (s) =>
  String(s || "")
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 10);

export default function EditListing() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, loading } = useAuth();

  const [form, setForm] = useState(null);
  const [urlsText, setUrlsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "listings", id));
        if (!snap.exists()) return setForm(null);
        const d = { id: snap.id, ...snap.data() };
        setForm({
          uid: d.uid,
          title: d.title || "",
          description: d.description || "",
          price: d.price ?? "",
          category: d.category || "Others",
          condition: d.condition || "Used",
          location: d.location || "",
          sellerName: d.sellerName || "",
          sellerWhatsapp: d.sellerWhatsapp || "",
        });
        setUrlsText((Array.isArray(d.images) ? d.images : []).join("\n"));
      } catch (e) {
        setErr(e.message || "Failed to load.");
      }
    })();
  }, [id]);

  const previews = useMemo(() => parseUrls(urlsText), [urlsText]);

  if (loading) return <div className="page">Loading…</div>;
  if (form === null) return <div className="page">Listing not found. <Link to="/">Home</Link></div>;
  if (!user || user.uid !== form.uid)
    return <div className="page">Not authorized. <Link to={`/listing/${id}`}>Back</Link></div>;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.title.trim()) return "Title is required";
    const p = Number(form.price);
    if (!Number.isFinite(p) || p <= 0) return "Enter a valid price";
    if (!form.location.trim()) return "City/Location is required";
    if (previews.length === 0) return "Add at least one image URL";
    const phone = onlyDigits(form.sellerWhatsapp);
    if (phone && (phone.length < 10 || phone.length > 13)) return "Invalid WhatsApp number";
    return "";
  };

  const removePreview = (u) => setUrlsText(previews.filter((x) => x !== u).join("\n"));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    const v = validate();
    if (v) return setErr(v);
    try {
      setSaving(true);
      await updateDoc(doc(db, "listings", id), {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        condition: form.condition,
        location: form.location.trim(),
        images: previews,
        sellerName: form.sellerName.trim(),
        sellerWhatsapp: onlyDigits(form.sellerWhatsapp),
      });
      setMsg("Saved!");
      setTimeout(() => nav(`/listing/${id}`), 500);
    } catch (e) {
      setErr(e.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="page el-wrap">
      <h1 className="el-title">Edit Listing</h1>
      {err && <div className="el-alert error">{err}</div>}
      {msg && <div className="el-alert ok">{msg}</div>}

      <form className="el-form" onSubmit={onSubmit}>
        <label>Title
          <input name="title" value={form.title} onChange={update} />
        </label>

        <label>Description
          <textarea rows={4} name="description" value={form.description} onChange={update} />
        </label>

        <div className="el-grid">
          <label>Price (₹)
            <input type="number" min="0" name="price" value={form.price} onChange={update} />
          </label>
          <label>City
            <input name="location" value={form.location} onChange={update} />
          </label>
          <label>Category
            <select name="category" value={form.category} onChange={update}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Condition
            <select name="condition" value={form.condition} onChange={update}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <div className="el-grid">
          <label>Seller Name
            <input name="sellerName" value={form.sellerName} onChange={update} />
          </label>
          <label>WhatsApp (digits only)
            <input name="sellerWhatsapp" value={form.sellerWhatsapp} onChange={update} />
          </label>
        </div>

        <label>Image URLs (comma or new line; max 10)
          <textarea rows={3} value={urlsText} onChange={(e) => setUrlsText(e.target.value)} />
          <small className="muted">Tip: direct .jpg/.png links; Cloudinary / ImgBB work well.</small>
        </label>

        {previews.length > 0 && (
          <div className="el-previews">
            {previews.map((u, i) => (
              <div className="el-thumb" key={i}>
                <img src={u} alt={`preview-${i}`} onError={(e)=> (e.currentTarget.style.opacity=.3)} />
                <button type="button" className="el-x" onClick={() => removePreview(u)} aria-label="remove">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="el-actions">
          <button className="btn primary" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
          <Link className="btn" to={`/listing/${id}`}>Cancel</Link>
        </div>
      </form>
    </main>
  );
}
