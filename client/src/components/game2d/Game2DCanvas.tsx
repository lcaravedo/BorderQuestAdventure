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
  const keysPressed = useRef(new Set<string>());
  const isJumpingRef = useRef(false);
  const attackCooldownRef = useRef(false);
  const isAttackingRef = useRef(false);
  const swordHitboxRef = useRef<any>({ active: false });
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  const obstaclesRef = useRef<any[]>([]);
  const lastCheckpointRef = useRef({ x: 100, y: 200 });
  const textures = useRef<Record<string, HTMLImageElement>>({});
  
  // Load level data when level changes
  useEffect(() => {
    try {
      console.log(`Loading level: World ${currentWorld}, Level ${currentLevel}`);
      
      // Reset player and collectibles
      resetPlayer();
      resetCollectibles();
      
      // Reset camera and level progress
      cameraOffsetRef.current = { x: 0, y: 0 };
      obstaclesRef.current = [];
      lastCheckpointRef.current = { x: 100, y: 200 };
      
      // Get level data
      const level = getLevelData(currentWorld, currentLevel);
      setLevelData(level);
      
      // Set up initial player position from playerSpawn
      if (level?.playerSpawn) {
        // Convert 3D coordinates to 2D for canvas
        // Scale factors to convert from 3D to pixel coordinates
        const scaleX = 100; // 1 unit in 3D = 100px in 2D
        const scaleY = 100;
        
        playerPosRef.current = {
          x: level.playerSpawn[0] * scaleX + 100, // Add offset to start
          y: height - (level.playerSpawn[1] * scaleY) - 50 // Invert Y and offset from bottom
        };
      } else {
        playerPosRef.current = { x: 100, y: height - 100 };
      }
      
      playerVelRef.current = { x: 0, y: 0 };
      
      // Convert platforms to obstacles
      if (level?.platforms) {
        const scaleX = 100; // 1 unit in 3D = 100px in 2D
        const scaleY = 100;
        
        level.platforms.forEach((platform: any) => {
          // Extract position and size from 3D data
          const [x, y, z] = platform.position;
          const [width, height, depth] = platform.size;
          
          // Convert to 2D canvas coordinates
          obstaclesRef.current.push({
            type: 'platform',
            x: x * scaleX,
            y: height - (y * scaleY) - (platform.size[1] * scaleY), // Invert Y coordinate
            width: width * scaleX,
            height: platform.size[1] * scaleY,
            color: platform.color || '#8B4513',
            moving: platform.moving || false,
            movementAxis: platform.movementAxis || 'x',
            movementRange: platform.movementRange || 0,
            movementSpeed: platform.movementSpeed || 1,
            originalX: x * scaleX,
            originalY: height - (y * scaleY) - (platform.size[1] * scaleY)
          });
        });
      }
      
      // Add collectibles
      if (level?.collectibles) {
        const scaleX = 100; 
        const scaleY = 100;
        
        level.collectibles.forEach((collectible: any, index: number) => {
          const [x, y, z] = collectible.position;
          
          obstaclesRef.current.push({
            type: 'collectible',
            id: `collectible-${index}`,
            x: x * scaleX,
            y: height - (y * scaleY) - 30, // Slight offset for item height
            width: 30,
            height: 30,
            collectibleType: collectible.type || 'bone',
            collected: false
          });
        });
      }
      
      // Add enemies
      if (level?.enemies) {
        const scaleX = 100;
        const scaleY = 100;
        
        level.enemies.forEach((enemy: any, index: number) => {
          const [x, y, z] = enemy.position;
          const [minX, maxX] = enemy.patrolArea || [x - 2, x + 2];
          
          obstaclesRef.current.push({
            type: 'enemy',
            id: `enemy-${index}`,
            x: x * scaleX,
            y: height - (y * scaleY) - 40, // Offset for enemy height
            width: 40,
            height: 40,
            enemyType: enemy.type || 'cat',
            speed: enemy.speed || 1,
            patrolMinX: minX * scaleX,
            patrolMaxX: maxX * scaleX,
            direction: 1 // 1 = right, -1 = left
          });
        });
      }
      
      // Add checkpoint if not already defined
      if (!level?.checkpoints) {
        // Add default checkpoint at 1/3 of the level
        const levelWidth = level?.bounds?.max || 40;
        obstaclesRef.current.push({
          type: 'checkpoint',
          x: levelWidth * 100 / 3,
          y: height - 100,
          width: 40,
          height: 80,
          activated: false
        });
      } else {
        // Add checkpoints if defined
        const scaleX = 100;
        const scaleY = 100;
        
        level.checkpoints.forEach((checkpoint: [number, number]) => {
          obstaclesRef.current.push({
            type: 'checkpoint',
            x: checkpoint[0] * scaleX,
            y: height - (checkpoint[1] * scaleY) - 80, // Height of checkpoint
            width: 40,
            height: 80,
            activated: false
          });
        });
      }
      
      // Add exit/goal
      if (level?.exit) {
        const scaleX = 100;
        const scaleY = 100;
        
        obstaclesRef.current.push({
          type: 'exit',
          x: level.exit[0] * scaleX,
          y: height - (level.exit[1] * scaleY) - 60,
          width: 40,
          height: 60,
          reached: false
        });
      }
      
      console.log("Level loaded successfully:", level);
    } catch (error) {
      console.error("Error loading level data:", error);
    }
  }, [currentWorld, currentLevel, resetPlayer, resetCollectibles, height]);
  
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
  
  // Initialize the game and set up the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Initialize game variables
    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setWidth(newWidth);
      setHeight(newHeight);
      
      if (canvas) {
        canvas.width = newWidth;
        canvas.height = newHeight;
      }
    };
    
    // Load textures
    const loadTextures = async () => {
      try {
        // Texture mapping - name to file path
        const textureMap = {
          'player': '/textures/chihuahua.png',
          'enemy_cat': '/textures/cat.png',
          'enemy_drone': '/textures/drone.png',
          'enemy_snake': '/textures/snake.png',
          'enemy_frog': '/textures/frog.png',
          'collectible_bone': '/textures/bone.png',
          'collectible_visa': '/textures/visa.png',
          'collectible_snack': '/textures/snack.png',
          'obstacle': '/textures/obstacle.png',
          'checkpoint': '/textures/checkpoint.png',
          'exit': '/textures/exit.png',
          'background': '/textures/background.png',
          'heart': '/textures/heart.png',
        };
        
        // Load textures in parallel
        const loadPromises = Object.entries(textureMap).map(([name, path]) => {
          return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              textures.current[name] = img;
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load texture: ${path}`);
              resolve(); // Continue even if texture fails to load
            };
            img.src = path;
          });
        });
        
        await Promise.all(loadPromises);
        console.log('All textures loaded successfully');
      } catch (error) {
        console.error('Error loading textures:', error);
      }
    };
    
    // Set up keyboard input handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };
    
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start the game
    const initGame = async () => {
      // Avoid re-initializing if already done
      if (gameInitializedRef.current) return;
      
      await loadTextures();
      gameInitializedRef.current = true;
      
      // Start game loop
      const gameLoop = (timestamp: number) => {
        if (!gameInitializedRef.current) return;
        
        // Calculate delta time
        const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
        lastTimeRef.current = timestamp;
        
        // Don't update if paused
        if (!isPaused) {
          update(deltaTime);
        }
        
        // Always render
        render();
        
        // Continue loop
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
      };
      
      // Start game loop
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Initialize the game
    initGame();
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      gameInitializedRef.current = false;
    };
  }, [width, height, isPaused]);
  
  // Game update logic
  const update = (deltaTime: number) => {
    // Skip updates if game over
    if (isGameOver) return;
    
    // Player movement
    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA')) {
      playerVelRef.current.x = -MOVE_SPEED;
      isFacingRightRef.current = false;
    } else if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD')) {
      playerVelRef.current.x = MOVE_SPEED;
      isFacingRightRef.current = true;
    } else {
      playerVelRef.current.x = 0;
    }
    
    // Jump
    if ((keysPressed.current.has('ArrowUp') || keysPressed.current.has('KeyW') || 
         keysPressed.current.has('Space')) && isGroundedRef.current) {
      playerVelRef.current.y = -JUMP_FORCE;
      isGroundedRef.current = false;
      isJumpingRef.current = true;
    }
    
    // Dash
    const isDashing = keysPressed.current.has('ShiftLeft') || keysPressed.current.has('ShiftRight');
    const dashMultiplier = isDashing ? DASH_MULTIPLIER : 1;
    
    // Sword attack
    if (keysPressed.current.has('KeyM') && !attackCooldownRef.current) {
      isAttackingRef.current = true;
      attackCooldownRef.current = true;
      swordHitboxRef.current = {
        active: true,
        x: isFacingRightRef.current 
          ? playerPosRef.current.x + playerSizeRef.current.width 
          : playerPosRef.current.x - playerSizeRef.current.width/2,
        y: playerPosRef.current.y,
        width: playerSizeRef.current.width,
        height: playerSizeRef.current.height
      };
      
      // Reset attack after delay
      setTimeout(() => {
        isAttackingRef.current = false;
        swordHitboxRef.current.active = false;
      }, 300);
      
      // Reset cooldown after delay
      setTimeout(() => {
        attackCooldownRef.current = false;
      }, 800);
    }
    
    // Apply gravity
    playerVelRef.current.y += GRAVITY * deltaTime;
    
    // Apply velocity
    playerPosRef.current.x += playerVelRef.current.x * dashMultiplier * deltaTime;
    playerPosRef.current.y += playerVelRef.current.y * deltaTime;
    
    // Simple collision detection with obstacles
    isGroundedRef.current = false;
    
    for (const obstacle of obstaclesRef.current) {
      if (obstacle.type === 'platform') {
        // Check if player is on platform
        if (playerPosRef.current.y + playerSizeRef.current.height <= obstacle.y && 
            playerPosRef.current.y + playerSizeRef.current.height + playerVelRef.current.y * deltaTime >= obstacle.y &&
            playerPosRef.current.x + playerSizeRef.current.width > obstacle.x &&
            playerPosRef.current.x < obstacle.x + obstacle.width) {
          
          playerPosRef.current.y = obstacle.y - playerSizeRef.current.height;
          playerVelRef.current.y = 0;
          isGroundedRef.current = true;
          isJumpingRef.current = false;
        }
      } else if (obstacle.type === 'checkpoint' && !obstacle.activated) {
        // Check if player reached checkpoint
        if (playerPosRef.current.x + playerSizeRef.current.width > obstacle.x &&
            playerPosRef.current.x < obstacle.x + obstacle.width &&
            playerPosRef.current.y + playerSizeRef.current.height > obstacle.y &&
            playerPosRef.current.y < obstacle.y + obstacle.height) {
          
          // Activate checkpoint
          obstacle.activated = true;
          lastCheckpointRef.current = { x: obstacle.x, y: obstacle.y - playerSizeRef.current.height };
          console.log('Checkpoint activated at', lastCheckpointRef.current);
          playSuccess();
        }
      }
    }
    
    // Reset player position if fallen off the level
    if (playerPosRef.current.y > height + 200) {
      playerPosRef.current = { ...lastCheckpointRef.current };
      playerVelRef.current = { x: 0, y: 0 };
      takeDamage(1);
      playHit();
    }
    
    // Update camera position to follow player
    cameraOffsetRef.current = {
      x: playerPosRef.current.x - width / 2 + playerSizeRef.current.width / 2,
      y: playerPosRef.current.y - height / 2 + playerSizeRef.current.height / 2
    };
    
    // Ensure camera doesn't go beyond level bounds
    if (levelData && levelData.bounds) {
      if (cameraOffsetRef.current.x < levelData.bounds.min) {
        cameraOffsetRef.current.x = levelData.bounds.min;
      } else if (cameraOffsetRef.current.x > levelData.bounds.max - width) {
        cameraOffsetRef.current.x = levelData.bounds.max - width;
      }
    }
  };
  
  // Game rendering
  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = levelData?.backgroundColor || '#87CEEB';
    ctx.fillRect(0, 0, width, height);
    
    // Apply camera transform
    ctx.save();
    ctx.translate(-cameraOffsetRef.current.x, 0);
    
    // Draw platforms and obstacles
    for (const obstacle of obstaclesRef.current) {
      if (obstacle.type === 'platform') {
        ctx.fillStyle = obstacle.color || '#8B4513';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else if (obstacle.type === 'checkpoint') {
        ctx.fillStyle = obstacle.activated ? '#FFD700' : '#C0C0C0';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw Mexican with tequila for checkpoint
        if (textures.current['checkpoint']) {
          ctx.drawImage(
            textures.current['checkpoint'], 
            obstacle.x, 
            obstacle.y, 
            obstacle.width, 
            obstacle.height
          );
        }
      } else if (obstacle.type === 'collectible' && !obstacle.collected) {
        // Draw collectible
        ctx.fillStyle = '#FFD700'; // Default gold color
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw collectible texture based on type
        const textureKey = `collectible_${obstacle.collectibleType}`;
        if (textures.current[textureKey]) {
          ctx.drawImage(
            textures.current[textureKey],
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
          );
        }
      } else if (obstacle.type === 'enemy') {
        // Draw enemy
        ctx.fillStyle = '#FF0000'; // Default red color
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw enemy texture based on type
        const textureKey = `enemy_${obstacle.enemyType}`;
        if (textures.current[textureKey]) {
          ctx.drawImage(
            textures.current[textureKey],
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
          );
        }
      } else if (obstacle.type === 'exit') {
        // Draw exit/goal
        ctx.fillStyle = '#00FF00'; // Default green color
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw exit texture
        if (textures.current['exit']) {
          ctx.drawImage(
            textures.current['exit'],
            obstacle.x,
            obstacle.y,
            obstacle.width,
            obstacle.height
          );
        }
      }
    }
    
    // Draw player
    ctx.fillStyle = isPoweredUp ? '#FFD700' : '#FF6347';
    ctx.fillRect(
      playerPosRef.current.x, 
      playerPosRef.current.y, 
      playerSizeRef.current.width, 
      playerSizeRef.current.height
    );
    
    // Draw player texture if available
    if (textures.current['player']) {
      ctx.save();
      if (!isFacingRightRef.current) {
        // Flip horizontally if facing left
        ctx.scale(-1, 1);
        ctx.drawImage(
          textures.current['player'],
          -playerPosRef.current.x - playerSizeRef.current.width,
          playerPosRef.current.y,
          playerSizeRef.current.width,
          playerSizeRef.current.height
        );
      } else {
        ctx.drawImage(
          textures.current['player'],
          playerPosRef.current.x,
          playerPosRef.current.y,
          playerSizeRef.current.width,
          playerSizeRef.current.height
        );
      }
      ctx.restore();
    }
    
    // Draw sword attack if attacking
    if (isAttackingRef.current && swordHitboxRef.current.active) {
      ctx.fillStyle = '#C0C0C0';
      ctx.fillRect(
        swordHitboxRef.current.x,
        swordHitboxRef.current.y,
        swordHitboxRef.current.width / 2,
        swordHitboxRef.current.height / 2
      );
    }
    
    // Restore original transform
    ctx.restore();
    
    // Draw UI elements (not affected by camera)
    
    // Hearts/Health
    const heartSize = 30;
    const heartSpacing = 10;
    const startX = 20;
    const startY = 20;
    
    for (let i = 0; i < maxHealth; i++) {
      // Draw empty heart
      ctx.fillStyle = '#333333';
      ctx.fillRect(startX + i * (heartSize + heartSpacing), startY, heartSize, heartSize);
      
      // Draw filled heart if health is high enough
      if (i < health) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(startX + i * (heartSize + heartSpacing) + 2, startY + 2, heartSize - 4, heartSize - 4);
      }
      
      // Draw heart texture if available
      if (textures.current['heart']) {
        ctx.globalAlpha = i < health ? 1 : 0.5;
        ctx.drawImage(
          textures.current['heart'],
          startX + i * (heartSize + heartSpacing),
          startY,
          heartSize,
          heartSize
        );
        ctx.globalAlpha = 1;
      }
    }
    
    // Lives display (beneath hearts)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${hearts}`, startX, startY + heartSize + 20);
    
    // Score display
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, width - 20, 30);
    
    // Draw pause overlay
    drawPauseScreen(ctx);
  };
  
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