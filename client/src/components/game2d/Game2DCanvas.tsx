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
    resetPowerUp,
    health,
    hearts,
    maxHealth,
    isPoweredUp,
    powerUpTimeRemaining,
    isGameOver
  } = usePlayer();
  const { resetCollectibles, collectItem } = useCollectibles();
  const { playHit, playSuccess } = useAudio();
  
  // Invincibility state (for power-ups and temporary invincibility after getting hit)
  const [isInvincible, setIsInvincible] = useState(false);
  
  // Scoring system
  const [score, setScore] = useState(0);
  
  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      // Toggle pause state with ENTER key
      if (e.code === 'Enter' && phase === 'playing') {
        setIsPaused(prev => !prev);
      }
      
      // Attack with 'KeyM'
      if (e.code === 'KeyM' && !attackCooldownRef.current) {
        isAttackingRef.current = true;
        attackCooldownRef.current = true;
        
        // Create sword hitbox
        swordHitboxRef.current = {
          x: isFacingRightRef.current ? 
             playerPosRef.current.x + playerSizeRef.current.width / 2 : 
             playerPosRef.current.x - playerSizeRef.current.width / 2 - 20,
          y: playerPosRef.current.y,
          width: 30,
          height: 20,
          active: true
        };
        
        // Set attack cooldown
        setTimeout(() => {
          isAttackingRef.current = false;
          swordHitboxRef.current.active = false;
        }, 200);
        
        setTimeout(() => {
          attackCooldownRef.current = false;
        }, 400);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Animation and game loop reference
  const animationFrameIdRef = useRef<number>(0);
  const gameInitializedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  
  // Player state
  const playerPosRef = useRef({ x: 100, y: 100 });
  const playerVelRef = useRef({ x: 0, y: 0 });
  const playerSizeRef = useRef({ width: 40, height: 40 });
  const isGroundedRef = useRef(false);
  const isFacingRightRef = useRef(true);
  const keysPressed = useRef<Set<string>>(new Set());
  const isAttackingRef = useRef(false);
  const attackCooldownRef = useRef(false);
  const lastCheckpointRef = useRef({ x: 100, y: 100 });
  
  // Camera and level state
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  const levelProgressRef = useRef(0);
  const obstaclesRef = useRef<Array<any>>([]);
  const enemiesRef = useRef<Array<any>>([]);
  const projectilesRef = useRef<Array<any>>([]);
  const swordHitboxRef = useRef({ x: 0, y: 0, width: 0, height: 0, active: false });
  
  // Game resources
  const textures = useRef<Record<string, HTMLImageElement>>({});
  
  // Setup powerup timer effect
  useEffect(() => {
    // Clear existing timer when component unmounts or re-renders
    const powerUpTimerRef = useRef<number | null>(null);
    
    if (isPoweredUp && powerUpTimeRemaining > 0) {
      powerUpTimerRef.current = window.setTimeout(() => {
        // Reset power up state after timer expires
        resetPowerUp();
        console.log("Power-up expired!");
      }, powerUpTimeRemaining) as unknown as number;
    }
    
    // Cleanup when unmounting
    return () => {
      if (powerUpTimerRef.current) {
        clearTimeout(powerUpTimerRef.current);
      }
    };
  }, [isPoweredUp, powerUpTimeRemaining, resetPowerUp]);

  // Load level data when level changes
  useEffect(() => {
    try {
      console.log(`Loading level: World ${currentWorld}, Level ${currentLevel}`);
      
      // Reset player and collectibles
      resetPlayer();
      resetCollectibles();
      
      // Reset camera and level progress
      cameraOffsetRef.current = { x: 0, y: 0 };
      levelProgressRef.current = 0;
      
      // Clear enemies
      enemiesRef.current = [];
      
      // Get level data for current level
      const data = getLevelData(currentWorld, currentLevel);
      console.log("Level data loaded:", data ? "success" : "failed");
      
      // Generate level length based on world and level
      const levelLength = 5000 + (currentWorld * 1000) + (currentLevel * 500);
      
      // Set up base level data
      const baseData = {
        playerSpawn: [100, height - 100, 0],
        platforms: [{ position: [levelLength / 2, height - 25, 0], size: [levelLength, 50, 0], color: "#8B4513" }],
        bounds: { min: 0, max: levelLength },
        backgroundColor: currentWorld === 0 ? '#87CEEB' : // Sky blue
                       currentWorld === 1 ? '#228B22' : // Forest green
                       currentWorld === 2 ? '#F5DEB3' : // Desert tan
                       currentWorld === 3 ? '#708090' : // Slate gray
                       '#87CEEB', // Default to sky blue
        groundColor: currentWorld === 0 ? '#8B4513' : // Brown
                   currentWorld === 1 ? '#006400' : // Dark green
                   currentWorld === 2 ? '#D2B48C' : // Tan
                   currentWorld === 3 ? '#A9A9A9' : // Dark gray
                   '#8B4513', // Default to brown
        exit: [levelLength - 100, height - 70, 0] // Border fence positioned on the ground
      };
      
      setLevelData({...data, ...baseData});
      
      // Set player spawn point
      playerPosRef.current = { 
        x: 100, 
        y: height - 100
      };
      
      // Update player position in the store
      setPosition([100, height - 100, 0]);
      
    } catch (error) {
      console.error("Error loading level:", error);
      // Fallback to default level if there's an error
      setLevelData({
        playerSpawn: [100, height - 100, 0],
        platforms: [{ position: [width / 2, height - 25, 0], size: [width, 50, 0], color: "#8B4513" }],
        bounds: { min: 0, max: width * 3 },
        backgroundColor: "#87CEEB",
        groundColor: "#8B4513",
        exit: [width * 3 - 100, height - 100, 0]
      });
    }
  }, [currentLevel, currentWorld, resetPlayer, resetCollectibles, setPosition, height, width]);
  
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
    <div className="game-canvas-container">
      <canvas 
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />
      
      {/* Game UI overlays */}
      <div 
        className="game-ui" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          pointerEvents: 'none'
        }}
      >
        {/* Health display */}
        <div style={{ padding: '10px', display: 'flex', alignItems: 'center' }}>
          {Array.from({ length: maxHealth }).map((_, i) => (
            <div 
              key={i}
              style={{
                width: '20px',
                height: '20px',
                margin: '0 5px',
                backgroundColor: i < health ? '#FF0000' : '#333333',
                borderRadius: '50%'
              }}
            />
          ))}
          
          {/* Lives remaining */}
          <div style={{ marginLeft: '20px', color: '#FFF', fontFamily: '"Press Start 2P", monospace' }}>
            Lives: {hearts}
          </div>
          
          {/* Score */}
          <div style={{ marginLeft: '20px', color: '#FFF', fontFamily: '"Press Start 2P", monospace' }}>
            Score: {score}
          </div>
          
          {/* Power-up status */}
          {isPoweredUp && (
            <div style={{ 
              marginLeft: '20px', 
              color: '#FFFF00', 
              fontFamily: '"Press Start 2P", monospace',
              padding: '5px 10px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '5px',
              border: '2px solid #FFFF00'
            }}>
              POWERED UP! {Math.ceil(powerUpTimeRemaining / 1000)}s
            </div>
          )}
        </div>
      </div>
      
      {/* Game Over screen */}
      {isGameOver && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#FF0000',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '24px'
          }}
        >
          <h1>GAME OVER</h1>
          <p style={{ color: '#FFF', marginTop: '20px' }}>Final Score: {score}</p>
          <button 
            onClick={resetGame}
            style={{
              marginTop: '30px',
              padding: '10px 20px',
              backgroundColor: '#FF0000',
              color: '#FFF',
              border: 'none',
              fontFamily: '"Press Start 2P", monospace',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Pause screen */}
      {isPaused && !isGameOver && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#FFFFFF',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '24px'
          }}
        >
          <h1>PAUSED</h1>
          <p style={{ marginTop: '20px', fontSize: '16px' }}>Press ENTER to continue</p>
        </div>
      )}
    </div>
  );
}