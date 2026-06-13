import React, { useState } from 'react';
import { motion } from 'framer-motion';
// FIX: Using CDN imports to match services/firebase.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from '../services/firebase.js'; // Note the .js extension if using native ES modules
import { LockIcon, UserIcon, TrophyIcon, FireIcon } from './Icons';

const MotionDiv = motion.div as any;

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (val: string) => {
    if (val.length === 0) return "";
    if (val.length < 3) return "Username too short (min 3)";
    if (val.length > 15) return "Username too long (max 15)";
    const regex = /^[a-zA-Z0-9_.]+$/;
    if (!regex.test(val)) return "Only alphanumeric, _ and . allowed";
    return "";
  };

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameError(validateUsername(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin) {
      const uError = validateUsername(username);
      if (uError) {
        setUsernameError(uError);
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login Logic
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Signup Logic
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 2. CRITICAL: Create Database Entry Immediately
        await setDoc(doc(db, "users", userCredential.user.uid), {
          username: username,
          email: email,
          xp: 0,
          currentStreak: 0, 
          lastLessonDate: null,
          completedLessons: [],
          examFailureCount: 0,
          examUnlockTime: 0,
          createdAt: Date.now()
        });
      }
    } catch (err: any) {
        console.error("Auth Error:", err);
        let msg = "Something went wrong.";
        if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
        if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      
      <MotionDiv 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic">TMO</h1>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">The Money Olympics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Username</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-700" />
                        <input 
                            type="text" 
                            required
                            value={username}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            className={`w-full bg-black border ${usernameError ? 'border-red-500' : 'border-white/10'} text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors font-bold`}
                            placeholder="username"
                        />
                    </div>
                    {usernameError && (
                        <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-tighter">{usernameError}</p>
                    )}
                </div>
            )}
            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Email</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-700" />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        placeholder="future@billionaire.com"
                    />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                    <LockIcon className="absolute left-3 top-3 w-5 h-5 text-slate-700" />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {error && (
                <p className="text-red-500 text-[10px] font-black uppercase tracking-tighter bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {error}
                </p>
            )}

            <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 uppercase tracking-tighter"
            >
                {loading ? "Processing..." : isLogin ? "Enter Arena" : "Start Career"}
            </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
            >
                {isLogin ? "Need an account? Sign Up" : "Have an account? Login"}
            </button>
        </div>
      </MotionDiv>
      
      <div className="mt-8 flex gap-8 opacity-30">
         <div className="flex flex-col items-center gap-1">
             <TrophyIcon className="w-6 h-6 text-white" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compete</span>
         </div>
         <div className="flex flex-col items-center gap-1">
             <FireIcon className="w-6 h-6 text-white" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
         </div>
      </div>

    </div>
  );
};
