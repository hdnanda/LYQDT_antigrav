
import React, { useState, useEffect } from 'react';
import { AcademyMap } from './AcademyMap';
import { LobbyCard } from './LobbyCard';
import { OwlIcon } from './Icons';
import { DailyTip } from './DailyTip';
import { Header } from './Header';
import { ACADEMY_SECTIONS } from '../data/AcademyData';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluateStreakStatus, StreakStatus } from '../utils/streakUtils';
import { X, Flame, Bell } from 'lucide-react';

interface AcademyLobbyProps {
  onBack: () => void;
  onGameToggle: (active: boolean) => void;
}

export const AcademyLobby: React.FC<AcademyLobbyProps> = ({ onBack, onGameToggle }) => {
  const { user } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [showOverallProgress, setShowOverallProgress] = useState(true);
  const [streakPopup, setStreakPopup] = useState<{ show: boolean; status: StreakStatus | null }>({
    show: false,
    status: null
  });

  // Oscillating Progress Bar Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setShowOverallProgress(prev => !prev);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Streak Evaluation Logic
  useEffect(() => {
    if (user) {
      const status = evaluateStreakStatus(user.lastLessonDate);
      if (status !== StreakStatus.COMPLETED_TODAY) {
        setStreakPopup({ show: true, status });
      }
    }
  }, [user?.lastLessonDate]);

  const handleStart = () => {
    setIsStarted(true);
    onGameToggle(true);
    setStreakPopup({ show: false, status: null });
  };

  const handleBack = () => {
    setIsStarted(false);
    onGameToggle(false);
  };

  if (isStarted && user) {
    return (
      <AcademyMap 
        sections={ACADEMY_SECTIONS} 
        onBack={handleBack}
        onLessonComplete={() => {}} 
        onExamFail={() => {}} 
        examUnlockTime={user.examUnlockTime}
      />
    );
  }

  const displayName = user?.username || "Player";
  const safeXP = user?.xp || 0;
  const safeStreak = user?.currentStreak || 0;

  // Progress Calculations
  const totalAcademyLessons = 50;
  const completedAcademyLessons = user?.completedLessons?.length || 0;
  const overallProgressPercentage = Math.round((completedAcademyLessons / totalAcademyLessons) * 100);

  const totalUnitLessons = 10;
  const completedUnitLessons = (user?.completedLessons?.length || 0) % 10; // Mock unit progress
  const unitProgressPercentage = Math.round((completedUnitLessons / totalUnitLessons) * 100);

  const getStreakMessage = () => {
    switch (streakPopup.status) {
      case StreakStatus.UNINITIATED:
        return "Welcome! Finish your first Academy Lesson to start your daily streak.";
      case StreakStatus.ACTION_REQUIRED:
        return `Don't lose your progress! Finish an Academy Lesson today to keep your ${safeStreak} day streak alive 🔥`;
      case StreakStatus.BROKEN:
        return "Oh no, you lost your streak! Finish an Academy Lesson to start a new one.";
      default:
        return "";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-black relative">
      {/* Header */}
      <div className="px-6 pt-4 z-30 shrink-0">
        <Header username={displayName} xp={safeXP} streak={safeStreak} />
        
        {/* Oscillating Progress Bar */}
        <div className="mt-2 px-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter transition-all duration-700">
              {showOverallProgress ? "Overall Academy Progress" : "Current Unit Progress"}
            </span>
            <span className="text-[10px] font-black text-emerald-500 transition-all duration-700">
              {showOverallProgress ? overallProgressPercentage : unitProgressPercentage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-emerald-500/10 rounded-full overflow-hidden border border-emerald-500/20">
            <div 
              className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-700 ease-in-out"
              style={{ width: `${showOverallProgress ? overallProgressPercentage : unitProgressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col">
        <LobbyCard
          title="Academy"
          description="Your main learning path."
          icon={OwlIcon}
          buttonText="Continue Lesson"
          onStart={handleStart}
          color="text-emerald-500"
        >
          <div className="w-full max-h-full">
            <DailyTip />
          </div>
        </LobbyCard>
      </div>

      
    </div>
  );
};
