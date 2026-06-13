
import React from 'react';
import { FireIcon } from './Icons';
import { Link } from 'react-router-dom';

export const Header: React.FC<{ username: string; xp: number; streak: number }> = ({ username, streak }) => {
  return (
    <div className="flex items-center justify-between py-6 px-2 bg-black">
      <Link to="/profile" className="flex flex-col group transition-all">
        <p className="text-xl font-bold text-white leading-none group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{username}</p>
      </Link>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10">
           <FireIcon className="w-5 h-5 text-orange-500" />
           <span className="text-lg font-black text-orange-500">{streak}</span>
        </div>
      </div>
    </div>
  );
};
