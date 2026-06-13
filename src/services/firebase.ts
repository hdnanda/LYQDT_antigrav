// USE EXACTLY THESE IMPORTS (CDN)
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// NO process.env. Just the raw keys.
const firebaseConfig = {
  apiKey: "AIzaSyCxYDfmEFyEtEWYVMTuGgG-kBDqokBdTWw",
  authDomain: "themoneyolympics-92fe9.firebaseapp.com",
  projectId: "themoneyolympics-92fe9",
  storageBucket: "themoneyolympics-92fe9.firebasestorage.app",
  messagingSenderId: "985819651022",
  appId: "1:985819651022:web:5b5d27936aa63c2a6ba99f",
  measurementId: "G-ZT2JC6Q6H2"
};

// Singleton Logic (Prevents double-loading)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;