import React, { createContext, useContext, useState, useCallback } from 'react';
import { type SpeedScenario, getHardcodedByCategory } from '../data/SpeedRoundData';
import { fetchAiScenarios } from '../services/scenarioManager';

interface GameContextType {
  currentScenarios: SpeedScenario[];
  preloadScenarios: (level: number) => Promise<void>;
  loadFallback: () => void;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScenarios, setCurrentScenarios] = useState<SpeedScenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pure fallback logic (instant 15 hardcoded generic)
  const loadFallback = useCallback(() => {
       console.log("GameContext: Loading pure fallback data.");
       const fallback = getHardcodedByCategory('general', 15);
       setCurrentScenarios(fallback);
  }, []);

  const preloadScenarios = useCallback(async (level: number) => {
    setIsLoading(true);
    try {
      console.log(`GameContext: Starting Level ${level} (Optimized AI Strategy)`);
      
      // Step 1: Instant Batch (3 cards) - Fast load to unlock UI
      const initialBatch = await fetchAiScenarios(3, level);
      
      if (initialBatch && initialBatch.length > 0) {
          console.log(`⚡ Initial AI Batch Loaded: ${initialBatch.length} cards. Starting game...`);
          setCurrentScenarios(initialBatch);
          setIsLoading(false); // Unlock UI immediately

          // Step 2: Background Batch (12 cards) - Silent load
          fetchAiScenarios(12, level).then(backgroundBatch => {
              if (backgroundBatch && backgroundBatch.length > 0) {
                  console.log(`⚡ Background AI Loaded: Adding ${backgroundBatch.length} cards.`);
                  setCurrentScenarios(prev => [...prev, ...backgroundBatch]);
              } else {
                  console.warn("Background AI fetch failed/empty. Filling with fallback.");
                  const fallback = getHardcodedByCategory('general', 12);
                  setCurrentScenarios(prev => [...prev, ...fallback]);
              }
          });

      } else {
           console.log("Initial AI fetch failed. Falling back to hardcoded.");
           loadFallback();
           setIsLoading(false);
      }

    } catch (error) {
      console.error("Failed to preload scenarios:", error);
      loadFallback();
      setIsLoading(false);
    }
  }, [loadFallback]);

  return (
    <GameContext.Provider value={{ currentScenarios, preloadScenarios, loadFallback, isLoading }}>
      {children}
    </GameContext.Provider>
  );
};