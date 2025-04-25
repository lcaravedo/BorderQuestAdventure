import React, { useEffect, useState, useRef } from 'react';
import { Stage, Container, Sprite, Text } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { useGame } from '@/lib/stores/useGame';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useLevels } from '@/lib/stores/useLevels';
import { useCollectibles } from '@/lib/stores/useCollectibles';
import { useAudio } from '@/lib/stores/useAudio';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, DASH_MULTIPLIER } from '@/lib/consts';
import { getLevelData } from '@/lib/levelData';

// Create custom PIXI loader for textures
const textureLoader = (path: string): PIXI.Texture => {
  return PIXI.Texture.from(path);
};

export default function Game2D() {
  const gameRef = useRef<PIXI.Application | null>(null);
  const stageRef = useRef<PIXI.Container | null>(null);
  const [levelData, setLevelData] = useState<any>(null);
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  
  // Get game state from global stores
  const { phase } = useGame();
  const { currentWorld, currentLevel } = useLevels();
  const { resetPlayer, position: playerPosition, setPlayerSpawn } = usePlayer();
  const { resetCollectibles } = useCollectibles();
  
  // Game loop variables
  const lastTimeRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
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
  }, []);
  
  // Load level data when level changes
  useEffect(() => {
    try {
      console.log(`Loading level: World ${currentWorld}, Level ${currentLevel}`);
      
      // Reset player and collectibles
      resetPlayer();
      resetCollectibles();
      
      // Get level data for current level
      const data = getLevelData(currentWorld, currentLevel);
      console.log("Level data loaded:", data ? "success" : "failed");
      setLevelData(data);
      
      // Set player spawn point from level data
      if (data?.playerSpawn) {
        setPlayerSpawn(data.playerSpawn);
      }
    } catch (error) {
      console.error("Error loading level:", error);
      // Fallback to default level if there's an error
      setLevelData({
        playerSpawn: [0, 100, 0],
        platforms: [{ position: [0, height - 50, 0], size: [width, 50, 0], color: "#8B4513" }],
        bounds: { min: 0, max: width },
        backgroundColor: "#87CEEB",
        groundColor: "#8B4513",
        exit: [width - 100, height - 100, 0]
      });
    }
  }, [currentLevel, currentWorld, resetPlayer, resetCollectibles, setPlayerSpawn, height, width]);
  
  // Main game loop
  useEffect(() => {
    if (phase !== 'playing' || !levelData) return;
    
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      
      // Update game state here
      // This will be replaced with the actual game physics and logic
      
      requestAnimationFrame(gameLoop);
    };
    
    const animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [phase, levelData]);
  
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
  
  // Parse colors for PIXI
  const bgColor = parseInt(levelData.backgroundColor?.replace('#', '0x') || '0x87CEEB', 16);
  const groundColor = parseInt(levelData.groundColor?.replace('#', '0x') || '0x8B4513', 16);
  
  return (
    <Stage
      width={width}
      height={height}
      options={{ 
        backgroundColor: bgColor,
        antialias: false, // Disable anti-aliasing for pixel art
        resolution: window.devicePixelRatio || 1
      }}
    >
      {/* Game world container - will move to implement camera tracking */}
      <Container>
        {/* Background */}
        <Sprite 
          texture={PIXI.Texture.WHITE} 
          width={width} 
          height={height}
          tint={bgColor}
        />
        
        {/* Ground */}
        <Sprite 
          texture={PIXI.Texture.WHITE} 
          width={width}
          height={50}
          x={0}
          y={height - 50}
          tint={groundColor}
        />
        
        {/* Platforms - placeholder until we create Platform2D component */}
        {levelData.platforms?.map((platform: any, index: number) => (
          <Sprite
            key={`platform-${index}`}
            texture={PIXI.Texture.WHITE}
            width={platform.size[0]}
            height={platform.size[1]}
            x={platform.position[0]}
            y={platform.position[1]}
            tint={parseInt(platform.color?.replace('#', '0x') || '0x8B4513', 16)}
          />
        ))}
        
        {/* Character - placeholder until we create Character2D component */}
        <Sprite
          texture={textureLoader('/textures/chihuahua.svg')}
          width={40}
          height={40}
          x={levelData.playerSpawn[0]}
          y={levelData.playerSpawn[1]}
          anchor={0.5}
        />
        
        {/* Level exit */}
        {levelData.exit && (
          <Container 
            x={levelData.exit[0]} 
            y={levelData.exit[1]}
          >
            <Sprite
              texture={PIXI.Texture.WHITE}
              width={50}
              height={80}
              tint={0x4422FF}
              alpha={0.8}
              anchor={0.5}
            />
          </Container>
        )}
      </Container>
    </Stage>
  );
}