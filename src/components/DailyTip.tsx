import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDailyFinancialTip } from '../services/geminiService';

const MotionDiv = motion.div as any;

export const DailyTip: React.FC = () => {
  const [tip, setTip] = useState<string>("Loading your daily money wisdom...");

  useEffect(() => {
    let mounted = true;
    getDailyFinancialTip().then(text => {
      if (mounted) setTip(text);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <MotionDiv
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-2xl mb-8 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
      <p className="text-indigo-100 text-sm italic leading-relaxed">"{tip}"</p>
    </MotionDiv>
  );
};
