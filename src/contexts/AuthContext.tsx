import React, { createContext, useContext, useEffect, useState } from 'react';
// FIX: Using CDN imports to match services/firebase.ts
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';

// Define the shape of your User Data
interface UserData {
  uid: string;
  email: string | null;
  username: string;
  xp: number;
  currentStreak: number;
  lastLessonDate: string | null;
  completedLessons: string[];
  examFailureCount: number;
  examUnlockTime: number;
  badges: string[];
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for Auth Changes (Login/Logout)
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser: any) => {
      if (firebaseUser) {
        // 2. If Logged In, Listen to Firestore Data
        const userRef = doc(db, 'users', firebaseUser.uid);

        const unsubscribeSnapshot = onSnapshot(
          userRef,
          (docSnap: any) => {
            if (docSnap.exists()) {
              // Merge Auth ID with Firestore Data
              setUser({
                uid: firebaseUser.uid,
                ...docSnap.data(),
              } as UserData);
            } else {
              // Document missing — auto-create it so all future writes succeed
              console.log('User document missing — auto-creating with defaults.');
              const defaultData = {
                email: firebaseUser.email,
                username: firebaseUser.email?.split('@')[0] || 'User',
                xp: 0,
                currentStreak: 0,
                lastLessonDate: null,
                completedLessons: [],
                examFailureCount: 0,
                examUnlockTime: 0,
                badges: [],
                createdAt: Date.now(),
              };
              setDoc(userRef, defaultData).catch(console.error);
              setUser({ uid: firebaseUser.uid, ...defaultData } as UserData);
            }
            setLoading(false);
          },
          (error: any) => {
            console.error('Firestore Error:', error);
            setLoading(false);
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        // Logged Out
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
