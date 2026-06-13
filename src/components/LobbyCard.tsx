
import React from 'react';
import { motion } from 'framer-motion';

interface LobbyCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  buttonText: string;
  onStart: () => void;
  color: string;
  children?: React.ReactNode;
}

const MotionDiv = motion.div as any;

export const LobbyCard: React.FC<LobbyCardProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  buttonText, 
  onStart, 
  color,
  children 
}) => {
  return (
    <div className="flex-1 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-md relative overflow-hidden flex flex-col pt-10 pb-6 bg-white dark:bg-slate-900/50 shadow-xl transition-colors duration-300">
      
      {/* Top Section - Fixed Height */}
      <div className="flex flex-col items-center w-full px-4 shrink-0">
          <div className={`p-6 rounded-full bg-slate-100 dark:bg-slate-900/50 mb-4 border border-slate-200 dark:border-slate-700 shadow-2xl ${color} transition-colors duration-300`}>
            <Icon className="w-16 h-16" />
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">{title}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-[240px] text-sm">
            {description}
          </p>
      </div>

      {/* Middle Section (Optional Children like DailyTip) */}
      <div className="w-full px-6 my-2 flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto">
          {children}
      </div>
      
      {/* Bottom Section - Anchored */}
      <div className="w-full px-6 mt-auto shrink-0 flex justify-center">
          <button 
              onClick={onStart}
              className="w-full max-w-xs py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-lg hover:scale-105 transition-all"
          >
              {buttonText}
          </button>
      </div>
    </div>
  );
};
