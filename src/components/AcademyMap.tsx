
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { type Lesson, type Section } from '../data/AcademyData';
import { StarIcon, LockIcon, CrownIcon, BackIcon } from './Icons';
import { TMOLoader } from './TMOLoader';
import { LessonScreen } from './LessonScreen';
import { PathConnector } from './PathConnector';
import { useAuth } from '../contexts/AuthContext.js';

interface AcademyMapProps {
  sections: Section[];
  examUnlockTime: number | null;
  onBack: () => void;
  onLessonComplete: (lessonId: string, xp: number) => void;
  onExamFail: () => void;
}

const MotionButton = motion.button as any;

const getXOffset = (index: number) => {
    const pattern = index % 4;
    if (pattern === 1) return -60;
    if (pattern === 3) return 60;
    return 0;
};

export const AcademyMap: React.FC<AcademyMapProps> = ({ sections, examUnlockTime, onBack, onLessonComplete, onExamFail }) => {
  const { user } = useAuth();
  const [activeLessonConfig, setActiveLessonConfig] = useState<{ lesson: Lesson, color: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to determine if a specific lesson is unlocked based on user data
  const isLessonUnlocked = (lessonIndex: number, sectionIndex: number): boolean => {
      // 1. Always unlock the very first lesson of the very first section
      if (sectionIndex === 0 && lessonIndex === 0) return true;

      // 2. Determine ID of the previous lesson
      let prevLessonId = null;
      
      if (lessonIndex > 0) {
          // Same section, previous lesson
          prevLessonId = sections[sectionIndex].lessons[lessonIndex - 1].id;
      } else if (sectionIndex > 0) {
          // Previous section, last lesson
          const prevSection = sections[sectionIndex - 1];
          prevLessonId = prevSection.lessons[prevSection.lessons.length - 1].id;
      }

      // 3. Check if user has completed that previous lesson
      if (prevLessonId && user?.completedLessons) {
          return user.completedLessons.includes(prevLessonId);
      }
      
      return false;
  };

  const handleNodeClick = (lesson: Lesson, isLocked: boolean, sectionColor: string) => {
    if (isLocked) return;

    if (lesson.isExam && examUnlockTime) {
        const now = Date.now();
        if (now < examUnlockTime) {
            const diffMs = examUnlockTime - now;
            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            alert(`Cooldown Active. Try again in ${minutes}:${seconds.toString().padStart(2, '0')}.`);
            return;
        }
    }

    setActiveLessonConfig({ lesson, color: sectionColor });
    setLoading(true);
  };

  const renderModalContent = () => {
    if (loading) {
        return <TMOLoader onAnimationFinish={() => setLoading(false)} />;
    }
    if (activeLessonConfig) {
        return (
            <LessonScreen
                lesson={activeLessonConfig.lesson}
                sectionColor={activeLessonConfig.color}
                onExit={() => setActiveLessonConfig(null)}
                onComplete={(xp) => {
                    // Update local flow (modal close)
                    setActiveLessonConfig(null);
                    // Notify parent if needed (e.g., refresh data, though snapshot handles it)
                    onLessonComplete(activeLessonConfig.lesson.id, xp);
                }}
                onFail={() => {
                    onExamFail();
                    setActiveLessonConfig(null);
                }}
            />
        );
    }
    return null;
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-black relative">
      {/* Header */}
      <div className="shrink-0 p-4 bg-black/80 backdrop-blur-md border-b border-slate-900 flex items-center gap-4 z-20">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-900 text-slate-300 transition-colors"
        >
          <BackIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white tracking-wide">Academy Path</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {sections.map((section, sIndex) => {
            
            // Calculate unlocked count for header display using our new logic
            const unlockedCount = section.lessons.filter((_, lIndex) => isLessonUnlocked(lIndex, sIndex)).length;

            return (
              <div key={section.id} className="mb-0">
                {/* Section Header */}
                <div 
                  className="sticky top-0 z-20 py-3 px-6 mb-8 backdrop-blur-lg border-y border-slate-900/50 shadow-2xl"
                  style={{ backgroundColor: `${section.color}20`, borderColor: section.color }}
                >
                  <h2 className="text-lg font-black text-white uppercase tracking-widest">{section.title}</h2>
                  <p className="text-xs font-medium opacity-80" style={{ color: section.color }}>
                    {unlockedCount} / {section.lessons.length} Unlocked
                  </p>
                </div>

                {/* Nodes Container */}
                <div className="flex flex-col items-center w-full px-4 relative">
                  {section.lessons.map((lesson, lIndex) => {
                    const currentX = getXOffset(lIndex);
                    const nextX = getXOffset(lIndex + 1);
                    
                    // Determine lock status dynamically
                    const unlocked = isLessonUnlocked(lIndex, sIndex);
                    const isLocked = !unlocked;

                    // Determine if path to NEXT node should be unlocked
                    // Path is unlocked if the NEXT lesson is unlocked
                    // OR if the current lesson is completed (which implies next is unlocked usually)
                    const isLastInList = lIndex === section.lessons.length - 1;
                    let nextLessonUnlocked = false;
                    
                    if (!isLastInList) {
                        nextLessonUnlocked = isLessonUnlocked(lIndex + 1, sIndex);
                    }

                    return (
                      <React.Fragment key={lesson.id}>
                        <div 
                          className="relative z-10"
                          style={{ transform: `translateX(${currentX}px)` }}
                        >
                            <LessonNode 
                              lesson={lesson} 
                              color={section.color}
                              isLocked={isLocked}
                              isCooldown={!!(lesson.isExam && examUnlockTime && Date.now() < examUnlockTime)}
                              onClick={() => handleNodeClick(lesson, isLocked, section.color)}
                            />
                        </div>

                        {!isLastInList && (
                            <div className="-mt-6 -mb-6 relative z-0">
                                <PathConnector 
                                    startX={currentX}
                                    endX={nextX}
                                    height={80}
                                    status={nextLessonUnlocked ? 'unlocked' : 'locked'}
                                />
                            </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="h-12" />
              </div>
            );
        })}
      </div>

      {(loading || activeLessonConfig) && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
             <div className="w-full h-full max-w-md bg-black relative shadow-2xl overflow-hidden">
                 {renderModalContent()}
             </div>
          </div>,
          document.body
      )}

    </div>
  );
};

const LessonNode: React.FC<{ 
    lesson: Lesson; 
    color: string; 
    isLocked: boolean;
    isCooldown: boolean;
    onClick: () => void 
}> = ({ lesson, color, isLocked, isCooldown, onClick }) => {
  const isExam = lesson.isExam;
  const sizeClass = isExam ? "w-24 h-24" : "w-20 h-20";
  
  let bgStyle = isLocked ? '#334155' : isExam ? '#fbbf24' : color;
  let borderStyle = isLocked ? '#475569' : isExam ? '#b45309' : '#ffffff40';
  let iconColor = isExam ? "text-amber-900 fill-amber-900" : "text-white fill-white";

  if (isCooldown && !isLocked) {
      bgStyle = '#475569';
      borderStyle = '#1e293b';
      iconColor = "text-slate-400";
  }

  return (
    <div className="flex flex-col items-center gap-2">
        <MotionButton
            whileHover={!isLocked ? { scale: 1.05 } : {}}
            whileTap={!isLocked ? { scale: 0.95 } : {}}
            onClick={onClick}
            className={`
                ${sizeClass} rounded-full flex items-center justify-center 
                shadow-[0_8px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[8px] transition-all
                border-4 relative overflow-hidden
                ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
            `}
            style={{ 
                backgroundColor: bgStyle,
                borderColor: borderStyle
            }}
        >
            {isLocked ? (
                <LockIcon className="w-8 h-8 text-slate-500" />
            ) : isExam ? (
                <CrownIcon className={`w-10 h-10 ${iconColor}`} />
            ) : (
                <StarIcon className={`w-8 h-8 ${iconColor}`} />
            )}
            
            {isCooldown && !isLocked && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Wait</span>
                </div>
            )}
            
            {!isLocked && !isCooldown && <div className="absolute top-2 right-4 w-3 h-3 bg-white rounded-full opacity-40 blur-[1px]" />}
        </MotionButton>
        
        <span className={`
            text-xs font-bold text-center max-w-[120px] px-2 py-0.5 rounded-full
            ${isLocked || isCooldown ? 'text-slate-600' : 'text-white'}
            bg-black/40 backdrop-blur-sm
        `}>
            {lesson.title}
        </span>
    </div>
  );
};
