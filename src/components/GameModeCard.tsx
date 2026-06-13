import React from 'react';
import { motion } from 'framer-motion';
import { GameModeConfig } from '../types';

interface GameModeCardProps {
  mode: GameModeConfig;
  index: number;
  onPress: (id: string) => void;
}

const MotionDiv = motion.div as any;

export const GameModeCard: React.FC<GameModeCardProps> = ({ mode, index, onPress }) => {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
      whileHover={{ scale: 1.02, translateY: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onPress(mode.id)}
      className={`relative overflow-hidden p-6 rounded-3xl cursor-pointer shadow-lg mb-4 border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm group`}
    >
      {/* Background Gradient Effect */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${mode.color} opacity-10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity duration-500`} />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-white mb-1 tracking-tight">{mode.title}</h3>
          <p className="text-sm text-slate-400 font-medium">{mode.subtitle}</p>
        </div>
        
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${mode.color} shadow-lg shadow-${mode.accentColor}/20 group-hover:scale-110 transition-transform duration-300`}>
          <div className="text-white">
            {mode.icon}
          </div>
        </div>
      </div>

      {/* Interactive Shine Effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
    </MotionDiv>
  );
};
