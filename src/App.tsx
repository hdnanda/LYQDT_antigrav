
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MoneyBackground } from './components/MoneyBackground';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { GameProvider } from './contexts/GameContext';
import { SplashScreen } from './components/SplashScreen';
import { ThemeProvider } from './contexts/ThemeContext';
import { SpeedLobby } from './components/SpeedLobby';
import { FightLobby } from './components/FightLobby';
import { AcademyLobby } from './components/AcademyLobby';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ProfileEditor } from './components/ProfileEditor';
import { doc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from './services/firebase.js';
import { TrophyIcon } from './components/Icons';
import { motion, AnimatePresence } from 'framer-motion';

type ActiveTab = 'speed' | 'academy' | 'fight';

const Dashboard = () => {
  const { user } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('academy');
  const [showBonusToast, setShowBonusToast] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  // Daily Bonus Logic
  useEffect(() => {
    const checkDailyBonus = async () => {
        if (!user || !user.uid) return;

        const lastBonus = (user as any).lastLoginBonus || 0;
        const now = Date.now();
        
        const lastDate = new Date(lastBonus).toDateString();
        const todayDate = new Date(now).toDateString();

        if (lastDate !== todayDate) {
            try {
                const userRef = doc(db, "users", user.uid);
                await updateDoc(userRef, {
                    xp: increment(50),
                    lastLoginBonus: now
                });
                setShowBonusToast(true);
                setTimeout(() => setShowBonusToast(false), 3000);
            } catch (err) {
                console.error("Error awarding daily bonus:", err);
            }
        }
    };
    if (splashComplete) checkDailyBonus();
  }, [user?.uid, splashComplete]);

  if (!splashComplete) {
      return <SplashScreen onComplete={() => setSplashComplete(true)} />;
  }

  const displayName = user?.username || "Student";
  const safeXP = user?.xp || 0;
  const safeStreak = user?.currentStreak || 0;

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden font-sans text-white transition-colors duration-300">
      <div className="max-w-md mx-auto h-[100dvh] relative shadow-2xl bg-black overflow-hidden flex flex-col transition-colors duration-300">
        
        {/* Bonus Toast */}
        <AnimatePresence>
            {showBonusToast && (
                <motion.div 
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 20, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  className="absolute top-20 left-0 right-0 z-[60] flex justify-center"
                >
                    <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-6 py-3 rounded-full font-black shadow-2xl flex items-center gap-2 border-2 border-white/20">
                        <TrophyIcon className="w-5 h-5 text-black" />
                        DAILY LOGIN: +50 XP
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col mt-4">
          <AnimatePresence mode="wait">
            {activeTab === 'speed' && (
              <motion.div 
                key="speed" 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col"
              >
                <SpeedLobby 
                  onBack={() => setActiveTab('academy')} 
                  onGameToggle={setIsGameActive}
                />
              </motion.div>
            )}
            
            {activeTab === 'academy' && (
              <motion.div 
                key="academy" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col"
              >
                <AcademyLobby 
                  onBack={() => setActiveTab('academy')} 
                  onGameToggle={setIsGameActive}
                />
              </motion.div>
            )}

            {activeTab === 'fight' && (
              <motion.div 
                key="fight" 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                <FightLobby 
                  onBack={() => setActiveTab('academy')} 
                  onGameToggle={setIsGameActive}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        {!isGameActive && <BottomNav activeTab={activeTab} onTabChange={(tab) => {
          setActiveTab(tab);
          setIsGameActive(false);
        }} />}
        
        {/* Sign Out Link */}
        {!isGameActive && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center z-50">
                <button 
                  onClick={() => auth.signOut()} 
                  className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
     return <AuthScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/profile" element={<ProfileEditor />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
