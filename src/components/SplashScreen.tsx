import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';

interface SplashScreenProps {
  onComplete: () => void;
}

const TRUTH_BOMBS = [
  'Buying skins gives you 0 XP in real life.',
  'Your savings account is screaming for help.',
  "Ordering food is not a hobby, it's a financial crime.",
  'Compound interest is the only glow-up you need.',
  'A budget is telling your money where to go, instead of wondering where it went.',
  "Rich people stay rich by living like they're broke.",
  'That latte costs 2 hours of your work life.',
  'Credit cards are like chainsaws. Useful, but dangerous.',
];

const MotionDiv = motion.div as any;

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { preloadScenarios, loadFallback } = useGame();
  const [quote, setQuote] = useState('');

  // Duration matches the logic in useEffect
  const DURATION = 5000;

  useEffect(() => {
    // Pick a random quote on mount
    const randomQuote =
      TRUTH_BOMBS[Math.floor(Math.random() * TRUTH_BOMBS.length)];
    setQuote(randomQuote);

    let isMounted = true;

    const init = async () => {
      const level = (user as any)?.speedLevel || 1;

      // Flag to track if AI finished in time
      let isLoaded = false;

      // Start AI Fetch immediately (don't await it yet, let it race)
      const fetchPromise = preloadScenarios(level).then(() => {
        isLoaded = true;
      });

      // Wait exactly 5 seconds (matching the visual duration)
      await new Promise((resolve) => setTimeout(resolve, DURATION));

      // TIMEOUT CHECK: If AI isn't ready by now, force fallback
      if (!isLoaded) {
        console.warn(
          'Splash: AI timeout. Forcing fallback to prevent stuck state.'
        );
        loadFallback();
      }

      // Short delay for 100% visual satisfaction
      setTimeout(() => {
        if (isMounted) onComplete();
      }, 500);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
      {/* 1. The Logo Container */}
      <div className="relative mb-16">
        {/* Layer 1: Base Text */}
        <h1 className="text-9xl font-black tracking-tighter text-[#333333] select-none scale-y-110 m-0 leading-none">
          LYQDT
        </h1>

        {/* Layer 2: The Shine Mask */}
        <MotionDiv
          className="absolute inset-0 z-10"
          initial={{
            WebkitMaskPosition: '-150% 0px',
            maskPosition: '-150% 0px',
          }}
          animate={{
            WebkitMaskPosition: '150% 0px',
            maskPosition: '150% 0px',
          }}
          transition={{
            duration: 1.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          style={{
            WebkitMaskImage:
              'linear-gradient(120deg, transparent 35%, black 50%, transparent 65%)',
            maskImage:
              'linear-gradient(120deg, transparent 35%, black 50%, transparent 65%)',
            WebkitMaskSize: '200% 100%',
            maskSize: '200% 100%',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
          }}
        >
          <h1 className="text-9xl font-black tracking-tighter text-white select-none scale-y-110 m-0 leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            LYQDT
          </h1>
        </MotionDiv>
      </div>

      {/* 2. The Truth Bomb */}
      <MotionDiv
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="max-w-xs text-center relative z-20"
      >
        <div className="h-0.5 w-8 bg-[#333] mx-auto mb-6" />
        <p className="text-[#888] font-mono text-xs uppercase tracking-widest leading-relaxed">
          {quote}
        </p>
      </MotionDiv>

      {/* 3. Bottom Loading Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#111]">
        <MotionDiv
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: DURATION / 1000, ease: 'linear' }}
          className="h-full bg-[#333]"
        />
      </div>
    </div>
  );
};
