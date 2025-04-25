import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '@/lib/stores/useGame';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useLevels } from '@/lib/stores/useLevels';
import { useCollectibles } from '@/lib/stores/useCollectibles';
import { useAudio } from '@/lib/stores/useAudio';
import { getLevelData } from '@/lib/levelData';

// Simple version of game canvas that just focuses on pause functionality
export default function GameCanvasSimple() {
  // Basic state
  const [levelData, setLevelData] = useState<any>(null);
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game stores
  const { phase } = useGame();
  const { currentWorld, currentLevel } = useLevels();
  const { resetPlayer } = usePlayer();
  const { resetCollectibles } = useCollectibles();
  
  // Load level data
  useEffect(() => {
    try {
      console.log(`Loading level: World ${currentWorld}, Level ${currentLevel}`);
      
      resetPlayer();
      resetCollectibles();
      
      const level = getLevelData(currentWorld, currentLevel);
      setLevelData(level);
      
      console.log("Level loaded successfully:", level);
    } catch (error) {
      console.error("Error loading level data:", error);
    }
  }, [currentWorld, currentLevel, resetPlayer, resetCollectibles]);
  
  // Set up pause functionality
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.code);
      // Toggle pause when Enter or P key is pressed
      if (e.code === 'Enter' || e.code === 'KeyP') {
        setIsPaused(prevState => !prevState);
        console.log("Pause toggled:", !isPaused);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPaused]);
  
  // Draw the pause screen if paused
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Simple drawing function
    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw simple background
      ctx.fillStyle = levelData?.backgroundColor || '#87CEEB';
      ctx.fillRect(0, 0, width, height);
      
      // Draw a simple player
      ctx.fillStyle = '#FF6347';
      ctx.fillRect(width / 2 - 20, height / 2 - 20, 40, 40);
      
      // Draw pause overlay if paused
      if (isPaused) {
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);
        
        // Pause text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PAUSED', width / 2, height / 2 - 30);
        ctx.font = '16px Arial';
        ctx.fillText('Press ENTER or P to continue', width / 2, height / 2 + 30);
      } else {
        // Pause hint
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(width - 200, height - 40, 190, 30);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ENTER or P to pause', width - 105, height - 25);
      }
    };
    
    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Draw initial state
    draw();
    
    // Set up animation loop
    let animationFrameId = 0;
    
    const animate = () => {
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, levelData]);
  
  // Loading state
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
          imageRendering: 'pixelated'
        }} 
      />
    </div>
  );
}