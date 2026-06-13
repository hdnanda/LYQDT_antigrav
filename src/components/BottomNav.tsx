
import React from 'react';
import { motion } from 'framer-motion';
import { FireIcon, OwlIcon, SwordsIcon } from './Icons';

interface BottomNavProps {
  activeTab: 'speed' | 'academy' | 'fight';
  onTabChange: (tab: 'speed' | 'academy' | 'fight') => void;
}

const MotionDiv = motion.div as any;

const TABS = [
  { id: 'speed', title: 'Speed', icon: FireIcon, color: 'text-orange-500', activeBg: 'from-orange-500/20' },
  { id: 'academy', title: 'Academy', icon: OwlIcon, color: 'text-emerald-500', activeBg: 'from-emerald-500/20' },
  { id: 'fight', title: 'Fight', icon: SwordsIcon, color: 'text-red-500', activeBg: 'from-red-500/20' }
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="px-6 pb-8 pt-4 z-50 bg-slate-50 dark:bg-black">
      <div className="h-20 rounded-3xl bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 relative shadow-2xl transition-colors duration-300">
        
        {TABS.map((tab) => {
           const isActive = activeTab === tab.id;
           return (
             <button
               key={tab.id}
               onClick={() => onTabChange(tab.id)}
               className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative"
             >
               {isActive && (
                  <MotionDiv 
                      layoutId="nav-pill"
                      className={`absolute inset-2 bg-gradient-to-t ${tab.activeBg} to-transparent rounded-2xl -z-10`}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
               )}

               <tab.icon className={`w-6 h-6 transition-all duration-300 ${isActive ? tab.color : 'text-slate-400 dark:text-slate-500'}`} />
               <span className={`text-[10px] font-bold uppercase transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-600'}`}>
                  {tab.title}
               </span>
               
               {isActive && (
                  <MotionDiv 
                      layoutId="nav-dot"
                      className={`absolute bottom-2 w-1 h-1 rounded-full ${tab.color.replace('text-', 'bg-')}`}
                  />
               )}
             </button>
           );
        })}
      </div>
    </div>
  );
};
