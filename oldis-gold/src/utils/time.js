export function timeAgo(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : (typeof ts === "number" ? new Date(ts) : new Date(ts));
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  } catch { return ""; }
}
