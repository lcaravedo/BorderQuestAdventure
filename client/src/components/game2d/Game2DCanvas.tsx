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
  
  // Pause state
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
  const keysPressed = useRef<Set<string>>(new Set());
  const isAttackingRef = useRef(false);
  const attackCooldownRef = useRef(false);
  const lastCheckpointRef = useRef({ x: 100, y: 100 });
  
  // Camera and level state
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  const levelProgressRef = useRef(0);
  const obstaclesRef = useRef<Array<{ 
    type: string; 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    color?: string; // Optional color property for platforms
    content?: string; // For hidden blocks
    revealed?: boolean; // For hidden blocks
    contentVisible?: boolean; // For hidden blocks
    activated?: boolean; // For checkpoints
    hit?: boolean; // For tracking if a block has been hit
  }>>([]);
  const enemiesRef = useRef<Array<{ 
    type: string; // 'cat', 'crow', 'frog', 'mouse', 'snake', or boss types
    x: number; 
    y: number; 
    direction: number; 
    speed: number; 
    health: number; // For enemy health
    shootCooldown?: number; // Time until next shot
    isBoss?: boolean; // Whether this is a boss enemy
  }>>([]);
  const projectilesRef = useRef<Array<{
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    fromEnemy: boolean; // Whether fired by enemy or player
  }>>([]);
  const swordHitboxRef = useRef({ x: 0, y: 0, width: 0, height: 0, active: false });
  
  // Game resources
  const textures = useRef<Record<string, HTMLImageElement>>({});
  
  // Setup keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.code);
      
      // Toggle pause when Enter or P key is pressed
      if (e.code === 'Enter' || e.code === 'KeyP') {
        setIsPaused(prevPaused => !prevPaused);
        console.log("Game paused: ", !isPaused);
        return;
      }
      
      // If game is paused, don't process other inputs
      if (isPaused) return;
      
      // Immediately handle jump to make controls more responsive
      if ((e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') && isGroundedRef.current) {
        playerVelRef.current.y = -JUMP_FORCE;
        isGroundedRef.current = false;
        playHit();
      }
      
      // Handle sword attack (M key)
      if (e.code === 'KeyM' && !attackCooldownRef.current) {
        isAttackingRef.current = true;
        attackCooldownRef.current = true;
        
        // Create sword hitbox in front of player
        const swordWidth = 60;
        const swordHeight = 40;
        const swordX = playerPosRef.current.x + (isFacingRightRef.current ? 40 : -40);
        const swordY = playerPosRef.current.y;
        
        swordHitboxRef.current = {
          x: swordX,
          y: swordY,
          width: swordWidth,
          height: swordHeight,
          active: true
        };
        
        // Reset attack state after animation
        setTimeout(() => {
          isAttackingRef.current = false;
          swordHitboxRef.current.active = false;
        }, 300);
        
        // Reset cooldown after delay
        setTimeout(() => {
          attackCooldownRef.current = false;
        }, 500);
        
        // Play attack sound
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
  }, [playHit, isPaused]);
  
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
  const generateObstacles = (worldIndex: number, levelIndex: number, levelLength: number) => {
    const obstacles = [];
    const enemyTypes = ['cat', 'crow', 'frog', 'mouse', 'snake'];
    const obstacleTypes = ['sandstorm', 'cactus', 'rock', 'bush'];
    
    // Generate platforms
    const numPlatforms = 5 + Math.floor(Math.random() * 5); // 5-10 platforms
    for (let i = 0; i < numPlatforms; i++) {
      const platformX = 300 + (i * (levelLength / numPlatforms));
      // Make platforms much more reachable
      const platformY = height - 150 - Math.random() * 50; // Much lower height range
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
    
    // Generate regular enemies
    const numEnemies = 3 + Math.floor(Math.random() * 5); // 3-8 enemies
    for (let i = 0; i < numEnemies; i++) {
      const enemyX = 500 + (i * (levelLength / numEnemies));
      const enemyY = height - 70 - (Math.random() > 0.7 ? Math.random() * 200 : 0); // Some enemies on platforms
      const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      
      // Different enemies have different health and abilities
      let enemyHealth = 2; // Default health for basic enemies
      let shootCooldown: number | undefined = undefined;
      
      // Set enemy-specific properties
      if (enemyType === 'cat') {
        enemyHealth = 3;
        shootCooldown = 3000 + Math.random() * 2000; // 3-5 seconds between shots
      } else if (enemyType === 'crow') {
        enemyHealth = 2;
        shootCooldown = 4000 + Math.random() * 3000; // 4-7 seconds between shots
      } else if (enemyType === 'frog') {
        enemyHealth = 4; // Tougher but no shooting
      } else if (enemyType === 'mouse') {
        enemyHealth = 1; // Weaker but faster
      } else if (enemyType === 'snake') {
        enemyHealth = 3;
        shootCooldown = 5000 + Math.random() * 2000; // 5-7 seconds between shots
      }
      
      enemiesRef.current.push({
        type: enemyType,
        x: enemyX,
        y: enemyY,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 1 + Math.random() * 2,
        health: enemyHealth,
        shootCooldown: shootCooldown
      });
    }
    
    // Add a boss at the end of the level if it's the last level of the world (level index 4)
    if (levelIndex === 4) {
      // Boss appears near the end of the level
      const bossX = levelLength - 300;
      const bossY = height - 120;
      
      // Different boss per world
      let bossType;
      if (worldIndex === 0) {
        bossType = 'mutant_mouse';
      } else if (worldIndex === 1) {
        bossType = 'mutant_cat';
      } else if (worldIndex === 2) {
        bossType = 'mutant_crow';
      } else if (worldIndex === 3) {
        bossType = 'mutant_frog';
      } else {
        bossType = 'mutant_snake';
      }
      
      // Boss has more health and can shoot more frequently
      enemiesRef.current.push({
        type: bossType,
        x: bossX,
        y: bossY,
        direction: -1, // Initially face the player
        speed: 0.5, // Slower than regular enemies
        health: 10, // Much more health
        shootCooldown: 2000, // Shoots more frequently
        isBoss: true
      });
      
      console.log(`Boss ${bossType} added at the end of world ${worldIndex}`);
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
      const collectibleY = height - 100 - Math.random() * 80; // Lower height, more accessible
      const collectibleType = collectibleTypes[Math.floor(Math.random() * collectibleTypes.length)];
      
      obstacles.push({
        type: collectibleType,
        x: collectibleX,
        y: collectibleY,
        width: 30,
        height: 30
      });
    }
    
    // Generate hidden blocks with power-ups and coins
    const powerUpTypes = ['mushroom', 'joint', 'coin5', 'coin10', 'coin50'];
    const numHiddenBlocks = 3 + Math.floor(Math.random() * 4); // 3-7 hidden blocks
    
    for (let i = 0; i < numHiddenBlocks; i++) {
      const blockX = 400 + (i * (levelLength / numHiddenBlocks));
      const blockY = height - 150 - Math.random() * 70; // Much lower heights for accessibility
      const contentType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      
      obstacles.push({
        type: 'hiddenBlock',
        x: blockX,
        y: blockY,
        width: 40,
        height: 40,
        content: contentType,
        revealed: false // Block starts hidden
      });
    }
    
    // Generate a single tequila-drinking Mexican checkpoint statue per level
    const numCheckpoints = 1; // Just 1 checkpoint per level as requested
    for (let i = 0; i < numCheckpoints; i++) {
      // Place checkpoint halfway through the level
      const checkpointX = levelLength / 2;
      const checkpointY = height - 90; // On the ground
      
      obstacles.push({
        type: 'checkpoint',
        x: checkpointX,
        y: checkpointY,
        width: 50,
        height: 80,
        activated: false // Checkpoint starts inactive
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
      const obstacles = generateObstacles(currentWorld, currentLevel, levelLength);
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
  
  // Function to draw the game over screen
  const drawGameOverScreen = (ctx: CanvasRenderingContext2D) => {
    // Fill the screen with a semi-transparent black overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw "GAME OVER" text
    ctx.fillStyle = '#FF3333';
    ctx.font = '48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GAME OVER', width / 2, height / 2 - 50);
    
    // Draw "Press SPACE to restart" text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillText('Press SPACE to restart', width / 2, height / 2 + 50);
    
    // If space is pressed, reset the game
    if (keysPressed.current.has('Space')) {
      resetGame();
      
      // Clear the keys pressed
      keysPressed.current.clear();
    }
  };
  
  // Function to draw the UI (health, lives, score)
  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw score at top center
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    const scoreWidth = 150;
    ctx.fillRect(width/2 - scoreWidth/2, 10, scoreWidth, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Score: ${score}`, width/2, 25);
    
    // Draw world and level info at top right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width - 210, 10, 200, 30);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`World ${currentWorld+1}-${currentLevel+1}`, width - 110, 25);
    
    // Draw health and lives - now separated with health at top and lives below
    // Health section
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 30); // Shorter box just for health
    
    // Draw health bar
    ctx.fillStyle = '#666666';
    ctx.fillRect(20, 18, 150, 15);
    
    // Draw current health
    ctx.fillStyle = '#FF3333';
    const healthWidth = (health / maxHealth) * 150;
    ctx.fillRect(20, 18, healthWidth, 15);
    
    // Draw health text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`HP: ${health}/${maxHealth}`, 25, 20);
    
    // Lives section - now moved below health
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 50, 200, 30); // Separate box for lives below health
    
    // Draw lives (hearts)
    for (let i = 0; i < hearts; i++) {
      ctx.fillStyle = i < hearts ? '#FF3333' : '#666666';
      // Draw heart shape
      ctx.beginPath();
      const heartX = 20 + (i * 30);
      const heartY = 65;
      
      // Heart shape using bezier curves
      ctx.moveTo(heartX, heartY + 5);
      ctx.bezierCurveTo(heartX, heartY + 3, heartX - 5, heartY - 2, heartX - 10, heartY + 5);
      ctx.bezierCurveTo(heartX - 15, heartY + 10, heartX - 5, heartY + 15, heartX, heartY + 12);
      ctx.bezierCurveTo(heartX + 5, heartY + 15, heartX + 15, heartY + 10, heartX + 10, heartY + 5);
      ctx.bezierCurveTo(heartX + 5, heartY - 2, heartX, heartY + 3, heartX, heartY + 5);
      ctx.fill();
    }
    
    // Draw lives text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${hearts}`, 110, 60);
    
    // Draw pause instructions
    if (isPaused) {
      // Draw pause screen overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', width/2, height/2 - 50);
      
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillText('Press ENTER to continue', width/2, height/2 + 20);
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
      
      // Check for game over state
      if (isGameOver) {
        // Draw game over screen
        drawGameOverScreen(ctx);
        // Continue the animation loop
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw background - background doesn't move with camera
      ctx.fillStyle = levelData.backgroundColor || '#87CEEB';
      ctx.fillRect(0, 0, width, height);
      
      // If game is paused, just draw the pause screen and exit the game loop
      if (isPaused) {
        // Draw the game world but don't update it
        // (This will make sure the game elements are still visible during pause)
        
        // But don't process any game logic - freeze the game
        drawUI(ctx);
        animationFrameIdRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
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
      
      // Draw border fence checkpoint (with camera offset)
      const fenceX = exit[0] - cameraX;
      const fenceY = exit[1] - 100; // Position at ground level but taller
      
      // Draw a more detailed border checkpoint
      // Main metal structure
      ctx.fillStyle = '#AAAAAA'; // Metal color
      ctx.fillRect(fenceX - 10, fenceY, 70, 120);
      
      // Border crossing design
      ctx.fillStyle = '#EE0000'; // Red top
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
        } else if (obstacle.type === 'hiddenBlock') {
          // Draw hidden block (if revealed or show subtle hints)
          if (obstacle.revealed) {
            // Draw revealed block
            ctx.fillStyle = '#CC8800'; // Golden block
            ctx.fillRect(
              obstacleX - obstacle.width / 2,
              obstacle.y - obstacle.height / 2,
              obstacle.width,
              obstacle.height
            );
            
            // Draw question mark
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', obstacleX, obstacle.y);
            
            // If the content is visible, draw it floating above the block
            if (obstacle.contentVisible) {
              // Draw the power-up or coin
              const contentY = obstacle.y - 50 + Math.sin(timestamp * 0.003) * 5;
              
              if (obstacle.content === 'mushroom') {
                // Draw mushroom
                ctx.fillStyle = '#FF0000'; // Red cap
                ctx.fillRect(obstacleX - 15, contentY - 15, 30, 15);
                
                // Draw stem
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(obstacleX - 10, contentY, 20, 15);
                
                // Draw spots
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(obstacleX - 5, contentY - 10, 3, 0, Math.PI * 2);
                ctx.arc(obstacleX + 5, contentY - 7, 3, 0, Math.PI * 2);
                ctx.fill();
              } else if (obstacle.content && obstacle.content === 'joint') {
                // Draw joint
                ctx.fillStyle = '#DDCC88'; // Light brown
                ctx.fillRect(obstacleX - 15, contentY - 5, 30, 10);
                
                // Draw lit end
                ctx.fillStyle = '#FF3300';
                ctx.beginPath();
                ctx.arc(obstacleX + 15, contentY, 5, 0, Math.PI * 2);
                ctx.fill();
              } else if (obstacle.content && obstacle.content.startsWith('coin')) {
                // Draw coin 
                ctx.fillStyle = '#FFDD00'; // Gold
                ctx.beginPath();
                ctx.arc(obstacleX, contentY, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw coin value
                const coinValue = obstacle.content ? obstacle.content.replace('coin', '') : '';
                ctx.fillStyle = '#000000';
                ctx.font = '10px "Press Start 2P", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(coinValue, obstacleX, contentY);
              }
            }
          } else {
            // Draw subtle hint for hidden block
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.fillRect(
              obstacleX - obstacle.width / 2,
              obstacle.y - obstacle.height / 2,
              obstacle.width,
              obstacle.height
            );
            
            // Slightly visible question mark
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = '20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('?', obstacleX, obstacle.y);
          }
        } else if (obstacle.type === 'checkpoint') {
          // Draw checkpoint (tequila-drinking Mexican statue)
          const isActive = obstacle.activated;
          
          // Draw the statue base
          ctx.fillStyle = isActive ? '#A0A0A0' : '#808080'; // Lighter when activated
          ctx.fillRect(
            obstacleX - 20,
            obstacle.y - 40,
            40,
            80
          );
          
          // Draw the sombrero
          ctx.fillStyle = '#CC8844';
          ctx.beginPath();
          ctx.ellipse(
            obstacleX,
            obstacle.y - 45,
            25,
            10,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          ctx.fillStyle = '#FFDD00';
          ctx.beginPath();
          ctx.ellipse(
            obstacleX,
            obstacle.y - 50,
            15,
            7,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          
          // Draw the tequila bottle
          ctx.fillStyle = '#00CC44'; // Green bottle
          ctx.fillRect(
            obstacleX + 15,
            obstacle.y - 30,
            7,
            20
          );
          
          // Draw the face (eyes and smile)
          ctx.fillStyle = '#000000';
          
          // Eyes - closed if activated (drunk)
          if (isActive) {
            // Drunk closed eyes
            ctx.fillRect(obstacleX - 10, obstacle.y - 30, 5, 1);
            ctx.fillRect(obstacleX + 5, obstacle.y - 30, 5, 1);
            
            // Drunk smile with mustache
            ctx.beginPath();
            ctx.moveTo(obstacleX - 15, obstacle.y - 20);
            ctx.lineTo(obstacleX + 15, obstacle.y - 20);
            ctx.stroke();
            
            // Mustache
            ctx.beginPath();
            ctx.moveTo(obstacleX - 15, obstacle.y - 22);
            ctx.quadraticCurveTo(obstacleX, obstacle.y - 18, obstacleX + 15, obstacle.y - 22);
            ctx.stroke();
          } else {
            // Regular eyes
            ctx.fillRect(obstacleX - 10, obstacle.y - 30, 5, 5);
            ctx.fillRect(obstacleX + 5, obstacle.y - 30, 5, 5);
            
            // Regular smile with mustache
            ctx.beginPath();
            ctx.arc(obstacleX, obstacle.y - 15, 10, 0.1, Math.PI - 0.1, false);
            ctx.stroke();
            
            // Mustache
            ctx.beginPath();
            ctx.moveTo(obstacleX - 15, obstacle.y - 15);
            ctx.quadraticCurveTo(obstacleX, obstacle.y - 10, obstacleX + 15, obstacle.y - 15);
            ctx.stroke();
          }
          
          // Draw checkpoint text
          ctx.fillStyle = isActive ? '#FFFFFF' : '#AAAAAA';
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText('SAVE', obstacleX, obstacle.y + 40);
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
      enemiesRef.current.forEach((enemy, enemyIndex) => {
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
        
        // Handle enemy shooting if they have a shootCooldown
        if (enemy.shootCooldown !== undefined) {
          // Decrease cooldown
          if (enemy.shootCooldown > 0) {
            enemy.shootCooldown -= deltaTime * 16; // Convert to milliseconds
          } else {
            // Get distance and direction to player
            const distX = playerPosRef.current.x - enemy.x;
            const distY = playerPosRef.current.y - enemy.y;
            const dist = Math.sqrt(distX * distX + distY * distY);
            
            // Only shoot if player is within range (800px)
            if (dist < 800) {
              // Create new projectile
              const projectileSpeed = 5;
              const angle = Math.atan2(distY, distX);
              
              projectilesRef.current.push({
                x: enemy.x,
                y: enemy.y,
                velocityX: Math.cos(angle) * projectileSpeed,
                velocityY: Math.sin(angle) * projectileSpeed,
                fromEnemy: true
              });
              
              // Play sound
              playHit();
              
              // Reset cooldown based on enemy type
              if (enemy.isBoss) {
                enemy.shootCooldown = 2000 + Math.random() * 1000; // Bosses shoot more often
              } else if (enemy.type === 'cat') {
                enemy.shootCooldown = 3000 + Math.random() * 2000;
              } else if (enemy.type === 'crow') {
                enemy.shootCooldown = 4000 + Math.random() * 3000;
              } else if (enemy.type === 'snake') {
                enemy.shootCooldown = 5000 + Math.random() * 2000;
              } else {
                enemy.shootCooldown = 4000 + Math.random() * 3000; // Default
              }
            }
          }
        }
        
        // Draw enemy - size depends on if it's a boss or not
        const size = enemy.isBoss ? 80 : 40;
        const halfSize = size / 2;
        
        // Get appropriate enemy color based on type
        let enemyColor;
        if (enemy.type === 'cat') {
          enemyColor = '#FF7700'; // Orange
        } else if (enemy.type === 'crow') {
          enemyColor = '#222222'; // Dark grey
        } else if (enemy.type === 'frog') {
          enemyColor = '#33AA33'; // Green
        } else if (enemy.type === 'mouse') {
          enemyColor = '#AAAAAA'; // Grey
        } else if (enemy.type === 'snake') {
          enemyColor = '#66AA66'; // Green-yellow
        } else if (enemy.type.startsWith('mutant_')) {
          // Boss colors are more vibrant
          if (enemy.type === 'mutant_mouse') {
            enemyColor = '#FF55FF'; // Bright pink
          } else if (enemy.type === 'mutant_cat') {
            enemyColor = '#FF5500'; // Bright orange
          } else if (enemy.type === 'mutant_crow') {
            enemyColor = '#555599'; // Dark blue
          } else if (enemy.type === 'mutant_frog') {
            enemyColor = '#55FF55'; // Bright green
          } else if (enemy.type === 'mutant_snake') {
            enemyColor = '#AAFF00'; // Bright yellow-green
          } else {
            enemyColor = '#FF00FF'; // Default bright magenta
          }
        } else {
          enemyColor = '#FF0000'; // Default red
        }
        
        const texture = textures.current[enemy.type] || null;
        if (texture) {
          // Flip texture based on direction
          ctx.save();
          if (enemy.direction < 0) {
            ctx.translate(enemyX * 2, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
              texture,
              enemyX - halfSize,
              enemy.y - halfSize,
              size,
              size
            );
          } else {
            ctx.drawImage(
              texture,
              enemyX - halfSize,
              enemy.y - halfSize,
              size,
              size
            );
          }
          ctx.restore();
        } else {
          // Draw different animal shapes based on enemy type
          if (enemy.type === 'cat' || enemy.type === 'mutant_cat') {
            // Draw cat
            ctx.fillStyle = enemyColor;
            
            // Body
            ctx.beginPath();
            ctx.ellipse(enemyX, enemy.y, halfSize, halfSize/1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Head
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2, enemy.y - halfSize/2, halfSize/1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Ears
            ctx.beginPath();
            ctx.moveTo(enemyX - halfSize/2 - size/8, enemy.y - halfSize - size/8);
            ctx.lineTo(enemyX - halfSize/2, enemy.y - halfSize - size/4);
            ctx.lineTo(enemyX - halfSize/2 + size/8, enemy.y - halfSize - size/8);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(enemyX - halfSize/2 - size/4, enemy.y - halfSize);
            ctx.lineTo(enemyX - halfSize/2 - size/5, enemy.y - halfSize - size/5);
            ctx.lineTo(enemyX - halfSize/2 - size/8, enemy.y - halfSize);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2 - size/8, enemy.y - halfSize/2, size/10, 0, Math.PI * 2);
            ctx.arc(enemyX - halfSize/2 + size/8, enemy.y - halfSize/2, size/10, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2 - size/8, enemy.y - halfSize/2, size/20, 0, Math.PI * 2);
            ctx.arc(enemyX - halfSize/2 + size/8, enemy.y - halfSize/2, size/20, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.fillStyle = enemyColor;
            ctx.beginPath();
            ctx.moveTo(enemyX + halfSize/1.2, enemy.y);
            ctx.quadraticCurveTo(
              enemyX + size, 
              enemy.y - halfSize/2, 
              enemyX + size, 
              enemy.y - size/2
            );
            ctx.lineWidth = size/10;
            ctx.stroke();
            
          } else if (enemy.type === 'crow' || enemy.type === 'mutant_crow') {
            // Draw crow
            ctx.fillStyle = enemyColor;
            
            // Body
            ctx.beginPath();
            ctx.ellipse(enemyX, enemy.y, halfSize, halfSize/1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Head
            ctx.beginPath();
            ctx.arc(enemyX + halfSize/2, enemy.y - halfSize/3, halfSize/1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Beak
            ctx.fillStyle = '#DDAA00';
            ctx.beginPath();
            ctx.moveTo(enemyX + halfSize, enemy.y - halfSize/3);
            ctx.lineTo(enemyX + halfSize + size/5, enemy.y - halfSize/3 + size/10);
            ctx.lineTo(enemyX + halfSize, enemy.y - halfSize/3 + size/5);
            ctx.fill();
            
            // Wing
            ctx.fillStyle = enemyColor;
            ctx.beginPath();
            ctx.moveTo(enemyX, enemy.y - halfSize/3);
            ctx.lineTo(enemyX - halfSize/2, enemy.y - size);
            ctx.lineTo(enemyX + halfSize/3, enemy.y - halfSize);
            ctx.fill();
            
          } else if (enemy.type === 'frog' || enemy.type === 'mutant_frog') {
            // Draw frog
            ctx.fillStyle = enemyColor;
            
            // Body
            ctx.beginPath();
            ctx.arc(enemyX, enemy.y, halfSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2, enemy.y - halfSize/2, size/6, 0, Math.PI * 2);
            ctx.arc(enemyX + halfSize/2, enemy.y - halfSize/2, size/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2, enemy.y - halfSize/2, size/12, 0, Math.PI * 2);
            ctx.arc(enemyX + halfSize/2, enemy.y - halfSize/2, size/12, 0, Math.PI * 2);
            ctx.fill();
            
            // Mouth
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemyX - halfSize/2, enemy.y + halfSize/4);
            ctx.quadraticCurveTo(enemyX, enemy.y + halfSize/2, enemyX + halfSize/2, enemy.y + halfSize/4);
            ctx.stroke();
            
          } else if (enemy.type === 'mouse' || enemy.type === 'mutant_mouse') {
            // Draw mouse
            ctx.fillStyle = enemyColor;
            
            // Body
            ctx.beginPath();
            ctx.ellipse(enemyX, enemy.y, halfSize, halfSize/1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Head
            ctx.beginPath();
            ctx.arc(enemyX + halfSize/2, enemy.y - halfSize/4, halfSize/1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Ears
            ctx.beginPath();
            ctx.arc(enemyX + halfSize/2 - size/10, enemy.y - halfSize/1.2, size/6, 0, Math.PI * 2);
            ctx.arc(enemyX + halfSize/2 + size/10, enemy.y - halfSize/1.2, size/6, 0, Math.PI * 2);
            ctx.fill();
            
            // Nose
            ctx.fillStyle = '#FF9999';
            ctx.beginPath();
            ctx.arc(enemyX + halfSize, enemy.y - halfSize/4, size/12, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemyX + halfSize/2 - size/10, enemy.y - halfSize/3, size/16, 0, Math.PI * 2);
            ctx.arc(enemyX + halfSize/2 + size/10, enemy.y - halfSize/3, size/16, 0, Math.PI * 2);
            ctx.fill();
            
            // Tail
            ctx.strokeStyle = enemyColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(enemyX - halfSize, enemy.y);
            ctx.quadraticCurveTo(
              enemyX - size, 
              enemy.y - halfSize/2, 
              enemyX - size, 
              enemy.y - size/2
            );
            ctx.stroke();
            
          } else if (enemy.type === 'snake' || enemy.type === 'mutant_snake') {
            // Draw snake
            ctx.fillStyle = enemyColor;
            
            // Body segments
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(enemyX - i * (size/4), enemy.y, size/4, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Head
            ctx.beginPath();
            ctx.arc(enemyX + size/4, enemy.y, size/3, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(enemyX + size/3, enemy.y - size/12, size/10, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(enemyX + size/3, enemy.y - size/12, size/20, 0, Math.PI * 2);
            ctx.fill();
            
            // Tongue
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(enemyX + halfSize, enemy.y);
            ctx.lineTo(enemyX + size, enemy.y);
            ctx.moveTo(enemyX + size, enemy.y);
            ctx.lineTo(enemyX + size + size/10, enemy.y - size/10);
            ctx.moveTo(enemyX + size, enemy.y);
            ctx.lineTo(enemyX + size + size/10, enemy.y + size/10);
            ctx.stroke();
            
          } else {
            // Fallback for unknown enemy types
            ctx.fillStyle = enemyColor;
            ctx.fillRect(enemyX - halfSize, enemy.y - halfSize, size, size);
            
            // Draw eyes
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(enemyX - halfSize/2, enemy.y - halfSize/2, size/8, 0, Math.PI * 2);
            ctx.arc(enemyX + halfSize/2, enemy.y - halfSize/2, size/8, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw mouth
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemyX, enemy.y + halfSize/4, size/6, 0, Math.PI);
            ctx.stroke();
          }
          
          // For bosses, add a crown
          if (enemy.isBoss) {
            ctx.fillStyle = '#FFDD00'; // Gold
            ctx.beginPath();
            ctx.moveTo(enemyX - halfSize/2, enemy.y - halfSize);
            ctx.lineTo(enemyX - halfSize/4, enemy.y - halfSize - halfSize/3);
            ctx.lineTo(enemyX, enemy.y - halfSize);
            ctx.lineTo(enemyX + halfSize/4, enemy.y - halfSize - halfSize/3);
            ctx.lineTo(enemyX + halfSize/2, enemy.y - halfSize);
            ctx.fill();
            
            // Crown jewels
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(enemyX, enemy.y - halfSize - halfSize/6, size/16, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        
        // Draw health bar above enemy
        const healthBarWidth = size;
        const healthBarHeight = 5;
        const healthPercent = enemy.health / (enemy.isBoss ? 10 : 3);
        
        // Health bar background
        ctx.fillStyle = '#000000';
        ctx.fillRect(
          enemyX - healthBarWidth/2, 
          enemy.y - halfSize - 10, 
          healthBarWidth, 
          healthBarHeight
        );
        
        // Health bar fill
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(
          enemyX - healthBarWidth/2, 
          enemy.y - halfSize - 10, 
          healthBarWidth * healthPercent, 
          healthBarHeight
        );
      });
      
      // Draw and update projectiles
      projectilesRef.current.forEach((projectile, index) => {
        // Move projectile
        projectile.x += projectile.velocityX * deltaTime;
        projectile.y += projectile.velocityY * deltaTime;
        
        // Calculate screen position
        const projectileX = projectile.x - cameraX;
        const projectileY = projectile.y;
        
        // Remove projectile if off-screen
        if (
          projectileX < -50 || 
          projectileX > width + 50 || 
          projectileY < -50 || 
          projectileY > height + 50
        ) {
          projectilesRef.current.splice(index, 1);
          return;
        }
        
        // Draw projectile
        ctx.fillStyle = projectile.fromEnemy ? '#FF0000' : '#00FF00';
        ctx.beginPath();
        ctx.arc(projectileX, projectileY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a trail effect
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(
          projectileX - projectile.velocityX, 
          projectileY - projectile.velocityY, 
          3, 
          0, 
          Math.PI * 2
        );
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
        // Check for collision with player if projectile is from enemy
        if (projectile.fromEnemy && !isInvincible) {
          const playerHitboxRadius = 15;
          const dist = Math.sqrt(
            Math.pow(playerPosRef.current.x - projectile.x, 2) + 
            Math.pow(playerPosRef.current.y - projectile.y, 2)
          );
          
          if (dist < playerHitboxRadius + 5) { // 5 is projectile radius
            // Player hit by projectile
            handleTakeDamage(1);
            playHit();
            
            // Remove projectile
            projectilesRef.current.splice(index, 1);
            
            // Make player invincible briefly
            setIsInvincible(true);
            setTimeout(() => setIsInvincible(false), 1000);
            
            // Apply knockback
            playerVelRef.current.x = projectile.velocityX * 0.5;
            playerVelRef.current.y = -5; // Bounce up slightly
          }
        }
      });
      
      // Handle player movement and actions
      const left = keysPressed.current.has('ArrowLeft') || keysPressed.current.has('KeyA');
      const right = keysPressed.current.has('ArrowRight') || keysPressed.current.has('KeyD');
      const jump = keysPressed.current.has('ArrowUp') || keysPressed.current.has('KeyW') || keysPressed.current.has('Space');
      const attack = keysPressed.current.has('KeyM'); // "M" key for sword attack
      
      // Handle sword attack
      if (attack && !attackCooldownRef.current && !isAttackingRef.current) {
        isAttackingRef.current = true;
        attackCooldownRef.current = true;
        
        // Create sword hitbox in front of player
        const attackDirection = isFacingRightRef.current ? 1 : -1;
        swordHitboxRef.current = {
          x: playerPosRef.current.x + (attackDirection * 30),
          y: playerPosRef.current.y,
          width: 40,
          height: 30,
          active: true
        };
        
        // Attack duration
        setTimeout(() => {
          isAttackingRef.current = false;
          swordHitboxRef.current.active = false;
        }, 300);
        
        // Attack cooldown
        setTimeout(() => {
          attackCooldownRef.current = false;
        }, 500);
        
        // Play attack sound
        playHit();
      }
      
      // Check for enemies hit by sword attack
      if (swordHitboxRef.current.active) {
        enemiesRef.current.forEach((enemy, index) => {
          // Adjust hitbox based on enemy size (bosses are bigger)
          const enemySize = enemy.isBoss ? 40 : 20;
          const enemyLeft = enemy.x - enemySize;
          const enemyRight = enemy.x + enemySize;
          const enemyTop = enemy.y - enemySize;
          const enemyBottom = enemy.y + enemySize;
          
          const swordLeft = swordHitboxRef.current.x - swordHitboxRef.current.width / 2;
          const swordRight = swordHitboxRef.current.x + swordHitboxRef.current.width / 2;
          const swordTop = swordHitboxRef.current.y - swordHitboxRef.current.height / 2;
          const swordBottom = swordHitboxRef.current.y + swordHitboxRef.current.height / 2;
          
          // Check for collision between sword and enemy
          if (
            swordRight > enemyLeft &&
            swordLeft < enemyRight &&
            swordBottom > enemyTop &&
            swordTop < enemyBottom
          ) {
            // Damage enemy by 1
            enemy.health--;
            
            // Check if enemy is defeated
            if (enemy.health <= 0) {
              // Add score - 50 points for regular enemies, 200 for bosses
              const pointsEarned = enemy.isBoss ? 200 : 50;
              setScore(prevScore => prevScore + pointsEarned);
              console.log(`Enemy defeated! +${pointsEarned} points! Score: ${score + pointsEarned}`);
              
              // Remove enemy
              enemiesRef.current.splice(index, 1);
              
              // Play success sound
              playSuccess();
            } else {
              // Enemy was hit but not defeated
              playHit();
              
              // Knockback effect
              enemy.x += (enemy.x < playerPosRef.current.x) ? -20 : 20;
            }
            
            // Disable sword hitbox to prevent multiple hits from the same swing
            swordHitboxRef.current.active = false;
          }
        });
      }
      
      // Check for jumping on top of enemies (Mario-style)
      enemiesRef.current.forEach((enemy, index) => {
        // Only check if player is moving downward (falling onto enemy)
        if (playerVelRef.current.y > 0) {
          const enemySize = enemy.isBoss ? 40 : 20;
          const enemyLeft = enemy.x - enemySize;
          const enemyRight = enemy.x + enemySize;
          // Only check the top part of the enemy for jumping on
          const enemyTop = enemy.y - enemySize;
          const enemyTopBottom = enemy.y - enemySize/2;
          
          const playerLeft = playerPosRef.current.x - playerSizeRef.current.width/3;
          const playerRight = playerPosRef.current.x + playerSizeRef.current.width/3;
          const playerBottom = playerPosRef.current.y + playerSizeRef.current.height/2;
          
          // Check if player's feet are hitting enemy's head
          if (
            playerBottom >= enemyTop && 
            playerBottom <= enemyTopBottom &&
            playerRight >= enemyLeft && 
            playerLeft <= enemyRight
          ) {
            // Damage enemy by 1
            enemy.health--;
            
            // Check if enemy is defeated
            if (enemy.health <= 0) {
              // Add score - 50 points for regular enemies, 200 for bosses
              const pointsEarned = enemy.isBoss ? 200 : 50;
              setScore(prevScore => prevScore + pointsEarned);
              console.log(`Enemy defeated! +${pointsEarned} points! Score: ${score + pointsEarned}`);
              
              // Remove enemy
              enemiesRef.current.splice(index, 1);
              
              // Play success sound
              playSuccess();
            } else {
              // Enemy was hit but not defeated
              playHit();
            }
            
            // Bounce player up
            playerVelRef.current.y = -JUMP_FORCE * 0.7;
            isGroundedRef.current = false;
          }
        }
      });
      
      // Check for hitting hidden blocks with the character's head (jumping into them)
      obstaclesRef.current.forEach((obstacle, index) => {
        if (obstacle.type === 'hiddenBlock' && !obstacle.hit) {
          const obstacleLeft = obstacle.x - obstacle.width / 2;
          const obstacleRight = obstacle.x + obstacle.width / 2;
          const obstacleBottom = obstacle.y + obstacle.height / 2;
          
          const playerLeft = playerPosRef.current.x - playerSizeRef.current.width / 2;
          const playerRight = playerPosRef.current.x + playerSizeRef.current.width / 2;
          const playerTop = playerPosRef.current.y - playerSizeRef.current.height / 2;
          
          // Check if player is hitting block from below
          if (
            playerRight > obstacleLeft &&
            playerLeft < obstacleRight &&
            playerTop <= obstacleBottom &&
            playerTop > obstacle.y &&
            playerVelRef.current.y < 0 // Moving upward
          ) {
            // Mark the block as hit and revealed
            obstacle.hit = true;
            obstacle.revealed = true;
            obstacle.contentVisible = true;
            
            // Bounce player down slightly
            playerVelRef.current.y = 2;
            
            // Play success sound
            playSuccess();
            
            // After a delay, make the content float up and away
            setTimeout(() => {
              // Spawn the actual collectible or power-up
              if (obstacle.content?.startsWith('coin')) {
                // Add points based on coin value
                const coinValue = parseInt(obstacle.content.replace('coin', ''));
                // Add points to score
                setScore(prevScore => prevScore + coinValue);
                console.log(`Collected ${coinValue} coins! Score: ${score + coinValue}`);
              } else if (obstacle.content === 'mushroom') {
                // Power up the player
                handlePowerUp(30000); // 30 seconds powerup
                console.log("Mushroom power-up activated!");
              } else if (obstacle.content === 'joint') {
                // Temporary invincibility
                setIsInvincible(true);
                setTimeout(() => setIsInvincible(false), 10000);
                console.log("Joint power-up: 10 seconds invincibility!");
              }
              
              // Remove the content from the block after it's collected
              setTimeout(() => {
                obstacle.contentVisible = false;
              }, 500);
            }, 300);
          }
        }
      });
      
      // Check for checkpoint activation
      obstaclesRef.current.forEach((obstacle) => {
        if (obstacle.type === 'checkpoint' && !obstacle.activated) {
          const distX = Math.abs(playerPosRef.current.x - obstacle.x);
          const distY = Math.abs(playerPosRef.current.y - obstacle.y);
          
          // Check if player is close to checkpoint
          if (distX < 40 && distY < 60) {
            // Activate checkpoint
            obstacle.activated = true;
            
            // Update last checkpoint position
            lastCheckpointRef.current = {
              x: obstacle.x,
              y: obstacle.y - 30 // Slightly above the checkpoint
            };
            
            // Play success sound
            playSuccess();
            
            console.log("Checkpoint activated!");
          }
        }
      });
      
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
      
      // Check if player has fallen into a pit (below the screen)
      if (playerPosRef.current.y > height + 100) {
        // Player fell into a pit, lose a life and reset position
        playHit();
        takeDamage(3); // Lose all health, which will decrease one life
        
        // Reset player position to spawn
        playerPosRef.current.x = 100;
        playerPosRef.current.y = height - 100;
        playerVelRef.current.x = 0;
        playerVelRef.current.y = 0;
        setPosition([100, height - 100, 0]);
        
        // Reset camera position
        cameraOffsetRef.current.x = 0;
      }
      
      // Check if player has reached the border fence (level exit)
      const distanceToExit = Math.abs(playerPosRef.current.x - exit[0]);
      const distanceToExitY = Math.abs(playerPosRef.current.y - exit[1]);
      
      if (distanceToExit < 30 && distanceToExitY < 100) {
        // Player reached the exit/border
        playSuccess();
        
        // Add 100 points for completing the level
        setScore(prevScore => prevScore + 100);
        console.log("Level complete! +100 points! Score: " + (score + 100));
        
        // Unlock the next level
        unlockNextLevel();
        
        // Determine next level
        let nextLevel = currentLevel;
        let nextWorld = currentWorld;
        
        if (currentLevel < 4) { // If not the last level in the world
          nextLevel = currentLevel + 1;
        } else if (currentWorld < 4) { // If not the last world
          nextWorld = currentWorld + 1;
          nextLevel = 0;
        } else {
          // Player beat the game - for now just loop back to the beginning
          nextWorld = 0;
          nextLevel = 0;
        }
        
        // Set next level after a short delay
        setTimeout(() => {
          setCurrentLevel(nextLevel);
          // If we're changing worlds
          if (nextWorld !== currentWorld) {
            useLevels.getState().setCurrentWorld(nextWorld);
          }
        }, 1000);
      }
      
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
      
      // Check if player has fallen into a pit (way below the screen)
      if (playerPosRef.current.y > height + 100) {
        console.log("Player fell into a pit!");
        
        // Lose a life (take full health damage to lose one life)
        handleTakeDamage(maxHealth);
        
        // Play hit sound
        playHit();
        
        // Respawn at last checkpoint or level start
        if (lastCheckpointRef.current) {
          playerPosRef.current.x = lastCheckpointRef.current.x;
          playerPosRef.current.y = lastCheckpointRef.current.y;
        } else {
          // No checkpoint reached, respawn at beginning
          playerPosRef.current.x = 100;
          playerPosRef.current.y = height - 100;
        }
        
        // Reset velocity
        playerVelRef.current.x = 0;
        playerVelRef.current.y = 0;
        
        // Set temporary invincibility to prevent chain deaths
        setIsInvincible(true);
        setTimeout(() => {
          setIsInvincible(false);
        }, 2000);
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
      
      // Draw sword if attacking
      if (isAttackingRef.current) {
        // Determine sword position based on facing direction
        const swordX = playerScreenX + (isFacingRightRef.current ? 30 : -30);
        const swordY = playerPosRef.current.y;
        
        // Save context for rotation
        ctx.save();
        
        // Translate to sword position for rotation
        ctx.translate(swordX, swordY);
        
        // Rotate sword based on direction
        if (isFacingRightRef.current) {
          ctx.rotate(Math.PI / 4); // 45 degrees
        } else {
          ctx.rotate(-Math.PI / 4); // -45 degrees
        }
        
        // Draw sword
        ctx.fillStyle = '#CCCCCC'; // Silver blade
        ctx.fillRect(-5, -30, 10, 40); // Blade
        
        ctx.fillStyle = '#8B4513'; // Brown handle
        ctx.fillRect(-5, 10, 10, 15); // Handle
        
        // Draw shine on blade
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-2, -25, 2, 30);
        
        // Restore context
        ctx.restore();
      }
      
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
      
      // Draw UI elements (health bar, lives)
      drawUI(ctx);
      
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
    isInvincible,
    health,
    maxHealth,
    hearts,
    isGameOver,
    resetGame
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