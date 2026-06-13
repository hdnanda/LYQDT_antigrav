
import React, { useState } from 'react';
import { SpeedRound } from './SpeedRound';
import { LobbyCard } from './LobbyCard';
import { ZapIcon } from './Icons';
import { Header } from './Header';
import { useAuth } from '../contexts/AuthContext';

interface SpeedLobbyProps {
  onBack: () => void;
  onGameToggle: (active: boolean) => void;
}

export const SpeedLobby: React.FC<SpeedLobbyProps> = ({ onBack, onGameToggle }) => {
  const { user } = useAuth();
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = () => {
    setIsStarted(true);
    onGameToggle(true);
  };

  const handleBack = () => {
    setIsStarted(false);
    onGameToggle(false);
  };

  if (isStarted) {
    return <SpeedRound onBack={handleBack} />;
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
          title="Speed Round"
          description="Rapid-fire financial questions. 30 seconds on the clock."
          icon={ZapIcon}
          buttonText="Start Run"
          onStart={handleStart}
          color="text-orange-500"
        />
      </div>
    </div>
  );
};
