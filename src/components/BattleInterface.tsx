import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Swords,
  X,
  RefreshCcw,
  Home,
  ChevronRight,
  Lock,
  Timer,
  Skull,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  generateBattleScenario,
  type BattleScenario,
} from '../services/scenarioManager';
import { Header } from './Header';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// --- Types ---
interface ScenarioOption {
  text: string;
  winChance: number;
  winWealth: number;
  winReputation: number;
  lossWealth: number;
  lossReputation: number;
  winMessage: string;
  lossMessage: string;
  riskLevel: 'Safe' | 'Moderate' | 'High Risk';
}

interface Scenario {
  scenario: string;
  options: [ScenarioOption, ScenarioOption];
}

interface BattleInterfaceProps {
  gameMode: 'RANKED' | 'CASUAL';
  onBack: () => void;
  matchId?: string;
  role?: 'saboteur' | 'fixer';
}

const MAX_ROUNDS = 5;
const TURN_TIMER_DURATION = 15;
const BLEED_DAMAGE_PER_SEC = 2; // 2% Wealth lost per second in Sudden Death

export const BattleInterface: React.FC<BattleInterfaceProps> = ({
  gameMode,
  onBack,
  matchId,
}) => {
  const { user } = useAuth();
  
  // Base State
  const [matchData, setMatchData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [gameOver, setGameOver] = useState<'VICTORY' | 'DEFEAT' | null>(null);
  
  const [opponentName, setOpponentName] = useState('Unknown Target');
  const [statFlash, setStatFlash] = useState<'green' | 'red' | null>(null);

  // Timers & Mechanics
  const [turnTimeLeft, setTurnTimeLeft] = useState(TURN_TIMER_DURATION);
  const [myGlobalClock, setMyGlobalClock] = useState(120);
  const [oppGlobalClock, setOppGlobalClock] = useState(120);
  const [inSuddenDeath, setInSuddenDeath] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentScenarioRef = useRef<string | null>(null);

  // Derived Roles & Turn State
  const myRole = user?.uid === matchData?.saboteurId ? 'saboteur' : 'fixer';
  const oppRole = myRole === 'saboteur' ? 'fixer' : 'saboteur';
  const isMyTurn = matchData?.currentTurn === myRole;
  
  const myStats = myRole === 'saboteur' ? matchData?.p1Stats : matchData?.p2Stats;
  const oppStats = myRole === 'saboteur' ? matchData?.p2Stats : matchData?.p1Stats;

  // --- 1. FIREBASE SYNC & STATE MACHINE ---
  useEffect(() => {
    if (!matchId || !user) return;
    const matchRef = doc(db, 'matches', matchId);

    const unsubscribe = onSnapshot(matchRef, async (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setMatchData(data);

      // Opponent Name Fetch
      const oppId = myRole === 'saboteur' ? data.fixerId : data.saboteurId;
      if (oppId && opponentName === 'Unknown Target') {
        const oppSnap = await getDoc(doc(db, 'users', oppId));
        if (oppSnap.exists()) setOpponentName(oppSnap.data().username || 'Enemy Broker');
      }

      // Sync Clocks from Firebase to fix drift between rounds
      setMyGlobalClock(myRole === 'saboteur' ? data.saboteurClock : data.fixerClock);
      setOppGlobalClock(myRole === 'saboteur' ? data.fixerClock : data.saboteurClock);

      // Game Over Check
      if (data.gameOver) {
        setGameOver(data.winnerId === user.uid ? 'VICTORY' : 'DEFEAT');
        return;
      }

      // Render the current table scenario locally
      if (data.currentScenario) {
        const scenarioKey = `${data.round}-${data.currentTurn}-${data.currentScenario.scenario}`;
        if (currentScenarioRef.current !== scenarioKey) {
          setScenario(data.currentScenario);
          currentScenarioRef.current = scenarioKey;
          setTurnTimeLeft(TURN_TIMER_DURATION);
          setLoading(false);
        }
      } else {
        setLoading(true);
      }

      // --- DEALER LOGIC: The Active Player Generates their own Scenario ---
      const amIActive = data.currentTurn === myRole;
      const needScenario = !data.currentScenario && !data.resolving;
      const hasMyChoice = myRole === 'saboteur' ? data.saboteurChoice : data.fixerChoice;

      if (amIActive && needScenario && !hasMyChoice) {
        setLoading(true);
        // If Fixer, we pass the Saboteur's attack text so the AI can react to it
        const prevAttack = myRole === 'fixer' && data.saboteurChoice ? data.saboteurChoice.text : null;
        generateAndSyncScenario(matchRef, myRole, prevAttack);
      }

      // --- RESOLUTION LOGIC: Fixer triggers the clash after defending ---
      if (data.saboteurChoice && data.fixerChoice && !data.resolving && myRole === 'fixer') {
        resolveCombat(matchRef, data);
      }
    });

    return () => unsubscribe();
  }, [matchId, user, myRole]);

  // --- 2. THE AI DEALER ---
  const generateAndSyncScenario = async (matchRef: any, role: 'saboteur' | 'fixer', prevAttack: string | null) => {
    try {
      const aiData = await generateBattleScenario(role, prevAttack);
      const adaptedScenario: Scenario = {
        scenario: aiData.scenario,
        options: aiData.choices.map((c) => ({
          text: c.text,
          winChance: c.winChance ?? (c.riskLevel === 'Safe' ? 1.0 : 0.5),
          winWealth: c.statImpact.wealth,
          winReputation: c.statImpact.reputation,
          lossWealth: Math.round(c.statImpact.wealth * 1.5), 
          lossReputation: Math.round(c.statImpact.reputation * 1.5),
          winMessage: c.winMessage ?? 'Success!',
          lossMessage: c.lossMessage ?? 'Failure.',
          riskLevel: c.riskLevel as any,
        })) as [ScenarioOption, ScenarioOption],
      };
      await updateDoc(matchRef, { currentScenario: adaptedScenario });
    } catch (error) {
      console.error('Scenario Gen Failed', error);
    }
  };

  // --- 3. THE CLOCKS & SUDDEN DEATH BLEED ---
  useEffect(() => {
    if (!isMyTurn || loading || gameOver || !scenario) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTurnTimeLeft((prev) => {
        if (prev <= 0) {
          handleChoice(scenario.options[0]); // Force auto-pick Safe option if 15s expires
          return 0;
        }
        return prev - 0.1;
      });

      setMyGlobalClock((prev) => {
        const next = prev - 0.1;
        if (next <= 0) setInSuddenDeath(true);
        return next;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, loading, gameOver, scenario]);

  // --- 4. LOCK IN A MOVE ---
  const handleChoice = async (option: ScenarioOption) => {
    if (!matchId || !matchData) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const matchRef = doc(db, 'matches', matchId);
    
    // Calculate Sudden Death Bleed Damage
    let bleedDamage = 0;
    if (myGlobalClock <= 0) {
      const secondsOver = Math.abs(myGlobalClock);
      bleedDamage = Math.floor(secondsOver * BLEED_DAMAGE_PER_SEC);
      setStatFlash('red');
    }

    const clockKey = myRole === 'saboteur' ? 'saboteurClock' : 'fixerClock';
    const choiceKey = myRole === 'saboteur' ? 'saboteurChoice' : 'fixerChoice';
    const statsKey = myRole === 'saboteur' ? 'p1Stats' : 'p2Stats';

    // Apply bleed immediately to local state for visual feedback
    const updatedWealth = Math.max(0, myStats.wealth - bleedDamage);

    const updates: any = {
      [clockKey]: myGlobalClock,
      [choiceKey]: option,
      [statsKey]: { ...myStats, wealth: updatedWealth },
    };

    // If Saboteur moves, hand turn to Fixer. If Fixer moves, trigger resolution
    if (myRole === 'saboteur') {
      updates.currentTurn = 'fixer';
      updates.currentScenario = null; // Clear table for Fixer's AI
    }
    
    await updateDoc(matchRef, updates);
  };

  // --- 5. THE CLASH (Fixer's Client calculates this) ---
  const resolveCombat = async (matchRef: any, data: any) => {
    await updateDoc(matchRef, { resolving: true });

    // 1. Roll for Saboteur Attack Power
    const sWin = Math.random() <= (data.saboteurChoice.winChance || 0.5);
    const sWPull = sWin ? data.saboteurChoice.winWealth : -Math.abs(data.saboteurChoice.lossWealth);
    const sRPull = sWin ? data.saboteurChoice.winReputation : -Math.abs(data.saboteurChoice.lossReputation);

    // 2. Roll for Fixer Defense Power
    const fWin = Math.random() <= (data.fixerChoice.winChance || 0.5);
    const fWPull = fWin ? data.fixerChoice.winWealth : -Math.abs(data.fixerChoice.lossWealth);
    const fRPull = fWin ? data.fixerChoice.winReputation : -Math.abs(data.fixerChoice.lossReputation);

    // 3. Tug of War Net Math (Fixer negates Saboteur)
    const wealthNet = sWPull - fWPull; 
    const repNet = sRPull - fRPull;

    let sW_Dmg = 0; let fW_Dmg = 0;
    let sR_Dmg = 0; let fR_Dmg = 0;

    if (wealthNet > 0) fW_Dmg = -wealthNet; // Saboteur overpowered Defense
    else if (wealthNet < 0) sW_Dmg = wealthNet; // Defense overpowered Saboteur

    if (repNet > 0) fR_Dmg = -repNet;
    else if (repNet < 0) sR_Dmg = repNet;

    const newSStats = {
      wealth: Math.max(0, Math.min(100, data.p1Stats.wealth + sW_Dmg)),
      reputation: Math.max(0, Math.min(100, data.p1Stats.reputation + sR_Dmg))
    };
    
    const newFStats = {
      wealth: Math.max(0, Math.min(100, data.p2Stats.wealth + fW_Dmg)),
      reputation: Math.max(0, Math.min(100, data.p2Stats.reputation + fR_Dmg))
    };

    let isGameOver = false;
    let winnerId = null;

    if (newSStats.wealth <= 0 || newSStats.reputation <= 0) { isGameOver = true; winnerId = data.fixerId; }
    else if (newFStats.wealth <= 0 || newFStats.reputation <= 0) { isGameOver = true; winnerId = data.saboteurId; }
    else if (data.round >= MAX_ROUNDS) {
      isGameOver = true;
      const sAvg = (newSStats.wealth + newSStats.reputation) / 2;
      const fAvg = (newFStats.wealth + newFStats.reputation) / 2;
      winnerId = sAvg >= fAvg ? data.saboteurId : data.fixerId;
    }

    if (isGameOver) {
      await updateDoc(matchRef, { p1Stats: newSStats, p2Stats: newFStats, gameOver: true, winnerId });
    } else {
      await updateDoc(matchRef, {
        p1Stats: newSStats, p2Stats: newFStats,
        saboteurChoice: null, fixerChoice: null,
        currentScenario: null,
        currentTurn: 'saboteur',
        round: data.round + 1,
        resolving: false,
      });
    }
  };

  // --- VISUAL FORMATTERS ---
  const formatClock = (seconds: number) => {
    const m = Math.max(0, Math.floor(seconds / 60));
    const s = Math.max(0, Math.floor(seconds % 60));
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = () => {
    if (turnTimeLeft > 7) return 'text-white';
    if (turnTimeLeft > 3) return 'text-orange-500';
    return 'text-red-500 animate-pulse font-bold';
  };

  return (
    <motion.div 
      animate={inSuddenDeath ? { boxShadow: ['inset 0 0 0px rgba(220,38,38,0)', 'inset 0 0 80px rgba(220,38,38,0.4)', 'inset 0 0 0px rgba(220,38,38,0)'] } : {}}
      transition={inSuddenDeath ? { duration: 1.5, repeat: Infinity } : {}}
      className="fixed inset-0 z-50 bg-black text-white flex flex-col font-inter overflow-hidden"
    >
      {/* Universal Header with Blitz Clocks */}
      <div className="px-6 pt-4 shrink-0 flex justify-between items-center border-b border-white/5 pb-4">
        <div className="flex flex-col">
           <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Fixer Time</span>
           <span className={`font-mono text-xl ${myRole === 'fixer' && myGlobalClock <= 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
             {formatClock(myRole === 'fixer' ? myGlobalClock : oppGlobalClock)}
           </span>
        </div>
        <div className="flex flex-col items-center">
           <span className="font-black uppercase tracking-widest text-white text-lg">Round {matchData?.round || 1}</span>
           {inSuddenDeath && <span className="text-xs text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 animate-pulse"><Skull className="w-3 h-3"/> Sudden Death</span>}
        </div>
        <div className="flex flex-col items-end">
           <span className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1">Saboteur Time <Swords className="w-3 h-3"/></span>
           <span className={`font-mono text-xl ${myRole === 'saboteur' && myGlobalClock <= 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
             {formatClock(myRole === 'saboteur' ? myGlobalClock : oppGlobalClock)}
           </span>
        </div>
      </div>

      {/* --- TOP 50%: THE ARENA STATS --- */}
      <div className="relative h-[50%] w-full p-6 flex flex-col justify-center gap-8">
            {/* Opponent Block */}
            <div className={`flex w-full justify-end`}>
              <div className="bg-slate-900 border border-white/5 rounded-xl p-4 w-72 shadow-2xl relative">
                {matchData?.currentTurn === oppRole && (
                  <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <Timer className="w-4 h-4 text-black" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-white/10">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white uppercase tracking-wide">{opponentName}</span>
                    <span className="text-[10px] font-black uppercase text-slate-500">{oppRole}</span>
                  </div>
                </div>
                <div className="space-y-3 relative p-2 rounded-lg bg-black/50 border border-white/5">
                   {/* Hidden Stats Blur */}
                  <div className="absolute inset-0 backdrop-blur-[4px] bg-black/60 z-10 flex items-center justify-center rounded-lg border border-red-500/20">
                    <span className="text-xs font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Stats Hidden
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full"><div className="h-full bg-emerald-500/50 w-[70%]" /></div>
                  <div className="h-2 bg-slate-800 rounded-full"><div className="h-full bg-orange-500/50 w-[40%]" /></div>
                </div>
              </div>
            </div>

            {/* Player Block */}
            <div className={`flex w-full justify-start`}>
              <motion.div
                animate={statFlash === 'red' ? { x: [-5, 5, -5, 5, 0] } : {}}
                className={`bg-slate-900 border border-white/5 rounded-xl p-4 w-72 shadow-2xl relative transition-colors duration-300 ${
                  statFlash === 'red' ? 'bg-red-950/50 border-red-500/50' : ''
                }`}
              >
                {matchData?.currentTurn === myRole && (
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                    <Timer className="w-4 h-4 text-black" />
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center border border-white/10">
                    <User className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white uppercase tracking-wide">{user?.username || 'You'}</span>
                    <span className={`text-[10px] font-black uppercase ${myRole === 'saboteur' ? 'text-red-500' : 'text-emerald-500'}`}>{myRole}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-500 uppercase text-[10px]">Wealth</span><span className="font-black text-emerald-500">{Math.round(myStats?.wealth || 50)}%</span></div>
                    <div className="h-2 bg-black rounded-full overflow-hidden"><motion.div animate={{ width: `${myStats?.wealth || 50}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" /></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm"><span className="font-medium text-slate-500 uppercase text-[10px]">Reputation</span><span className="font-black text-orange-500">{Math.round(myStats?.reputation || 50)}%</span></div>
                    <div className="h-2 bg-black rounded-full overflow-hidden"><motion.div animate={{ width: `${myStats?.reputation || 50}%` }} className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]" /></div>
                  </div>
                </div>
              </motion.div>
            </div>
      </div>

      {/* --- BOTTOM 50%: BLITZ MENU & DIALOG --- */}
      <div className="relative h-[50%] w-full bg-black border-t border-white/5 p-4 flex flex-col z-20">
        
        {/* NOT MY TURN - LOCK SCREEN */}
        <AnimatePresence>
          {!isMyTurn && !loading && (
             <motion.div
             initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
             animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
             exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
             className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center p-6 text-center"
           >
             <Lock className="w-12 h-12 text-slate-600 mb-4" />
             <h2 className="text-xl font-black text-white uppercase tracking-widest">
               {matchData?.resolving ? 'Calculating Impact...' : 'Opponent is thinking'}
             </h2>
             <p className="text-emerald-500 font-bold text-xs mt-2 uppercase tracking-widest">
               {matchData?.resolving ? 'Resolving Clash' : `Waiting for ${oppRole} move`}
             </p>
           </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING AI */}
        <AnimatePresence mode="wait">
          {loading && isMyTurn && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex items-center justify-center text-center p-6">
              <span className="text-lg font-medium text-slate-500 italic animate-pulse">Generating scenario...</span>
            </motion.div>
          )}

          {/* MY TURN - ACTION MENU */}
          {!loading && isMyTurn && scenario && (
            <motion.div key="menu" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-1 flex flex-col">
              
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-mono ${getTimerColorClass()}`}>{Math.ceil(turnTimeLeft)}s</span>
                <div className="flex-1 ml-4 h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: '100%' }} animate={{ width: `${(turnTimeLeft / TURN_TIMER_DURATION) * 100}%` }} transition={{ duration: 0.1 }} className={`h-full ${turnTimeLeft < 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                </div>
              </div>

              <div className="text-base md:text-lg font-medium text-slate-200 leading-relaxed mb-4">
                {scenario.scenario}
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1 mt-auto">
                {scenario.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(option)}
                    className={`
                      relative p-4 rounded-xl text-left border transition-all flex flex-col justify-between
                      ${option.riskLevel === 'High Risk' ? 'bg-black border-red-500/30 hover:border-red-500 hover:bg-red-500/10' : 'bg-black border-white/10 hover:border-emerald-500 hover:bg-emerald-500/10'}
                    `}
                  >
                    <span className="font-bold text-white text-sm leading-tight">{option.text}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tighter mt-2 ${option.riskLevel === 'High Risk' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {option.riskLevel}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- Game Over Overlay --- */}
      <AnimatePresence>
        {gameOver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-center">
            <motion.div initial={{ scale: 0.5, y: 20 }} animate={{ scale: 1, y: 0 }} className="mb-8">
              {gameOver === 'VICTORY' ? <Swords className="w-24 h-24 text-emerald-500" /> : <X className="w-24 h-24 text-red-500" />}
            </motion.div>
            <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">{gameOver === 'VICTORY' ? 'Liquidated Target' : 'Bankrupt'}</h1>
            <p className="text-slate-500 mb-8 max-w-xs font-bold uppercase text-xs tracking-widest">
              {gameOver === 'VICTORY' ? 'You successfully destroyed the opposing portfolio.' : 'Your portfolio was liquidated by the market.'}
            </p>
            <button onClick={onBack} className="w-full max-w-xs py-4 bg-white text-black font-black rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter">
              <Home className="w-5 h-5" /> Return to Lobby
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};