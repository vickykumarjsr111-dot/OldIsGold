import { db, storage } from "../lib/firebase";
import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot,
  orderBy, limit, query, serverTimestamp, updateDoc, where
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from "firebase/storage";

export async function uploadImages(uid, files = [], onProgress) {
  const urls = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = `listings/${uid}/${Date.now()}_${i}_${file.name}`;
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);
    await new Promise((resolve, reject) => {
      task.on("state_changed",
        (snap) => onProgress?.({ index: i, pct: Math.round((snap.bytesTransferred / snap.totalBytes) * 100) }),
        reject,
        async () => { urls.push(await getDownloadURL(task.snapshot.ref)); resolve(); }
      );
    });
  }
  return urls;
}

export async function createListing(data) {
  const docRef = await addDoc(collection(db, "listings"), {
    ...data,
    titleLower: (data.title || "").toLowerCase(),
    price: Number(data.price || 0),
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export function listenLatestListings({ pageSize = 24 } = {}, cb) {
  const q = query(collection(db, "listings"), orderBy("createdAt", "desc"), limit(pageSize));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function listenMyListings(uid, cb) {
  const q = query(collection(db, "listings"), where("uid", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export async function getListingById(id) {
  const snap = await getDoc(doc(db, "listings", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateListing(id, patch) {
  await updateDoc(doc(db, "listings", id), patch);
}

export async function deleteListing(listing) {
  const tasks = (listing.images || []).map(async (url) => {
    try {
      const path = decodeURIComponent(url.split("/o/")[1]?.split("?")[0] || "");
      if (path) await deleteObject(ref(storage, path));
    } catch {}
  });
  await Promise.allSettled(tasks);
  await deleteDoc(doc(db, "listings", listing.id));
}
