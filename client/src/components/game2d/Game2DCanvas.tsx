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
      
      // Jump with Space (also debug log)
      if (e.code === 'Space' && isGroundedRef.current && phase === 'playing') {
        console.log("Jump triggered!");
        playerVelRef.current.y = -JUMP_FORCE;
        isGroundedRef.current = false;
      }
      
      // Attack with 'KeyM'
      if (e.code === 'KeyM' && !attackCooldownRef.current && phase === 'playing') {
        console.log("Attack triggered!");
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
  
  // Power-up timer ref (needs to be at component level, not inside hooks)
  const powerUpTimerRef = useRef<number | null>(null);
  
  // Load textures
  useEffect(() => {
    const loadTexture = async (key: string, url: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          textures.current[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.error(`Failed to load texture: ${url}`);
          resolve(); // Resolve anyway to prevent blocking
        };
        img.src = url;
      });
    };
    
    // Preload all necessary textures
    Promise.all([
      loadTexture('bone', '/textures/bone.png'),
      loadTexture('visa', '/textures/visa.png'),
      loadTexture('snack', '/textures/snack.png'),
      loadTexture('player', '/textures/player.png'),
      loadTexture('playerPowered', '/textures/player-powered.png'),
      loadTexture('cat', '/textures/cat.png'),
      loadTexture('drone', '/textures/drone.png'),
      loadTexture('frog', '/textures/frog.png'),
      loadTexture('snake', '/textures/snake.png'),
      loadTexture('shark', '/textures/shark.png'),
      loadTexture('fish', '/textures/fish.png'),
      loadTexture('mouse', '/textures/mouse.png'),
      loadTexture('boss', '/textures/boss.png'),
      loadTexture('checkpoint', '/textures/checkpoint.png'),
      loadTexture('platform', '/textures/platform.png'),
    ]).then(() => {
      console.log('All textures loaded');
    });
    
    return () => {
      // Clean up
      textures.current = {};
    };
  }, []);
  
  // Setup powerup timer effect
  useEffect(() => {
    // Clear existing timer when component unmounts or re-renders
    if (powerUpTimerRef.current) {
      clearTimeout(powerUpTimerRef.current);
      powerUpTimerRef.current = null;
    }
    
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

  // Main game loop
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
    
    // Define utility functions for drawing
    const drawPlayer = (timestamp: number) => {
      // Calculate player position with camera offset
      const playerX = playerPosRef.current.x - cameraOffsetRef.current.x;
      const playerY = playerPosRef.current.y;
      
      // Skip drawing if player is far off-screen
      if (playerX < -100 || playerX > width + 100) return;
      
      // Use the appropriate texture based on power-up state
      const playerTexture = isPoweredUp ? 
        textures.current['playerPowered'] : 
        textures.current['player'];
      
      if (playerTexture) {
        // Draw with sprite flipping based on direction
        ctx.save();
        if (!isFacingRightRef.current) {
          ctx.translate(playerX + playerSizeRef.current.width/2, 0);
          ctx.scale(-1, 1);
          ctx.translate(-(playerX + playerSizeRef.current.width/2), 0);
        }
        
        // If powered up, make the player larger
        const powerUpScale = isPoweredUp ? 1.3 : 1.0;
        const drawWidth = playerSizeRef.current.width * powerUpScale;
        const drawHeight = playerSizeRef.current.height * powerUpScale;
        
        ctx.drawImage(
          playerTexture,
          playerX - (drawWidth - playerSizeRef.current.width) / 2,
          playerY - (drawHeight - playerSizeRef.current.height) / 2,
          drawWidth,
          drawHeight
        );
        
        // If attacking, draw sword hitbox
        if (isAttackingRef.current) {
          ctx.fillStyle = '#CCCCCC';
          ctx.fillRect(
            swordHitboxRef.current.x - cameraOffsetRef.current.x,
            swordHitboxRef.current.y - swordHitboxRef.current.height / 2,
            swordHitboxRef.current.width,
            swordHitboxRef.current.height
          );
        }
        
        ctx.restore();
        
        // If invincible, draw flashing effect
        if (isInvincible && Math.floor(timestamp / 100) % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.fillRect(
            playerX - 5,
            playerY - playerSizeRef.current.height / 2 - 5,
            playerSizeRef.current.width + 10,
            playerSizeRef.current.height + 10
          );
        }
        
        // If powered up, draw glow effect
        if (isPoweredUp) {
          const glowSize = 15 + Math.sin(timestamp * 0.01) * 5;
          const gradient = ctx.createRadialGradient(
            playerX + playerSizeRef.current.width / 2,
            playerY,
            0,
            playerX + playerSizeRef.current.width / 2,
            playerY,
            playerSizeRef.current.width / 2 + glowSize
          );
          gradient.addColorStop(0, 'rgba(255, 255, 0, 0.7)');
          gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
          
          ctx.fillStyle = gradient;
          ctx.fillRect(
            playerX - glowSize,
            playerY - playerSizeRef.current.height / 2 - glowSize,
            playerSizeRef.current.width + glowSize * 2,
            playerSizeRef.current.height + glowSize * 2
          );
        }
      } else {
        // Fallback if texture isn't loaded - simple chihuahua shape
        const baseX = playerX - playerSizeRef.current.width / 2;
        const baseY = playerY - playerSizeRef.current.height / 2;
        const width = playerSizeRef.current.width;
        const height = playerSizeRef.current.height;
        
        // Body (tan/brown for chihuahua color)
        ctx.fillStyle = isPoweredUp ? '#FFCC00' : '#CD853F';
        ctx.fillRect(baseX, baseY, width, height);
        
        // Eyes (dark)
        ctx.fillStyle = '#000000';
        const eyeSize = width * 0.1;
        ctx.fillRect(baseX + width * 0.7, baseY + height * 0.3, eyeSize, eyeSize);
        
        // Ears - small triangular ears
        ctx.fillStyle = isPoweredUp ? '#FFC107' : '#8B4513';
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.lineTo(baseX, baseY - height * 0.2);
        ctx.lineTo(baseX + width * 0.2, baseY);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(baseX + width, baseY);
        ctx.lineTo(baseX + width, baseY - height * 0.2);
        ctx.lineTo(baseX + width * 0.8, baseY);
        ctx.fill();
      }
    };
    
    // Game loop handler
    const gameLoop = (timestamp: number) => {
      // Time delta for smooth animation
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 16; // Normalize to ~60fps
      lastTimeRef.current = timestamp;
      
      // Define boss level variables (used throughout the game loop)
      let isBossLevel = currentLevel === 4;
      let bossStillAlive = isBossLevel && enemiesRef.current.some(enemy => enemy.isBoss && enemy.health > 0);
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background
      ctx.fillStyle = levelData.backgroundColor || '#87CEEB';
      ctx.fillRect(0, 0, width, height);
      
      // If game is paused, don't update game state
      if (isPaused) {
        // Draw the game world but don't update it
        drawPlayer(timestamp);
        // Continue the animation loop
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // If game is over, show game over screen
      if (isGameOver) {
        // Continue the animation loop
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Update player position based on input
      const playerSpeed = MOVE_SPEED * (isPoweredUp ? 1.3 : 1.0);
      let xVelocity = 0;
      
      if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA')) {
        xVelocity = -playerSpeed;
        isFacingRightRef.current = false;
      }
      if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD')) {
        xVelocity = playerSpeed;
        isFacingRightRef.current = true;
      }
      
      // Apply horizontal movement
      playerVelRef.current.x = xVelocity;
      
      // Handle jumping
      if ((keysPressed.current.has('ArrowUp') || keysPressed.current.has('KeyW') || keysPressed.current.has('Space')) && 
          isGroundedRef.current) {
        playerVelRef.current.y = -JUMP_FORCE;
        isGroundedRef.current = false;
      }
      
      // Apply gravity
      if (!isGroundedRef.current) {
        playerVelRef.current.y += GRAVITY * deltaTime * 0.05;
      }
      
      // Apply vertical movement with collision detection
      playerPosRef.current.y += playerVelRef.current.y;
      
      // Check for ground collision first
      if (playerPosRef.current.y > height - 50 - playerSizeRef.current.height / 2) {
        playerPosRef.current.y = height - 50 - playerSizeRef.current.height / 2;
        playerVelRef.current.y = 0;
        isGroundedRef.current = true;
      }
      
      // Platform collision detection
      isGroundedRef.current = false; // Reset grounded state to check if we're on a platform
      if (levelData.platforms) {
        levelData.platforms.forEach((platform: any) => {
          if (platform === levelData.platforms[0]) return; // Skip the ground platform
          
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
          
          // Check for collision
          if (playerRight > platformLeft &&
              playerLeft < platformRight &&
              playerBottom > platformTop &&
              playerTop < platformBottom) {
            
            // Calculate overlap from all sides
            const overlapTop = playerBottom - platformTop;
            const overlapBottom = platformBottom - playerTop;
            const overlapLeft = playerRight - platformLeft;
            const overlapRight = platformRight - playerLeft;
            
            // Find the smallest overlap (the direction to resolve collision)
            const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);
            
            // Resolve collision based on the smallest overlap
            if (minOverlap === overlapTop && playerVelRef.current.y >= 0) {
              // Collision from above
              playerPosRef.current.y = platformTop - playerSizeRef.current.height / 2;
              playerVelRef.current.y = 0;
              isGroundedRef.current = true;
            } else if (minOverlap === overlapBottom && playerVelRef.current.y <= 0) {
              // Collision from below
              playerPosRef.current.y = platformBottom + playerSizeRef.current.height / 2;
              playerVelRef.current.y = 0;
            } else if (minOverlap === overlapLeft && playerVelRef.current.x >= 0) {
              // Collision from left
              playerPosRef.current.x = platformLeft - playerSizeRef.current.width / 2;
              playerVelRef.current.x = 0;
            } else if (minOverlap === overlapRight && playerVelRef.current.x <= 0) {
              // Collision from right
              playerPosRef.current.x = platformRight + playerSizeRef.current.width / 2;
              playerVelRef.current.x = 0;
            }
          }
        });
      }
      
      // Check for ground collision again as a fallback
      if (playerPosRef.current.y > height - 50 - playerSizeRef.current.height / 2) {
        playerPosRef.current.y = height - 50 - playerSizeRef.current.height / 2;
        playerVelRef.current.y = 0;
        isGroundedRef.current = true;
      }
      
      // Apply horizontal movement with bounds checking
      if (playerPosRef.current.x + playerVelRef.current.x > 0 && 
          playerPosRef.current.x + playerVelRef.current.x < levelData.bounds.max) {
        playerPosRef.current.x += playerVelRef.current.x;
      }
      
      // Update camera position
      // Camera follows player with some offset to show more of the level ahead
      const idealCameraX = playerPosRef.current.x - width * 0.3;
      const smoothFactor = 0.1;
      
      // Apply camera smoothing
      cameraOffsetRef.current.x += (idealCameraX - cameraOffsetRef.current.x) * smoothFactor;
      
      // Ensure camera doesn't go past level bounds
      if (cameraOffsetRef.current.x < 0) {
        cameraOffsetRef.current.x = 0;
      } else if (cameraOffsetRef.current.x > levelData.bounds.max - width) {
        cameraOffsetRef.current.x = levelData.bounds.max - width;
      }
      
      // Check if player falls into a pit
      if (playerPosRef.current.y > height + 100) {
        // Player fell off the level, take damage
        takeDamage(1);
        
        // Reset to last checkpoint
        playerPosRef.current.x = lastCheckpointRef.current.x;
        playerPosRef.current.y = lastCheckpointRef.current.y;
        playerVelRef.current.x = 0;
        playerVelRef.current.y = 0;
        
        // Set temporary invincibility
        setIsInvincible(true);
        setTimeout(() => setIsInvincible(false), 1500);
      }
      
      // Check collision with exit/border
      const borderX = levelData.exit[0];
      const borderWidth = 70;
      
      // If player is at the border and boss is defeated (or not a boss level), go to next level
      if (playerPosRef.current.x > borderX - borderWidth / 2 && 
          playerPosRef.current.x < borderX + borderWidth / 2 && 
          (!isBossLevel || !bossStillAlive)) {
        
        // Play success sound
        playSuccess();
        
        // Unlock next level
        unlockNextLevel();
        
        // If last level of world, go to next world
        if (currentLevel === 4) {
          if (currentWorld < 4) {
            // Next world, level 0
            setCurrentLevel(0);
          } else {
            // Game complete!
            console.log("Game complete!");
          }
        } else {
          // Next level in current world
          setCurrentLevel(currentLevel + 1);
        }
      }
      
      // Draw the game world elements
      
      // Draw ground
      ctx.fillStyle = levelData.groundColor || '#8B4513';
      ctx.fillRect(0 - cameraOffsetRef.current.x, height - 50, levelData.bounds.max, 50);
      
      // Draw platforms
      if (levelData.platforms) {
        levelData.platforms.forEach((platform: any) => {
          const platformX = platform.position[0] - cameraOffsetRef.current.x;
          const platformY = platform.position[1];
          
          // Skip if platform is off-screen
          if (platformX + platform.size[0] / 2 < 0 || platformX - platform.size[0] / 2 > width) {
            return;
          }
          
          ctx.fillStyle = platform.color || '#8B4513';
          ctx.fillRect(
            platformX - platform.size[0] / 2, 
            platformY - platform.size[1] / 2, 
            platform.size[0], 
            platform.size[1]
          );
        });
      }
      
      // Draw collectibles
      if (levelData.collectibles) {
        levelData.collectibles.forEach((collectible: any) => {
          const collectibleX = collectible.position[0] - cameraOffsetRef.current.x;
          const collectibleY = collectible.position[1];
          
          // Skip if collectible is off-screen
          if (collectibleX + 30 < 0 || collectibleX - 30 > width) {
            return;
          }
          
          const texture = textures.current[collectible.type] || null;
          if (texture) {
            ctx.drawImage(
              texture,
              collectibleX - 15,
              collectibleY - 15 + Math.sin(timestamp * 0.003) * 5, // Hover animation
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
              collectibleX,
              collectibleY + Math.sin(timestamp * 0.003) * 5,
              15,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        });
      }
      
      // Draw enemies
      enemiesRef.current.forEach((enemy) => {
        const enemyX = enemy.x - cameraOffsetRef.current.x;
        const enemyY = enemy.y;
        
        // Skip if enemy is off-screen
        if (enemyX + 40 < 0 || enemyX - 40 > width) {
          return;
        }
        
        // Draw enemy based on type
        const texture = textures.current[enemy.type] || null;
        if (texture) {
          ctx.save();
          if (enemy.direction === 'left') {
            ctx.translate(enemyX + 20, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(enemyX + 20), 0);
          }
          
          ctx.drawImage(
            texture,
            enemyX - 20,
            enemyY - 20,
            40,
            40
          );
          
          // If it's a boss, draw a crown
          if (enemy.isBoss) {
            ctx.fillStyle = '#FFDD00';
            ctx.beginPath();
            ctx.moveTo(enemyX - 10, enemyY - 30);
            ctx.lineTo(enemyX, enemyY - 45);
            ctx.lineTo(enemyX + 10, enemyY - 30);
            ctx.lineTo(enemyX + 20, enemyY - 45);
            ctx.lineTo(enemyX + 30, enemyY - 30);
            ctx.closePath();
            ctx.fill();
            
            // Draw health bar for boss
            const healthPercentage = enemy.health / enemy.maxHealth;
            ctx.fillStyle = '#333333';
            ctx.fillRect(enemyX - 30, enemyY - 50, 60, 5);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(enemyX - 30, enemyY - 50, 60 * healthPercentage, 5);
          }
          
          ctx.restore();
        } else {
          // Fallback if texture isn't loaded
          ctx.fillStyle = enemy.isBoss ? '#FF0000' : '#666666';
          ctx.fillRect(enemyX - 20, enemyY - 20, 40, 40);
          
          // If it's a boss, draw a crown
          if (enemy.isBoss) {
            ctx.fillStyle = '#FFDD00';
            ctx.beginPath();
            ctx.moveTo(enemyX - 10, enemyY - 25);
            ctx.lineTo(enemyX, enemyY - 35);
            ctx.lineTo(enemyX + 10, enemyY - 25);
            ctx.closePath();
            ctx.fill();
          }
        }
      });
      
      // Draw border fence checkpoint
      const fenceX = levelData.exit[0] - cameraOffsetRef.current.x;
      const fenceY = levelData.exit[1] - 100; // Position at ground level but taller
      
      // We're using the boss variables defined at the start of the game loop
      
      // Draw a more detailed border checkpoint
      // Main metal structure
      ctx.fillStyle = '#AAAAAA'; // Metal color
      ctx.fillRect(fenceX - 10, fenceY, 70, 120);
      
      // Border crossing design - Red when locked (boss alive), Green when unlocked
      ctx.fillStyle = bossStillAlive ? '#EE0000' : '#00CC00'; // Red when locked, green when unlocked
      ctx.fillRect(fenceX - 10, fenceY, 70, 10);
      
      // White stripes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(fenceX - 10, fenceY + 15, 70, 5);
      ctx.fillRect(fenceX - 10, fenceY + 25, 70, 5);
      ctx.fillRect(fenceX - 10, fenceY + 35, 70, 5);
      
      // Welcome sign
      ctx.fillStyle = '#FFDD00'; // Gold border
      ctx.fillRect(fenceX - 5, fenceY + 50, 60, 40);
      ctx.fillStyle = '#FFFFFF'; // White background
      ctx.fillRect(fenceX, fenceY + 55, 50, 30);
      
      // Sign text
      ctx.fillStyle = '#000000';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('USA', fenceX + 25, fenceY + 70);
      
      // Draw "BORDER" text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('BORDER', fenceX + 25, fenceY - 25);
      
      // If boss level and boss is alive, draw additional warning text
      if (isBossLevel && bossStillAlive) {
        // Draw "CLOSED" text with animation
        const pulseAlpha = 0.5 + Math.sin(timestamp * 0.005) * 0.5;
        ctx.globalAlpha = pulseAlpha;
        ctx.fillStyle = '#FF0000'; // Red warning
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText('CLOSED', fenceX + 25, fenceY + 95);
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
      }
      
      // Draw player last (on top of other elements)
      drawPlayer(timestamp);
      
      // Continue the animation loop
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    
    // Cleanup function
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [
    phase, levelData, width, height, isPaused, isGameOver, isPoweredUp, 
    currentLevel, currentWorld, takeDamage, playSuccess, setPosition, 
    isInvincible, setIsInvincible, unlockNextLevel, setCurrentLevel
  ]);
  
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