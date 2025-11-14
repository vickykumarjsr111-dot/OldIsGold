// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,        // <-- ADDED
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

/**
 * Make sure these env vars exist locally (.env) and in Vercel:
 * VITE_FIREBASE_API_KEY
 * VITE_FIREBASE_AUTH_DOMAIN
 * VITE_FIREBASE_PROJECT_ID
 * VITE_FIREBASE_STORAGE_BUCKET
 * VITE_FIREBASE_MESSAGING_SENDER_ID
 * VITE_FIREBASE_APP_ID
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Google provider (export so other files can use it)
export const googleProvider = new GoogleAuthProvider();
// optional: force account selection on popup
// googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Small helpers you can import where needed:
 * - signInWithGooglePopup(): use popup sign-in
 * - signInWithGoogleRedirect(): optional redirect-based sign-in
 * - finishRedirectSignIn(): call on app mount to finish redirect flow
 *
 * I export them so your Login page can just call signInWithGooglePopup()
 */
export async function signInWithGooglePopup() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithGoogleRedirect() {
  return signInWithRedirect(auth, googleProvider);
}

/* ===========================
   ADDITION: finish redirect helper
   Call this on app / login page mount to complete redirect sign-in.
   Returns the redirect result (or null) and throws if Firebase throws.
   =========================== */
export async function finishRedirectSignIn() {
  // getRedirectResult resolves when redirected back to your app after a redirect sign-in
  // If no redirect result exists it returns null (no user)
  return getRedirectResult(auth);
}

// Firestore (with local persistent cache)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// Storage
export const storage = getStorage(app);

export default app;
