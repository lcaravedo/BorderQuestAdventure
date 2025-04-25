import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useLevels } from '@/lib/stores/useLevels';
import { useCollectibles } from '@/lib/stores/useCollectibles';
import { useAudio } from '@/lib/stores/useAudio';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, DASH_MULTIPLIER } from '@/lib/consts';
import { getLevelData } from '@/lib/levelData';

// Create a simplified 2D game component using canvas directly
export default function Game2DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [levelData, setLevelData] = useState<any>(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  
  // Game state
  const { phase } = useGame();
  const { currentWorld, currentLevel, unlockNextLevel, setCurrentLevel } = useLevels();
  const { 
    resetPlayer,
    resetGame, 
    position, 
    setPosition, 
    takeDamage, 
    heal, 
    powerUp, 
    health,
    hearts,
    maxHealth,
    isPoweredUp,
    isGameOver
  } = usePlayer();
  const { resetCollectibles, collectItem } = useCollectibles();
  const { playHit, playSuccess } = useAudio();
  
  // Invincibility state (for power-ups and temporary invincibility after getting hit)
  const [isInvincible, setIsInvincible] = useState(false);
  
  // Scoring system
  const [score, setScore] = useState(0);
  
  // Pause state - this is the key for our pause functionality
  const [isPaused, setIsPaused] = useState(false);
  
  // Set up keyboard controls for pausing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle pause when Enter or P key is pressed
      if (e.code === 'Enter' || e.code === 'KeyP') {
        setIsPaused(prevPaused => !prevPaused);
        console.log("Game paused via canvas: ", !isPaused);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused]);
  
  // Draw the pause screen and UI
  const drawPauseScreen = (ctx: CanvasRenderingContext2D) => {
    if (isPaused) {
      // Add semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      // Draw pause text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', width/2, height/2 - 50);
      
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillText('Press ENTER or P to continue', width/2, height/2 + 20);
    } else {
      // Show pause hint at bottom right
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(width - 200, height - 40, 190, 30);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ENTER or P to pause', width - 105, height - 25);
    }
  };
  
  // If level data isn't loaded yet, show loading state
  if (!levelData) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          background: '#000'
        }}
      >
        <h2 style={{ color: '#fff' }}>Loading Level...</h2>
      </div>
    );
  }
  
  return (
    <div className="game-container" style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',  // Apply pixelated rendering for retro look
          background: levelData.backgroundColor || '#87CEEB'
        }} 
      />
    </div>
  );
}