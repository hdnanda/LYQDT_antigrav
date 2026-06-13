import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

export type AnswerStatus = 'correct' | 'wrong' | null;

const MotionDiv = motion.div as any;

export const AnswerGlow: React.FC<{ status: AnswerStatus }> = ({ status }) => {
  const controls = useAnimation();

  useEffect(() => {
    if (status) {
      // Flash animation: In fast (100ms), out slow (500ms)
      controls.start({
        opacity: [0, 1, 0],
        transition: { duration: 0.6, times: [0, 0.15, 1] }
      });
    }
  }, [status, controls]);

  if (!status) return null;

  const isCorrect = status === 'correct';
  // Emerald-500 (#10b981) for correct, Red-500 (#ef4444) for wrong
  const color = isCorrect ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'; 

  return (
    <MotionDiv
      animate={controls}
      initial={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-[60] overflow-hidden flex justify-between"
    >
        {/* Left Glow */}
        <div 
            className="h-full w-16 sm:w-24"
            style={{
                background: `linear-gradient(to right, ${color}, transparent)`,
                filter: 'blur(20px)',
            }}
        />

        {/* Right Glow */}
        <div 
            className="h-full w-16 sm:w-24"
            style={{
                background: `linear-gradient(to left, ${color}, transparent)`,
                filter: 'blur(20px)',
            }}
        />
    </MotionDiv>
  );
};
