import React from 'react';
import { motion } from 'framer-motion';

interface PathConnectorProps {
  startX: number; // Offset from center (e.g. -60, 0, 60)
  endX: number;
  height?: number;
  status: 'locked' | 'unlocked';
}

const MotionPath = motion.path as any;

export const PathConnector: React.FC<PathConnectorProps> = ({ startX, endX, height = 100, status }) => {
  // We define a fixed canvas width wide enough to handle the sway (e.g. 300px)
  // Center is at 150px.
  const CENTER = 150;
  const sX = CENTER + startX;
  const eX = CENTER + endX;
  
  // Bezier Control Points
  // CP1: Vertical drop from start
  // CP2: Vertical approach to end
  const cp1Y = height * 0.4; 
  const cp2Y = height * 0.6; 

  // Path Data: Move to Start, Curve to End
  const pathD = `M ${sX} 0 C ${sX} ${cp1Y}, ${eX} ${cp2Y}, ${eX} ${height}`;
  
  const isUnlocked = status === 'unlocked';

  return (
    <div 
        className="pointer-events-none"
        style={{ 
            width: 300, 
            height: height, 
            position: 'relative', 
            // Center the container horizontally
            marginLeft: 'auto',
            marginRight: 'auto',
            zIndex: 0
        }}
    >
      <svg width="300" height={height} style={{ overflow: 'visible' }}>
        {/* 1. The Track (Grey Line) */}
        <path
          d={pathD}
          stroke="#334155" // slate-700
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* 2. The Liquid Fill (Green Line) */}
        {isUnlocked && (
          <MotionPath
            d={pathD}
            stroke="#10b981" // emerald-500
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ 
                // Add a glow effect to the liquid
                filter: 'drop-shadow(0px 0px 4px rgba(16, 185, 129, 0.6))' 
            }}
          />
        )}
      </svg>
    </div>
  );
};
