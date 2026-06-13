import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const TRUTH_BOMBS = [
  "Buying skins gives you 0 XP in real life.",
  "Your savings account is screaming for help.",
  "Ordering food is not a hobby, it's a financial crime.",
  "Compound interest is the only glow-up you need.",
  "A budget is telling your money where to go, instead of wondering where it went.",
  "Rich people stay rich by living like they're broke.",
  "That latte costs 2 hours of your work life.",
  "Credit cards are like chainsaws. Useful, but dangerous."
];

interface TMOLoaderProps {
  onAnimationFinish: () => void;
  duration?: number; // Optional prop to control duration (ms)
}

const MotionDiv = motion.div as any;

export const TMOLoader: React.FC<TMOLoaderProps> = ({ onAnimationFinish, duration = 3000 }) => {
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Pick a random quote on mount
    const randomQuote = TRUTH_BOMBS[Math.floor(Math.random() * TRUTH_BOMBS.length)];
    setQuote(randomQuote);

    // Timer to finish loading (defaults to 3s, can be overridden)
    const timer = setTimeout(() => {
      onAnimationFinish();
    }, duration);

    return () => clearTimeout(timer);
  }, [onAnimationFinish, duration]);

  return (
    <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center p-8 overflow-hidden font-sans">
      
      {/* 1. The Logo Container */}
      <div className="relative mb-16">
        {/* 
           Layer 1: Base Text 
           This is the "dim" version of the logo that is always visible.
        */}
        <h1 className="text-9xl font-black tracking-tighter text-[#333333] select-none scale-y-110 m-0 leading-none">
          LYQDT
        </h1>

        {/* 
           Layer 2: The Shine Mask 
           This contains the WHITE text. We apply a CSS mask to this container.
           The mask is a gradient that moves diagonally.
           
           Animation Direction:
           Left to Right.
           Start: -150% (Off-screen Left)
           End: 150% (Off-screen Right)
        */}
        <MotionDiv
          className="absolute inset-0 z-10"
          initial={{ 
            WebkitMaskPosition: '-150% 0px',
            maskPosition: '-150% 0px'
          }}
          animate={{ 
            WebkitMaskPosition: '150% 0px', 
            maskPosition: '150% 0px' 
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.5
          }}
          style={{
            // The Mask: A diagonal gradient (transparent -> black -> transparent)
            // In CSS masking, "black" or opaque areas allow content to show, transparent hides it.
            // We use a 120deg angle for that "Rockstar" diagonal slash.
            WebkitMaskImage: 'linear-gradient(120deg, transparent 35%, black 50%, transparent 65%)',
            maskImage: 'linear-gradient(120deg, transparent 35%, black 50%, transparent 65%)',
            
            // Mask Size: Needs to be large enough to move across
            WebkitMaskSize: '200% 100%',
            maskSize: '200% 100%',
            
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat'
          }}
        >
          {/* The Content being revealed: Bright White Text */}
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

      {/* 3. Bottom Loading Bar (Optional Aesthetic) */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#111]">
        <MotionDiv 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className="h-full bg-[#333]"
        />
      </div>
    </div>
  );
};
