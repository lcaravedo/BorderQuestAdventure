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
  const { currentWorld, currentLevel } = useLevels();
  const { resetPlayer, position, setPosition } = usePlayer();
  const { resetCollectibles } = useCollectibles();
  const { playHit, playSuccess } = useAudio();
  
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
  
  // Game resources
  const textures = useRef<Record<string, HTMLImageElement>>({});
  
  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      // Immediately handle jump to make controls more responsive
      if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && isGroundedRef.current) {
        playerVelRef.current.y = -JUMP_FORCE;
        isGroundedRef.current = false;
        playHit();
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
  }, [playHit]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        playerPosRef.current = { 
          x: data.playerSpawn[0], 
          y: data.playerSpawn[1]
        };
        
        // Update player position in the store
        setPosition([data.playerSpawn[0], data.playerSpawn[1], 0]);
      }
    } catch (error) {
      console.error("Error loading level:", error);
      // Fallback to default level if there's an error
      setLevelData({
        playerSpawn: [100, 100, 0],
        platforms: [{ position: [0, height - 50, 0], size: [width, 50, 0], color: "#8B4513" }],
        bounds: { min: 0, max: width },
        backgroundColor: "#87CEEB",
        groundColor: "#8B4513",
        exit: [width - 100, height - 100, 0]
      });
    }
  }, [currentLevel, currentWorld, resetPlayer, resetCollectibles, setPosition, height, width]);
  
  // Preload textures
  useEffect(() => {
    const loadTexture = (name: string, src: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          textures.current[name] = img;
          resolve();
        };
        img.src = src;
      });
    };
    
    // Load character and game textures
    Promise.all([
      loadTexture('character', '/textures/chihuahua.svg'),
      loadTexture('bone', '/textures/bone.svg'),
      loadTexture('visa', '/textures/visa.svg'),
      loadTexture('snack', '/textures/snack.svg'),
      loadTexture('cat', '/textures/cat_enemy.svg'),
      loadTexture('platform', '/textures/tileset.svg'),
    ]).then(() => {
      console.log('All textures loaded');
    });
    
    return () => {
      // Clean up
      textures.current = {};
    };
  }, []);
  
  // Main game rendering and update loop
  useEffect(() => {
    if (!canvasRef.current || !levelData || phase !== 'playing') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size for higher quality
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Enable pixelated rendering for retro look
    ctx.imageSmoothingEnabled = false;
    
    // Create game objects from level data
    const platforms = levelData.platforms || [];
    const collectibles = levelData.collectibles || [];
    const enemies = levelData.enemies || [];
    const exit = levelData.exit || [width - 100, height - 100, 0];
    
    // Set up the game loop
    const gameLoop = (timestamp: number) => {
      // Time delta for smooth animation
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 16; // Normalize to ~60fps
      lastTimeRef.current = timestamp;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = levelData.backgroundColor || '#87CEEB';
      ctx.fillRect(0, 0, width, height);
      
      // Draw ground
      ctx.fillStyle = levelData.groundColor || '#8B4513';
      ctx.fillRect(0, height - 50, width, 50);
      
      // Draw platforms
      platforms.forEach((platform: any) => {
        ctx.fillStyle = platform.color || '#8B4513';
        ctx.fillRect(
          platform.position[0] - platform.size[0] / 2, 
          platform.position[1] - platform.size[1] / 2, 
          platform.size[0], 
          platform.size[1]
        );
      });
      
      // Draw exit portal
      ctx.fillStyle = '#4422FF';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(exit[0] - 25, exit[1] - 40, 50, 80);
      ctx.globalAlpha = 1.0;
      
      // Draw collectibles
      collectibles.forEach((collectible: any) => {
        const texture = textures.current[collectible.type] || null;
        if (texture) {
          ctx.drawImage(
            texture,
            collectible.position[0] - 15,
            collectible.position[1] - 15 + Math.sin(timestamp * 0.003) * 5, // Hover animation
            30,
            30
          );
        } else {
          // Fallback if texture isn't loaded
          ctx.fillStyle = collectible.type === 'bone' ? '#FFFFFF' : 
                        collectible.type === 'visa' ? '#66EE66' : 
                        '#FFDD44';
          ctx.beginPath();
          ctx.arc(
            collectible.position[0],
            collectible.position[1] + Math.sin(timestamp * 0.003) * 5,
            15,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      });
      
      // Draw enemies
      enemies.forEach((enemy: any) => {
        const texture = textures.current[enemy.type] || null;
        if (texture) {
          ctx.drawImage(
            texture,
            enemy.position[0] - 20,
            enemy.position[1] - 20,
            40,
            40
          );
        } else {
          // Fallback if texture isn't loaded
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(enemy.position[0] - 20, enemy.position[1] - 20, 40, 40);
        }
      });
      
      // Handle player movement
      const left = keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA');
      const right = keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD');
      
      if (left) {
        playerVelRef.current.x = -MOVE_SPEED * deltaTime;
        isFacingRightRef.current = false;
      } else if (right) {
        playerVelRef.current.x = MOVE_SPEED * deltaTime;
        isFacingRightRef.current = true;
      } else {
        // Apply friction
        playerVelRef.current.x *= 0.8;
      }
      
      // Apply gravity
      playerVelRef.current.y += GRAVITY * 0.1 * deltaTime;
      
      // Update position
      playerPosRef.current.x += playerVelRef.current.x;
      playerPosRef.current.y += playerVelRef.current.y;
      
      // Simple ground collision
      if (playerPosRef.current.y > height - 70) {
        playerPosRef.current.y = height - 70;
        playerVelRef.current.y = 0;
        isGroundedRef.current = true;
      }
      
      // Simple platform collision
      platforms.forEach((platform: any) => {
        const platformX = platform.position[0];
        const platformY = platform.position[1];
        const platformWidth = platform.size[0];
        const platformHeight = platform.size[1];
        
        const playerLeft = playerPosRef.current.x - playerSizeRef.current.width / 2;
        const playerRight = playerPosRef.current.x + playerSizeRef.current.width / 2;
        const playerTop = playerPosRef.current.y - playerSizeRef.current.height / 2;
        const playerBottom = playerPosRef.current.y + playerSizeRef.current.height / 2;
        
        const platformLeft = platformX - platformWidth / 2;
        const platformRight = platformX + platformWidth / 2;
        const platformTop = platformY - platformHeight / 2;
        const platformBottom = platformY + platformHeight / 2;
        
        // Check if player is colliding with platform
        if (
          playerRight > platformLeft &&
          playerLeft < platformRight &&
          playerBottom > platformTop &&
          playerTop < platformBottom
        ) {
          // Determine which side of the platform the player is colliding with
          const overlapLeft = playerRight - platformLeft;
          const overlapRight = platformRight - playerLeft;
          const overlapTop = playerBottom - platformTop;
          const overlapBottom = platformBottom - playerTop;
          
          // Find the smallest overlap
          const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
          
          // Resolve collision based on the smallest overlap
          if (minOverlap === overlapTop && playerVelRef.current.y > 0) {
            // Colliding with top of platform
            playerPosRef.current.y = platformTop - playerSizeRef.current.height / 2;
            playerVelRef.current.y = 0;
            isGroundedRef.current = true;
          } else if (minOverlap === overlapBottom && playerVelRef.current.y < 0) {
            // Colliding with bottom of platform
            playerPosRef.current.y = platformBottom + playerSizeRef.current.height / 2;
            playerVelRef.current.y = 0;
          } else if (minOverlap === overlapLeft && playerVelRef.current.x > 0) {
            // Colliding with left side of platform
            playerPosRef.current.x = platformLeft - playerSizeRef.current.width / 2;
            playerVelRef.current.x = 0;
          } else if (minOverlap === overlapRight && playerVelRef.current.x < 0) {
            // Colliding with right side of platform
            playerPosRef.current.x = platformRight + playerSizeRef.current.width / 2;
            playerVelRef.current.x = 0;
          }
        }
      });
      
      // Update player position in the store
      setPosition([playerPosRef.current.x, playerPosRef.current.y, 0]);
      
      // Draw player character
      const playerTexture = textures.current['character'] || null;
      if (playerTexture) {
        // Draw character with proper facing direction
        ctx.save();
        if (!isFacingRightRef.current) {
          // Flip horizontally if facing left
          ctx.translate(playerPosRef.current.x * 2, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(
          playerTexture,
          isFacingRightRef.current ? playerPosRef.current.x - 20 : playerPosRef.current.x - 20,
          playerPosRef.current.y - 20,
          40,
          40
        );
        ctx.restore();
      } else {
        // Fallback if texture isn't loaded
        ctx.fillStyle = '#FF9900'; // Orange
        ctx.fillRect(
          playerPosRef.current.x - 20,
          playerPosRef.current.y - 20,
          40,
          40
        );
      }
      
      // Request next frame
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    gameInitializedRef.current = true;
    
    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      gameInitializedRef.current = false;
    };
  }, [levelData, width, height, phase, setPosition, playSuccess]);
  
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