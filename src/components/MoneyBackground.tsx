
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Emojis to float up
const MONEY_EMOJIS = ['💸', '💰', '📈', '💵', '🤑', '🪙'];

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number; // Percent 0-100
  delay: number;
  duration: number;
  scale: number;
}

const MotionDiv = motion.div as any;

export const MoneyBackground: React.FC = () => {
  const [particles, setParticles] = useState<FloatingEmoji[]>([]);

  useEffect(() => {
    // Generate static set of particles for background animation
    const count = 15;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      emoji: MONEY_EMOJIS[Math.floor(Math.random() * MONEY_EMOJIS.length)],
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10, // Slow float 10-20s
      scale: 0.8 + Math.random() * 0.7,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-white dark:from-slate-950 dark:via-emerald-950 dark:to-slate-900 -z-50 transition-colors duration-500">
      {/* Floating Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <MotionDiv
            key={p.id}
            initial={{ y: '110vh', opacity: 0, x: `${p.x}vw` }}
            animate={{ 
              y: '-20vh', 
              opacity: [0, 0.4, 0], // Fade in then out
              scale: [p.scale, p.scale * 1.5] // Scale up slightly
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
            className="absolute text-4xl filter blur-[1px] select-none"
            style={{ 
              left: 0,
              textShadow: '0 0 20px rgba(52, 211, 153, 0.3)' // Green faint glow
            }}
          >
            {p.emoji}
          </MotionDiv>
        ))}
      </AnimatePresence>

      {/* Heavy Blur Overlay (Glass Effect) */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/60 backdrop-blur-[4px] transition-colors duration-500" />
      
      {/* Gradient Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-200/90 via-transparent to-slate-200/40 dark:from-slate-900/90 dark:via-transparent dark:to-slate-900/40 pointer-events-none transition-colors duration-500" />
    </div>
  );
};
