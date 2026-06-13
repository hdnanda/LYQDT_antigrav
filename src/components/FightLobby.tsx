
import React, { useState } from 'react';
import { FightArena } from './FightArena';
import { FightMatchmaker } from './FightMatchmaker';
import { LobbyCard } from './LobbyCard';
import { SwordsIcon } from './Icons';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

interface FightLobbyProps {
  onBack: () => void;
  onGameToggle: (active: boolean) => void;
}

export const FightLobby: React.FC<FightLobbyProps> = ({ onBack, onGameToggle }) => {
  const { user } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [activeMatch, setActiveMatch] = useState<{ id: string, role: 'saboteur' | 'fixer' } | null>(null);

  const handleStart = () => {
    setIsStarted(true);
    onGameToggle(true);
  };

  const handleBack = () => {
    setIsStarted(false);
    setActiveMatch(null);
    onGameToggle(false);
  };

  const handleMatchFound = (matchId: string, role: 'saboteur' | 'fixer') => {
    setActiveMatch({ id: matchId, role });
  };

  if (activeMatch) {
    return <FightArena matchId={activeMatch.id} role={activeMatch.role} onBack={handleBack} />;
  }

  if (isStarted) {
    return <FightMatchmaker onMatchFound={handleMatchFound} onCancel={handleBack} />;
  }

  const displayName = user?.username || "Player";
  const safeXP = user?.xp || 0;
  const safeStreak = user?.currentStreak || 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-black">
      {/* Header */}
      <div className="px-6 pt-4 z-30 shrink-0">
        <Header username={displayName} xp={safeXP} streak={safeStreak} />
      </div>

      <div className="flex-1 p-6 flex flex-col h-full">
        <LobbyCard
          title="Battle Arena"
          description="High-stakes business simulation. Risk it all for reputation."
          icon={SwordsIcon}
          buttonText="Enter Arena"
          onStart={handleStart}
          color="text-red-500"
        />
      </div>
    </div>
  );
};
