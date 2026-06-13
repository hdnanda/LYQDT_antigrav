import React, { useState, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useAnimation,
} from 'framer-motion';
import { type SpeedScenario } from '../data/SpeedRoundData';
import {
  RetryIcon,
  BackIcon,
  CheckIcon,
  FireIcon,
  SparklesIcon,
} from './Icons';
import { TMOLoader } from './TMOLoader';
import { useGame } from '../contexts/GameContext';
import { playSound } from '../services/audio';

// CDN IMPORTS FOR FIRESTORE
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { useAuth } from '../contexts/AuthContext.js';

interface SpeedRoundProps {
  onBack: () => void;
}

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

// --- Sub-Component: The Swipeable Card ---
const SwipeableCard: React.FC<{
  scenario: SpeedScenario;
  onSwipe: (dir: 'left' | 'right') => void;
  dragDirection: 'left' | 'right' | 'none';
}> = ({ scenario, onSwipe, dragDirection }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacityYes = useTransform(x, [50, 150], [0, 1]);
  const opacityNo = useTransform(x, [-150, -50], [1, 0]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipe('right');
    } else if (info.offset.x < -threshold) {
      onSwipe('left');
    }
  };

  return (
    <MotionDiv
      key={scenario.id}
      style={{ x, rotate, zIndex: 20 } as any}
      drag={dragDirection === 'none' ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
      className={`
                absolute w-[85%] max-w-sm aspect-[3/4] rounded-3xl shadow-2xl 
                flex flex-col items-center justify-between p-8
                border border-slate-700 relative overflow-hidden
                ${scenario.bg} cursor-grab active:cursor-grabbing
            `}
      // Initial state is now Scale 1 because the background card "became" this card
      initial={{ scale: 1, opacity: 1, y: 0 }}
      // Handle the fly-out animation here instead of exit prop
      animate={
        dragDirection !== 'none'
          ? {
              x: dragDirection === 'right' ? 1000 : -1000,
              rotate: dragDirection === 'right' ? 30 : -30,
              opacity: 0,
              transition: { duration: 0.2, ease: 'easeIn' },
            }
          : { scale: 1, opacity: 1, y: 0, x: 0, rotate: 0 }
      }
    >
      {/* AI BADGE */}
      {scenario.isAi && (
        <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 px-2 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-indigo-500/10">
          <SparklesIcon className="w-3 h-3" />
          <span className="text-[9px] font-black uppercase tracking-wider">
            AI Scenario
          </span>
        </div>
      )}

      <MotionDiv
        style={{ opacity: opacityYes }}
        className="absolute inset-0 bg-emerald-500/20 z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="border-4 border-emerald-500 text-emerald-500 rounded-xl px-4 py-2 text-4xl font-black uppercase rotate-[-15deg] bg-black/20 backdrop-blur-sm">
          YES
        </div>
      </MotionDiv>

      <MotionDiv
        style={{ opacity: opacityNo }}
        className="absolute inset-0 bg-red-500/20 z-10 flex items-center justify-center pointer-events-none"
      >
        <div className="border-4 border-red-500 text-red-500 rounded-xl px-4 py-2 text-4xl font-black uppercase rotate-[15deg] bg-black/20 backdrop-blur-sm">
          NO
        </div>
      </MotionDiv>

      <div className="mt-8 text-8xl shadow-sm filter drop-shadow-2xl select-none">
        {scenario.character}
      </div>

      <div className="text-center relative z-20 select-none">
        <h2 className="text-xl font-bold text-white leading-relaxed mb-4">
          {scenario.text}
        </h2>
      </div>

      <div className="w-full flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider select-none">
        <span className="text-red-400">← {scenario.noText}</span>
        <span className="text-emerald-400">{scenario.yesText} →</span>
      </div>
    </MotionDiv>
  );
};

// --- Sub-Component: Loading Spinner Card ---
const LoadingCard = ({
  message = 'Syncing Level...',
}: {
  message?: string;
}) => (
  <MotionDiv
    key="loader"
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="absolute w-[85%] max-w-sm aspect-[3/4] rounded-3xl bg-slate-900 border border-slate-700 flex flex-col items-center justify-center p-8 text-center shadow-2xl z-10"
  >
    <MotionDiv
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"
    />
    <p className="text-slate-400 font-bold animate-pulse">{message}</p>
  </MotionDiv>
);

// --- Sub-Component: Combo Overlay ---
const ComboOverlay = ({ text }: { text: string }) => (
  <MotionDiv
    initial={{ scale: 0.5, opacity: 0, y: 50, rotate: -10 }}
    animate={{ scale: 1, opacity: 1, y: 0, rotate: -5 }}
    exit={{ scale: 1.5, opacity: 0, y: -50 }}
    className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
  >
    <div className="bg-yellow-400 text-black font-black text-4xl px-8 py-4 rounded-3xl border-b-8 border-yellow-600 shadow-2xl transform -rotate-6 flex flex-col items-center">
      <span className="text-sm font-bold uppercase tracking-widest text-yellow-800 mb-1">
        On Fire!
      </span>
      <span>{text}</span>
      <span className="text-xs font-bold mt-1 bg-black/20 text-black px-2 py-0.5 rounded-full">
        +5 Stats
      </span>
    </div>
  </MotionDiv>
);

// --- Helper: Score Quips ---
const getScoreQuip = (score: number) => {
  if (score < 50) {
    const options = [
      'Bro is financially cooked.',
      'Your bank account is crying rn.',
      'Surviving on vibes and empty pockets.',
      'Did you even try?',
      'Financial literacy has left the chat.',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  if (score < 80) {
    const options = [
      "Mid, but at least you aren't broke.",
      'You survived, but at what cost?',
      'Average 16-year-old financial decisions.',
      'C- tier gameplay but we take those.',
      'Not great, not terrible. Just... meh.',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
  const options = [
    'Okay, Warren Buffett.',
    'Securing the bag 💅',
    'Actually a financial weapon.',
    'Unfathomable aura.',
    'Absolute academic weapon behavior.',
  ];
  return options[Math.floor(Math.random() * options.length)];
};

// --- Types for Intro Phase ---
type IntroPhase = 'tmo_loader' | 'level_splash' | 'playing';

export const SpeedRound: React.FC<SpeedRoundProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { currentScenarios, preloadScenarios, isLoading } = useGame();

  // Animation Controls for Background Card
  const backgroundControls = useAnimation();

  // Initialize level from user data
  const [level, setLevel] = useState((user as any)?.speedLevel || 1);

  // Phase Control
  const [introPhase, setIntroPhase] = useState<IntroPhase>('level_splash');

  // Game State
  const [index, setIndex] = useState(0);
  const [wealth, setWealth] = useState(50);
  const [happiness, setHappiness] = useState(50);
  const [combo, setCombo] = useState(0);
  const [comboBonus, setComboBonus] = useState<{
    text: string;
    visible: boolean;
  }>({ text: '', visible: false });
  const [lastSwipeDirection, setLastSwipeDirection] = useState<
    'left' | 'right' | 'none'
  >('none');
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({
    xp: 0,
    accuracy: 0,
    message: '',
    status: 'victory',
    title: '',
    quip: '',
  });
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // --- TRANSITION: Handle Level Up ---
  const handleNextRound = async () => {
    const nextLevel = level + 1;

    // Set level state first
    setLevel(nextLevel);

    // Reset game state
    setIndex(0);
    setWealth(50);
    setHappiness(50);
    setShowReport(false);
    setLastSwipeDirection('none');
    setCombo(0);
    setComboBonus({ text: '', visible: false });

    // NOTE: Preload was already triggered in finishGame!
    // Just show Level Splash
    setIntroPhase('level_splash');
  };

  // --- RESTART: Handle Retry (Same Level) ---
  const handleRetryRound = async () => {
    // Reload SAME level (re-fetches for fresh randoms if manager allows)
    await preloadScenarios(level);

    setIndex(0);
    setWealth(50);
    setHappiness(50);
    setShowReport(false);
    setLastSwipeDirection('none');
    setCombo(0);

    setIntroPhase('level_splash');
  };

  // --- Animation Orchestrator ---
  useEffect(() => {
    if (introPhase === 'level_splash' && !isLoading) {
      const timer = setTimeout(() => {
        setIntroPhase('playing');
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [introPhase, isLoading]);

  // --- Game Loop Logic ---
  const finishGame = async (
    status: 'victory' | 'wasted',
    finalWealth: number,
    finalHappiness: number,
    reason: string
  ) => {
    const diff = Math.abs(finalWealth - finalHappiness);
    const accuracy = Math.max(0, 100 - diff);

    // Determine XP Reward (Only on Victory)
    const earnedXP = status === 'victory' ? 25 : 0;

    // Generate Quip
    const quip = getScoreQuip(accuracy);

    // Play Sound
    if (status === 'victory') {
      playSound.complete();
    } else {
      playSound.wrong();
    }

    setReportData({
      xp: earnedXP,
      accuracy,
      message: '',
      status,
      title: status === 'victory' ? 'Mission Complete' : reason,
      quip,
    });

    // WRITE TO FIRESTORE ON VICTORY
    if (status === 'victory') {
      // 1. PRELOAD NEXT LEVEL IMMEDIATELY
      // This runs in background while user reads report
      preloadScenarios(level + 1);

      if (user && user.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            xp: increment(earnedXP),
            speedLevel: increment(1), // Moves from Level X to X+1
          });
        } catch (error) {
          console.error('Error saving Speed Round progress:', error);
        }
      }
    }

    setTimeout(() => setShowReport(true), 300);
  };

  // Watch for "End of Data"
  useEffect(() => {
    // Only finish if we have reached the end AND we have enough questions (or some timeout happened)
    // We assume 15 is the target.
    const TARGET_QUESTIONS = 15;

    if (
      currentScenarios.length > 0 &&
      index >= currentScenarios.length &&
      !showReport
    ) {
      if (currentScenarios.length >= TARGET_QUESTIONS) {
        finishGame('victory', wealth, happiness, 'Survivor!');
      }
      // Else: Do nothing, just wait. The UI will show LoadingCard because currentScenario is undefined.
    }
  }, [currentScenarios.length, index, showReport, wealth, happiness]);

  const currentScenario = currentScenarios[index];
  const nextScenario = currentScenarios[index + 1];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentScenario) return;
    setLastSwipeDirection(direction);

    // 1. Animate background card "emerging"
    backgroundControls.start({
      scale: 1,
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' },
    });

    const impact =
      direction === 'right'
        ? currentScenario.yesImpact
        : currentScenario.noImpact;
    let newWealthVal = wealth + impact.wealth;
    let newHappinessVal = happiness + impact.happiness;

    const nextCombo = combo + 1;
    if (nextCombo > 0 && nextCombo % 5 === 0) {
      newWealthVal += 5;
      newHappinessVal += 5;
      setComboBonus({ text: `COMBO x${nextCombo}`, visible: true });
      setTimeout(
        () => setComboBonus((prev) => ({ ...prev, visible: false })),
        1500
      );
    }
    setCombo(nextCombo);

    const finalWealth = Math.min(100, Math.max(0, newWealthVal));
    const finalHappiness = Math.min(100, Math.max(0, newHappinessVal));

    setWealth(finalWealth);
    setHappiness(finalHappiness);

    if (finalWealth <= 0) {
      finishGame('wasted', finalWealth, finalHappiness, 'You went broke! 💸');
    } else if (finalHappiness <= 0) {
      finishGame(
        'wasted',
        finalWealth,
        finalHappiness,
        'You died of boredom. 💀'
      );
    } else {
      // 2. Wait 200ms for exit animation, then swap data
      setTimeout(() => {
        setIndex((prev) => prev + 1);
        setLastSwipeDirection('none');
        // 3. Reset background card state instantly for the NEW next card
        backgroundControls.set({ scale: 0.9, opacity: 0.6, y: 30 });
      }, 200);
    }
  };

  // Logic for Exit Request
  const handleBackRequest = () => {
    if (showReport) {
      onBack();
    } else {
      setShowQuitConfirm(true);
    }
  };

  // Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReport || introPhase !== 'playing' || isLoading) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentScenario,
    wealth,
    happiness,
    index,
    showReport,
    combo,
    introPhase,
    isLoading,
  ]);

  const aiCount = currentScenarios.filter(
    (s) => s.id && s.id.startsWith('gen_')
  ).length;

  // --- RENDER PHASE 3: REPORT SCREEN ---
  if (showReport) {
    const isVictory = reportData.status === 'victory';
    return (
      <MotionDiv
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center"
      >
        <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-widest">
          {isVictory ? 'Level Complete' : 'Wasted'}
        </h1>
        <p
          className={`text-lg font-bold mb-8 ${
            isVictory ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {reportData.title}
        </p>

        <div className="flex gap-4 w-full max-w-sm mb-8">
          <MotionDiv
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center"
          >
            <div className="text-3xl mb-2">💎</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
              XP Earned
            </div>
            <div className="text-4xl font-black text-white">
              {reportData.xp}
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col items-center"
          >
            <div className="text-3xl mb-2">⚖️</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">
              Balance Rating
            </div>
            <div
              className={`text-4xl font-black ${
                reportData.accuracy > 75
                  ? 'text-emerald-400'
                  : 'text-yellow-400'
              }`}
            >
              {reportData.accuracy}%
            </div>
          </MotionDiv>
        </div>

        {/* Score Quip */}
        <p className="text-sm text-slate-400 italic -mt-6 mb-8 text-center px-4 max-w-xs mx-auto">
          "{reportData.quip}"
        </p>

        <MotionButton
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={isVictory ? handleNextRound : handleRetryRound}
          className={`w-full max-w-sm py-4 font-black text-lg rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-xl flex items-center justify-center gap-2 ${
            isVictory ? 'bg-white text-black' : 'bg-slate-700 text-white'
          }`}
        >
          <span>{isVictory ? 'Next Level' : 'Try Again'}</span>
          {isVictory ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <RetryIcon className="w-5 h-5" />
          )}
        </MotionButton>

        <button
          onClick={onBack}
          className="mt-6 text-slate-500 font-bold hover:text-white transition-colors flex items-center gap-2"
        >
          <BackIcon className="w-4 h-4" />
          Return to HQ
        </button>
      </MotionDiv>
    );
  }

  // --- RENDER PHASE 1: LOADING STATE (Between Rounds) ---
  if (isLoading && introPhase !== 'level_splash') {
    return <TMOLoader onAnimationFinish={() => {}} duration={99999} />; // Infinite loader until isLoading flips
  }

  // --- RENDER PHASE 2 & 4: LEVEL SPLASH & GAMEPLAY ---
  return (
    <MotionDiv
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-50 bg-black flex flex-col font-sans"
    >
      {/* QUIT CONFIRMATION MODAL */}
      {showQuitConfirm && (
        <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <MotionDiv
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">
              Leave Level {level}?
            </h3>
            <p className="text-slate-400 mb-6 text-sm">
              Current progress for this specific level will be lost. You will
              resume at Level {level}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                Quit
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
      {/* Top Bar: Stats */}
      <div className="pt-6 pb-2 px-6 bg-gradient-to-b from-slate-900 to-transparent z-30 relative">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleBackRequest}
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400"
          >
            <BackIcon className="w-6 h-6" />
          </button>

          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Card {index + 1} / {currentScenarios.length}
          </span>

          <div
            className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
              aiCount > 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-slate-800 border-slate-700 text-slate-600'
            }`}
          >
            {aiCount > 0 ? `+${aiCount} AI` : 'ORIGINAL'}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 relative">
              <span>Wealth 💰</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <MotionDiv
                className="h-full bg-emerald-500"
                initial={{ width: '50%' }}
                animate={{ width: `${wealth}%` }}
              />
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1 relative">
              <span>Happiness 😊</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <MotionDiv
                className="h-full bg-yellow-500"
                initial={{ width: '50%' }}
                animate={{ width: `${happiness}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* --- LEVEL INDICATOR ANIMATION --- */}
      <MotionDiv
        className="absolute z-40 pointer-events-none w-full flex justify-center"
        initial={false}
        animate={introPhase === 'level_splash' ? 'center' : 'top'}
        variants={{
          center: {
            top: '50%',
            y: '-50%',
            scale: 3,
            opacity: 1,
          },
          top: {
            top: '135px', // Approx just below the header stats
            y: '0%',
            scale: 1,
            opacity: 0.8,
          },
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 20,
          duration: 0.8,
        }}
      >
        <div className="bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full border border-slate-700/50">
          <h2 className="text-white font-black tracking-[0.2em] text-sm uppercase">
            LEVEL {level}
          </h2>
        </div>
      </MotionDiv>
      {/* Center: Card Stack */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {introPhase === 'playing' && (
            <MotionDiv
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }} // Wait for "LEVEL X" to fly up
              className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${
                comboBonus.visible ? 'blur-md opacity-50 scale-95' : ''
              }`}
            >
              {/* Layer 1: Next Card (Background) */}
              {nextScenario ? (
                <MotionDiv
                  animate={backgroundControls}
                  initial={{ scale: 0.9, opacity: 0.6, y: 30 }}
                  className={`
                                absolute w-[85%] max-w-sm aspect-[3/4] rounded-3xl 
                                flex flex-col items-center justify-between p-8
                                border border-slate-700 ${nextScenario.bg}
                                z-0 pointer-events-none select-none overflow-hidden
                            `}
                >
                  <div className="mt-8 text-8xl opacity-50 grayscale">
                    {nextScenario.character}
                  </div>
                  <div className="w-full flex flex-col items-center gap-2 opacity-30">
                    <div className="h-4 w-3/4 bg-slate-400 rounded-full" />
                    <div className="h-4 w-1/2 bg-slate-400 rounded-full" />
                  </div>
                </MotionDiv>
              ) : (
                // Placeholder if no next card
                <div className="absolute w-[85%] max-w-sm aspect-[3/4] rounded-3xl bg-slate-900 border border-slate-800 transform scale-90 translate-y-[30px] opacity-60 z-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-slate-500 rounded-full" />
                </div>
              )}

              {/* Layer 2: Active Card (Foreground) */}
              <AnimatePresence>
                {currentScenario ? (
                  <SwipeableCard
                    key={currentScenario.id}
                    scenario={currentScenario}
                    onSwipe={handleSwipe}
                    dragDirection={lastSwipeDirection}
                  />
                ) : (
                  <LoadingCard message="Generating more chaos..." />
                )}
              </AnimatePresence>
            </MotionDiv>
          )}
        </AnimatePresence>

        {/* Layer 3: Combo Overlay (Not Blurred) */}
        <AnimatePresence>
          {comboBonus.visible && <ComboOverlay text={comboBonus.text} />}
        </AnimatePresence>
      </div>
      <div className="h-12" /> {/* Bottom Spacer */}
    </MotionDiv>
  );
};
