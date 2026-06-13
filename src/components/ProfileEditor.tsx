import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from "firebase/firestore";
import { db } from '../services/firebase.js';
import { Link, useNavigate } from 'react-router-dom';
import { UserIcon, ChevronLeftIcon, SaveIcon } from './Icons';

export const ProfileEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateUsername = (val: string) => {
    if (val.length < 3) return "Username too short (min 3)";
    if (val.length > 15) return "Username too long (max 15)";
    const regex = /^[a-zA-Z0-9_.]+$/;
    if (!regex.test(val)) return "Only alphanumeric, _ and . allowed";
    return "";
  };

  const handleSave = async () => {
    if (!user) return;
    const uError = validateUsername(newUsername);
    if (uError) {
      setError(uError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        username: newUsername
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating username:", err);
      setError("Failed to update username.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-black transition-colors duration-300">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-white/5 p-8 rounded-3xl shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="p-2 rounded-full hover:bg-black transition-colors">
            <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
          </Link>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Profile Editor</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-black border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center text-emerald-500 font-black text-3xl mb-4">
            {newUsername.charAt(0).toUpperCase() || '?'}
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Current Identity</p>
          <p className="text-lg font-black text-white tracking-tight">@{user?.username}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">New Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-600" />
              <input 
                type="text" 
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full bg-black border border-white/10 text-white rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-colors font-bold"
                placeholder="new_username"
              />
            </div>
            {error && <p className="text-red-500 text-[10px] mt-1 font-black uppercase tracking-tighter">{error}</p>}
            {success && <p className="text-emerald-500 text-[10px] mt-1 font-black uppercase tracking-tighter">Username updated!</p>}
          </div>

          <button 
            onClick={handleSave}
            disabled={loading || newUsername === user?.username}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-tighter"
          >
            {loading ? "Saving..." : (
              <>
                <SaveIcon className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-black text-slate-500 font-black rounded-xl transition-all hover:bg-white hover:text-black border border-white/5 uppercase tracking-tighter"
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
