import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track auth state (runs once)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Google login
  const googleLogin = async () => {
    return await signInWithPopup(auth, provider);
  };

  // Logout
  const logout = async () => {
    return await signOut(auth);
  };

  return { user, loading, googleLogin, logout };
}
