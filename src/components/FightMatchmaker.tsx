import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, query, where, limit, getDocs, addDoc, 
  doc, onSnapshot, runTransaction, serverTimestamp, deleteDoc
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Search, Shield, Zap, X } from 'lucide-react';
import { getAnchorScenario } from '../services/scenarioManager';

interface FightMatchmakerProps {
  onMatchFound: (matchId: string, role: 'saboteur' | 'fixer') => void;
  onCancel: () => void;
}

type MatchmakingState = 'idle' | 'searching' | 'found';

export const FightMatchmaker: React.FC<FightMatchmakerProps> = ({ onMatchFound, onCancel }) => {
  const { user } = useAuth();
  const [state, setState] = useState<MatchmakingState>('idle');
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [role, setRole] = useState<'saboteur' | 'fixer' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // --- THE FIX: We use Refs to keep track of state for the cleanup function 
  // without triggering an accidental re-render cleanup loop. ---
  const stateRef = useRef(state);
  const matchIdRef = useRef(currentMatchId);

  useEffect(() => {
    stateRef.current = state;
    matchIdRef.current = currentMatchId;
  }, [state, currentMatchId]);

  const cleanup = async () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    
    // Only delete if we are actively searching and have an ID
    if (matchIdRef.current && stateRef.current === 'searching') {
      try {
        const matchRef = doc(db, 'matches', matchIdRef.current);
        await deleteDoc(matchRef);
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => cleanup();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanup();
    };
  }, []); // <-- EMPTY ARRAY: This ensures cleanup ONLY happens on unmount/refresh!

  const findOrCreateMatch = async () => {
    if (!user) return;
    
    setState('searching');
    setError(null);

    try {
      const matchesRef = collection(db, 'matches');
      // Look for anyone else waiting
      const q = query(matchesRef, where('status', '==', 'waiting'), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // --- JOIN EXISTING MATCH ---
        const matchDoc = querySnapshot.docs[0];
        const matchRef = doc(db, 'matches', matchDoc.id);

        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(matchRef);
          if (!sfDoc.exists() || sfDoc.data().status !== 'waiting') {
            throw new Error("Match unavailable!");
          }

          const data = sfDoc.data();
          const isP1Saboteur = Math.random() > 0.5;
          const saboteurId = isP1Saboteur ? data.player1Id : user.uid;
          const fixerId = isP1Saboteur ? user.uid : data.player1Id;

          transaction.update(matchRef, {
            player2Id: user.uid,
            status: 'active',
            saboteurId,
            fixerId,
            joinedAt: serverTimestamp(),
            // Player stats (Blitz Chess style)
            p1Stats: { wealth: 50, reputation: 50 },
            p2Stats: { wealth: 50, reputation: 50 },
            saboteurClock: 120,
            fixerClock: 120,
            currentTurn: 'saboteur',
            round: 1,
            currentScenario: null,
            saboteurChoice: null,
            fixerChoice: null,
            saboteurScenarioText: null,
            fixerScenarioText: null,
            resolving: false,
            gameOver: false,
            winnerId: null,
            // Branching story seed — both players' AI gets this context every round
            anchorScenario: getAnchorScenario(),
            matchHistory: [],
          });
        });

        listenToMatch(matchDoc.id);
      } else {
        // --- CREATE NEW MATCH ---
        const newMatch = await addDoc(matchesRef, {
          player1Id: user.uid,
          status: 'waiting',
          createdAt: serverTimestamp()
        });
        setCurrentMatchId(newMatch.id);
        listenToMatch(newMatch.id);
      }
    } catch (err: any) {
      console.error("Matchmaking error:", err);
      setError(err.message || "Failed to find match");
      setState('idle');
    }
  };

  const listenToMatch = (matchId: string) => {
    setCurrentMatchId(matchId);
    const matchRef = doc(db, 'matches', matchId);
    
    unsubscribeRef.current = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'active') {
          const assignedRole = data.saboteurId === user?.uid ? 'saboteur' : 'fixer';
          setRole(assignedRole);
          setState('found');
          
          setTimeout(() => {
            onMatchFound(matchId, assignedRole);
          }, 3000);
        }
      }
    });
  };

  const handleCancel = async () => {
    await cleanup();
    setState('idle');
    setCurrentMatchId(null);
    onCancel();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="flex flex-col items-center gap-8 z-10"
          >
            <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <Swords className="w-12 h-12 text-red-500" />
            </div>
            
            <div className="text-center">
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Battle Ready?</h2>
              <p className="text-zinc-500 font-medium">Asymmetric corporate warfare awaits.</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(239,68,68,0.4)" }}
              whileTap={{ scale: 0.95 }}
              animate={{ boxShadow: ["0 0 20px rgba(239,68,68,0.2)", "0 0 40px rgba(239,68,68,0.4)", "0 0 20px rgba(239,68,68,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={findOrCreateMatch}
              className="px-12 py-6 bg-red-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl text-xl border-t border-white/20 shadow-2xl"
            >
              Find Match
            </motion.button>

            {error && (
              <p className="text-red-400 text-sm font-bold bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}
          </motion.div>
        )}

        {state === 'searching' && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-12 z-10"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                className="absolute inset-0 bg-red-500 rounded-full"
              />
              <div className="w-32 h-32 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10 relative z-10 shadow-2xl">
                <Search className="w-12 h-12 text-red-500 animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-widest">Searching...</h2>
              <p className="text-zinc-500 text-sm font-bold animate-pulse">Locating high-value targets</p>
            </div>

            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/5 transition-all"
            >
              <X className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Cancel Search</span>
            </button>
          </motion.div>
        )}

        {state === 'found' && (
          <motion.div
            key="found"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-8 z-10"
          >
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 12 }}
              className="w-32 h-32 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]"
            >
              <Zap className="w-16 h-16 text-black" />
            </motion.div>

            <div className="text-center">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl font-black text-white uppercase tracking-tighter mb-4"
              >
                Match Found!
              </motion.h2>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-4"
              >
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Your Assigned Role:</p>
                <div className={`px-8 py-4 rounded-2xl border-2 flex items-center gap-3 ${
                  role === 'saboteur' 
                    ? 'bg-red-500/10 border-red-500 text-red-500' 
                    : 'bg-blue-500/10 border-blue-500 text-blue-500'
                }`}>
                  {role === 'saboteur' ? <Swords className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                  <span className="text-2xl font-black uppercase tracking-widest">{role}</span>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="w-64 h-1 bg-emerald-500 rounded-full mt-8"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};