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
  const { 
    resetPlayer, 
    position, 
    setPosition, 
    takeDamage, 
    heal, 
    powerUp, 
    health,
    isPoweredUp
  } = usePlayer();
  const { resetCollectibles, collectItem } = useCollectibles();
  const { playHit, playSuccess } = useAudio();
  
  // Invincibility state (for power-ups and temporary invincibility after getting hit)
  const [isInvincible, setIsInvincible] = useState(false);
  
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
  
  // Camera and level state
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  const levelProgressRef = useRef(0);
  const obstaclesRef = useRef<Array<{ type: string; x: number; y: number; width: number; height: number; }>>([]);
  const enemiesRef = useRef<Array<{ type: string; x: number; y: number; direction: number; speed: number; }>>([]);
  
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
  
  // Generate random obstacles based on world type
  const generateObstacles = (worldIndex: number, levelLength: number) => {
    const obstacles = [];
    const enemyTypes = ['cat', 'snake', 'drone', 'frog'];
    const obstacleTypes = ['sandstorm', 'cactus', 'rock', 'bush'];
    
    // Generate platforms
    const numPlatforms = 5 + Math.floor(Math.random() * 5); // 5-10 platforms
    for (let i = 0; i < numPlatforms; i++) {
      const platformX = 300 + (i * (levelLength / numPlatforms));
      const platformY = height - 150 - Math.random() * 200;
      const platformWidth = 100 + Math.random() * 100;
      const platformHeight = 20 + Math.random() * 10;
      
      // Add platform with color property
      const platform: any = {
        type: 'platform',
        x: platformX,
        y: platformY,
        width: platformWidth,
        height: platformHeight,
        color: worldIndex === 0 ? '#8B4513' : // Brown
               worldIndex === 1 ? '#228B22' : // Forest Green
               worldIndex === 2 ? '#CDAA7D' : // Sand
               worldIndex === 3 ? '#708090' : // Gray
               '#FFFFFF' // Default white
      };
      obstacles.push(platform);
    }
    
    // Generate enemies
    const numEnemies = 3 + Math.floor(Math.random() * 5); // 3-8 enemies
    for (let i = 0; i < numEnemies; i++) {
      const enemyX = 500 + (i * (levelLength / numEnemies));
      const enemyY = height - 70 - (Math.random() > 0.7 ? Math.random() * 200 : 0); // Some enemies on platforms
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      enemiesRef.current.push({
        type: enemyType,
        x: enemyX,
        y: enemyY,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 1 + Math.random() * 2
      });
    }
    
    // Generate hazards and decorations
    const numHazards = 4 + Math.floor(Math.random() * 4); // 4-8 hazards
    for (let i = 0; i < numHazards; i++) {
      const hazardX = 400 + (i * (levelLength / numHazards));
      const hazardY = height - 70;
      const hazardType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
      
      obstacles.push({
        type: hazardType,
        x: hazardX, 
        y: hazardY,
        width: 30 + Math.random() * 20,
        height: 30 + Math.random() * 50
      });
    }
    
    // Generate collectibles
    const collectibleTypes = ['bone', 'visa', 'snack'];
    const numCollectibles = 5 + Math.floor(Math.random() * 5); // 5-10 collectibles
    for (let i = 0; i < numCollectibles; i++) {
      const collectibleX = 250 + (i * (levelLength / numCollectibles));
      const collectibleY = height - 100 - Math.random() * 200;
      const collectibleType = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
      
      obstacles.push({
        type: collectibleType,
        x: collectibleX,
        y: collectibleY,
        width: 30,
        height: 30
      });
    }
    
    return obstacles;
  };
  
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
      
      // Populate level with randomly generated obstacles
      const obstacles = generateObstacles(currentWorld, levelLength);
      obstaclesRef.current = obstacles;
      
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
        exit: [levelLength - 100, height - 100, 0]
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
    
    // Local references to the functions from the stores to use in callbacks
    const handleTakeDamage = takeDamage;
    const handleHeal = heal;
    const handlePowerUp = powerUp;
    const handleCollectItem = collectItem;
    
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
      
      // Draw background - background doesn't move with camera
      ctx.fillStyle = levelData.backgroundColor || '#87CEEB';
      ctx.fillRect(0, 0, width, height);
      
      // Get camera offset for drawing
      const cameraX = cameraOffsetRef.current.x;
      const cameraY = cameraOffsetRef.current.y;
      
      // Draw ground (moves with camera)
      ctx.fillStyle = levelData.groundColor || '#8B4513';
      ctx.fillRect(0 - cameraX, height - 50, levelData.bounds.max, 50);
      
      // Draw decorative background objects based on world type
      // Northern Tropics (World 0)
      if (currentWorld === 0) {
        // Draw clouds
        for (let i = 0; i < 10; i++) {
          const cloudX = (i * 350) - (cameraX * 0.3); // Clouds move slower than foreground (parallax)
          const cloudY = 100 + (i * 30) % 150;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cloudX, cloudY, 30, 0, Math.PI * 2);
          ctx.arc(cloudX + 20, cloudY - 15, 25, 0, Math.PI * 2);
          ctx.arc(cloudX + 40, cloudY, 20, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Jungle (World 1)
      else if (currentWorld === 1) {
        // Draw distant trees
        for (let i = 0; i < 15; i++) {
          const treeX = (i * 200) - (cameraX * 0.4);
          const treeHeight = 100 + (i * 17) % 150;
          
          ctx.fillStyle = '#004000';
          ctx.fillRect(treeX, height - 50 - treeHeight, 30, treeHeight);
          
          ctx.fillStyle = '#008000';
          ctx.beginPath();
          ctx.arc(treeX + 15, height - 50 - treeHeight - 40, 60, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Desert (World 2)
      else if (currentWorld === 2) {
        // Draw distant dunes
        ctx.fillStyle = '#E8C98C';
        let x = -cameraX * 0.3;
        while (x < width) {
          const amplitude = 40 + (x * 0.1) % 30;
          const duneWidth = 200 + (x * 0.05) % 100;
          
          ctx.beginPath();
          ctx.moveTo(x, height - 50);
          ctx.quadraticCurveTo(
            x + duneWidth / 2, height - 50 - amplitude,
            x + duneWidth, height - 50
          );
          ctx.lineTo(x + duneWidth, height);
          ctx.lineTo(x, height);
          ctx.closePath();
          ctx.fill();
          
          x += duneWidth;
        }
      }
      
      // Draw platforms (with camera offset)
      platforms.forEach((platform: any) => {
        const platformX = platform.position[0] - cameraX;
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
      
      // Draw exit portal (with camera offset)
      ctx.fillStyle = '#4422FF';
      ctx.globalAlpha = 0.7;
      ctx.fillRect(exit[0] - 25 - cameraX, exit[1] - 40, 50, 80);
      ctx.globalAlpha = 1.0;
      
      // Draw collectibles from level data (with camera offset)
      collectibles.forEach((collectible: any) => {
        const collectibleX = collectible.position[0] - cameraX;
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
      
      // Draw dynamic generated obstacles
      obstaclesRef.current.forEach((obstacle) => {
        const obstacleX = obstacle.x - cameraX;
        
        // Skip if obstacle is off-screen
        if (obstacleX + obstacle.width < 0 || obstacleX > width) {
          return;
        }
        
        if (obstacle.type === 'platform') {
          ctx.fillStyle = obstacle.color || '#8B4513';
          ctx.fillRect(
            obstacleX - obstacle.width / 2,
            obstacle.y - obstacle.height / 2,
            obstacle.width,
            obstacle.height
          );
        } else if (['bone', 'visa', 'snack'].includes(obstacle.type)) {
          // Draw collectible
          const texture = textures.current[obstacle.type] || null;
          if (texture) {
            ctx.drawImage(
              texture,
              obstacleX - 15,
              obstacle.y - 15 + Math.sin(timestamp * 0.003) * 5, // Hover animation
              30,
              30
            );
          } else {
            // Fallback if texture isn't loaded
            ctx.fillStyle = obstacle.type === 'bone' ? '#FFFFFF' : 
                          obstacle.type === 'visa' ? '#66EE66' : 
                          '#FFDD44';
            ctx.beginPath();
            ctx.arc(
              obstacleX,
              obstacle.y + Math.sin(timestamp * 0.003) * 5,
              15,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        } else {
          // Draw obstacle
          ctx.fillStyle = obstacle.type === 'sandstorm' ? '#E8C98C' :
                          obstacle.type === 'cactus' ? '#007000' :
                          obstacle.type === 'rock' ? '#A0A0A0' :
                          obstacle.type === 'bush' ? '#006400' :
                          '#FF00FF'; // Default magenta
          
          if (obstacle.type === 'sandstorm') {
            // Draw particle effect for sandstorm
            for (let i = 0; i < 15; i++) {
              const particleX = obstacleX + (Math.sin(timestamp * 0.01 + i) * obstacle.width/2);
              const particleY = obstacle.y + (Math.cos(timestamp * 0.01 + i) * obstacle.height/2);
              const size = 2 + Math.random() * 6;
              
              ctx.globalAlpha = 0.2 + Math.random() * 0.3;
              ctx.fillRect(particleX, particleY, size, size);
            }
            ctx.globalAlpha = 1.0;
          } else {
            // Draw regular obstacle
            ctx.fillRect(
              obstacleX - obstacle.width / 2,
              obstacle.y - obstacle.height / 2,
              obstacle.width,
              obstacle.height
            );
          }
        }
      });
      
      // Draw enemies from level data (with camera offset)
      enemies.forEach((enemy: any) => {
        const enemyX = enemy.position[0] - cameraX;
        const enemyY = enemy.position[1];
        
        // Skip if enemy is off-screen
        if (enemyX + 40 < 0 || enemyX - 40 > width) {
          return;
        }
        
        const texture = textures.current[enemy.type] || null;
        if (texture) {
          ctx.drawImage(
            texture,
            enemyX - 20,
            enemyY - 20,
            40,
            40
          );
        } else {
          // Fallback if texture isn't loaded
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(enemyX - 20, enemyY - 20, 40, 40);
        }
      });
      
      // Draw dynamic enemies (with camera offset)
      enemiesRef.current.forEach((enemy) => {
        const enemyX = enemy.x - cameraX;
        
        // Skip if enemy is off-screen
        if (enemyX + 40 < 0 || enemyX - 40 > width) {
          return;
        }
        
        // Move enemy based on direction and speed
        enemy.x += enemy.direction * enemy.speed * (deltaTime / 2);
        
        // Reverse direction at random intervals or when hitting level bounds
        if (Math.random() < 0.005 || 
            enemy.x < 100 || 
            enemy.x > levelData.bounds.max - 100) {
          enemy.direction *= -1;
        }
        
        // Draw enemy
        const texture = textures.current[enemy.type] || null;
        if (texture) {
          // Flip texture based on direction
          ctx.save();
          if (enemy.direction < 0) {
            ctx.translate(enemyX * 2, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
              texture,
              enemyX - 20,
              enemy.y - 20,
              40,
              40
            );
          } else {
            ctx.drawImage(
              texture,
              enemyX - 20,
              enemy.y - 20,
              40,
              40
            );
          }
          ctx.restore();
        } else {
          // Fallback if texture isn't loaded
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(enemyX - 20, enemy.y - 20, 40, 40);
        }
      });
      
      // Handle player movement
      const left = keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA');
      const right = keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD');
      const jump = keysPressed.current.has('ArrowUp') || keysPressed.current.has('KeyW') || keysPressed.current.has('Space');
      
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
      
      // Even more floaty jump - use much lower gravity when going up and holding jump
      if (jump && playerVelRef.current.y < 0) {
        // Super floaty jump - almost floating when holding jump key
        playerVelRef.current.y += (GRAVITY * 0.03) * deltaTime; 
      } else if (playerVelRef.current.y < 0) {
        // Medium gravity when going up but not holding jump
        playerVelRef.current.y += (GRAVITY * 0.06) * deltaTime; 
      } else {
        // Normal gravity when falling
        playerVelRef.current.y += (GRAVITY * 0.1) * deltaTime; 
      }
      
      // Update position
      playerPosRef.current.x += playerVelRef.current.x;
      playerPosRef.current.y += playerVelRef.current.y;
      
      // Update camera to follow player
      if (playerPosRef.current.x > width / 3) {
        // Shift the camera to keep player in the left third of the screen
        cameraOffsetRef.current.x = playerPosRef.current.x - width / 3;
        
        // Update level progress (for generating new obstacles)
        if (cameraOffsetRef.current.x > levelProgressRef.current) {
          levelProgressRef.current = cameraOffsetRef.current.x;
        }
      }
      
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
      
      // Collision detection with dynamic obstacles
      obstaclesRef.current.forEach((obstacle) => {
        if (obstacle.type === 'platform') {
          // Platform collision
          const obstacleLeft = obstacle.x - obstacle.width / 2;
          const obstacleRight = obstacle.x + obstacle.width / 2;
          const obstacleTop = obstacle.y - obstacle.height / 2;
          const obstacleBottom = obstacle.y + obstacle.height / 2;
          
          const playerLeft = playerPosRef.current.x - playerSizeRef.current.width / 2;
          const playerRight = playerPosRef.current.x + playerSizeRef.current.width / 2;
          const playerTop = playerPosRef.current.y - playerSizeRef.current.height / 2;
          const playerBottom = playerPosRef.current.y + playerSizeRef.current.height / 2;
          
          // Check for collision
          if (
            playerRight > obstacleLeft &&
            playerLeft < obstacleRight &&
            playerBottom > obstacleTop &&
            playerTop < obstacleBottom
          ) {
            // Determine collision side
            const overlapLeft = playerRight - obstacleLeft;
            const overlapRight = obstacleRight - playerLeft;
            const overlapTop = playerBottom - obstacleTop;
            const overlapBottom = obstacleBottom - playerTop;
            
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
            
            if (minOverlap === overlapTop && playerVelRef.current.y > 0) {
              // Landing on top
              playerPosRef.current.y = obstacleTop - playerSizeRef.current.height / 2;
              playerVelRef.current.y = 0;
              isGroundedRef.current = true;
            } else if (minOverlap === overlapBottom && playerVelRef.current.y < 0) {
              // Hitting bottom
              playerPosRef.current.y = obstacleBottom + playerSizeRef.current.height / 2;
              playerVelRef.current.y = 0;
            } else if (minOverlap === overlapLeft && playerVelRef.current.x > 0) {
              // Hitting left side
              playerPosRef.current.x = obstacleLeft - playerSizeRef.current.width / 2;
              playerVelRef.current.x = 0;
            } else if (minOverlap === overlapRight && playerVelRef.current.x < 0) {
              // Hitting right side
              playerPosRef.current.x = obstacleRight + playerSizeRef.current.width / 2;
              playerVelRef.current.x = 0;
            }
          }
        }
      });
      
      // Collision detection with collectible items and power-ups
      obstaclesRef.current.forEach((obstacle, index) => {
        // Only check collectibles and power-ups
        if (['bone', 'visa', 'snack', 'mushroom', 'joint'].includes(obstacle.type)) {
          const distX = Math.abs(playerPosRef.current.x - obstacle.x);
          const distY = Math.abs(playerPosRef.current.y - obstacle.y);
          
          // Simple circular collision
          if (distX < 25 && distY < 25) {
            // Generate a random ID for the collectible
            const collectibleId = `${obstacle.type}_${Math.floor(Math.random() * 10000)}`; 
            
            // Collect the item
            if (obstacle.type === 'bone') {
              // Collect bone
              handleCollectItem(collectibleId, 'bone');
              playSuccess();
            } else if (obstacle.type === 'visa') {
              // Collect visa
              handleCollectItem(collectibleId, 'visa');
              playSuccess();
            } else if (obstacle.type === 'snack') {
              // Heal player
              handleHeal(1); // Heal 1 health point
              playSuccess();
            } else if (obstacle.type === 'mushroom') {
              // Transform into chihuahua
              handlePowerUp(30000); // 30 second powerup
              playSuccess();
            } else if (obstacle.type === 'joint') {
              // Temporary invincibility
              setIsInvincible(true);
              setTimeout(() => setIsInvincible(false), 10000);
              playSuccess();
            }
            
            // Remove the collected item
            obstaclesRef.current.splice(index, 1);
          }
        }
      });
      
      // Collision detection with dynamic enemies
      if (!isInvincible) {
        enemiesRef.current.forEach((enemy) => {
          const distX = Math.abs(playerPosRef.current.x - enemy.x);
          const distY = Math.abs(playerPosRef.current.y - enemy.y);
          
          // Simple circular collision
          if (distX < 30 && distY < 30) {
            // Player gets hurt unless invincible
            playerVelRef.current.y = -5; // Bounce up a bit
            playerVelRef.current.x = playerPosRef.current.x < enemy.x ? -5 : 5; // Bounce away
            
            // Deal damage to player
            handleTakeDamage(1);
            
            // Play hit sound
            playHit();
            
            // Small invincibility period after getting hit
            setIsInvincible(true);
            setTimeout(() => setIsInvincible(false), 1000);
          }
        });
      }
      
      // Draw player character (with camera offset)
      const playerScreenX = playerPosRef.current.x - cameraX;
      const playerTexture = textures.current['character'] || null;
      
      if (playerTexture) {
        // Draw character with proper facing direction
        ctx.save();
        if (!isFacingRightRef.current) {
          // Flip horizontally if facing left
          ctx.translate(playerScreenX * 2, 0);
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(
          playerTexture,
          isFacingRightRef.current ? playerScreenX - 20 : playerScreenX - 20,
          playerPosRef.current.y - 20,
          40,
          40
        );
        ctx.restore();
      } else {
        // Fallback if texture isn't loaded
        ctx.fillStyle = '#FF9900'; // Orange
        ctx.fillRect(
          playerScreenX - 20,
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
  }, [
    levelData, 
    width, 
    height, 
    phase, 
    setPosition, 
    playSuccess, 
    playHit,
    takeDamage, 
    heal, 
    powerUp, 
    collectItem,
    currentWorld,
    isInvincible
  ]);
  
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