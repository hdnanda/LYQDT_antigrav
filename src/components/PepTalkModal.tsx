import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COPY_OPTIONS = [
  "Bro is cooking! 🍳",
  "Stonks only go up! 📈",
  "Portfolio: Green. ✅",
  "Main Character Energy. ✨"
];

const MotionDiv = motion.div as any;

// Layer 1: Money Wipe Particle
const MoneyParticle: React.FC<{ index: number }> = ({ index }) => {
    // Generate random properties for chaotic "storm" effect
    const startX = Math.random() * 100; // 0-100% width
    const duration = 0.8 + Math.random() * 0.4; // 0.8s - 1.2s (Fast wipe)
    const delay = Math.random() * 0.2; // Tight grouping for "Wall" effect
    const rotateStart = Math.random() * 360;
    const rotateEnd = rotateStart + (Math.random() * 180 - 90);
    const scale = 1 + Math.random() * 0.8; // Huge: 1.0 - 1.8 scale

    return (
        <MotionDiv
            initial={{ 
                top: '110%', 
                left: `${startX}%`,
                rotate: rotateStart,
                scale: scale,
                opacity: 1
            }}
            animate={{ 
                top: '-50%', 
                rotate: rotateEnd,
            }}
            transition={{ 
                duration: duration, 
                delay: delay, 
                ease: "linear"
            }}
            className="absolute pointer-events-none select-none"
            style={{
                fontSize: '120px', // Massive size
                willChange: 'transform, top',
                zIndex: 10 // Layer 1: Bottom
            }}
        >
            💸
        </MotionDiv>
    );
};

export const PepTalkModal: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const [text, setText] = useState("");

    useEffect(() => {
        // Randomly select copy on mount
        setText(COPY_OPTIONS[Math.floor(Math.random() * COPY_OPTIONS.length)]);
        
        // Timer: 2.5 seconds total visibility
        const timer = setTimeout(() => {
            onFinished();
        }, 2500);

        return () => clearTimeout(timer);
    }, [onFinished]);

    return (
        <div className="absolute inset-0 z-[100] overflow-hidden flex items-center justify-center pointer-events-none">
            {/* Layer 1: The Money Wipe (Chaotic Storm) - 25 Particles */}
            <div className="absolute inset-0 z-10">
                {Array.from({ length: 25 }).map((_, i) => (
                    <MoneyParticle key={i} index={i} />
                ))}
            </div>

            {/* Layer 2: The Filter (Backdrop Blur) */}
            <MotionDiv 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }} // Fade in as text arrives
                className="absolute inset-0 bg-black/40 backdrop-blur-lg z-20"
            />

            {/* Layer 3: The Content */}
            <MotionDiv
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 15,
                    delay: 0.4 // Wait for the money curtain to rise slightly
                }}
                className="relative z-30 text-center px-4"
            >
                <h1 className="text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(16,185,129,0.6)] leading-tight tracking-tight">
                    {text}
                </h1>
            </MotionDiv>
        </div>
    );
};
