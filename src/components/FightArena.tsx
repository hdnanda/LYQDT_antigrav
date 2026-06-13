import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Search, Shield, Ghost, User, X, Zap } from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from '../services/firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { BattleInterface } from './BattleInterface';

type MatchState = 'IDLE' | 'SEARCHING' | 'MATCHED' | 'BATTLE';

interface Opponent {
  name: string;
  isBot: boolean;
  avatar?: string;
}

interface FightArenaProps {
  matchId: string;
  role: 'saboteur' | 'fixer';
  onBack: () => void;
}

export const FightArena: React.FC<FightArenaProps> = ({ matchId, role, onBack }) => {
  const { user } = useAuth();
  const [matchState, setMatchState] = useState<MatchState>('BATTLE');
  const [gameMode, setGameMode] = useState<'RANKED' | 'CASUAL'>('RANKED');

  const handleBattleEnd = () => {
    onBack();
  };

  // If in Battle, render the Interface directly
  if (matchState === 'BATTLE' && user) {
    return (
      <BattleInterface 
        gameMode={gameMode}
        onBack={handleBattleEnd}
        matchId={matchId}
        role={role}
      />
    );
  }

  return null;
};
