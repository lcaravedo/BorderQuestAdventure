import React, { useRef, useEffect } from 'react';
import { Container, Sprite, useTick } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { usePlayer } from '@/lib/stores/usePlayer';

interface Enemy2DProps {
  x: number;
  y: number;
  type: 'cat' | 'drone' | 'frog' | 'snake' | 'shark' | 'fish' | 'mouse';
  patrolMinX: number;
  patrolMaxX: number;
  speed?: number;
  isWaterEnemy?: boolean;
}

export default function Enemy2D({
  x,
  y,
  type,
  patrolMinX,
  patrolMaxX,
  speed = 1.5,
  isWaterEnemy = false
}: Enemy2DProps) {
  const containerRef = useRef<PIXI.Container>(null);
  const spriteRef = useRef<PIXI.Sprite>(null);
  const velocityRef = useRef({ x: speed, y: 0 });
  const directionRef = useRef(1); // 1 for right, -1 for left
  const animationFrameRef = useRef(0);
  const animationTickRef = useRef(0);
  const jumpTimerRef = useRef(0);
  
  // Get player position for chasing behavior
  const { position: playerPosition, takeDamage } = usePlayer();
  
  // Load enemy texture based on type
  const getEnemyTexture = () => {
    switch (type) {
      case 'cat': return PIXI.Texture.from('/textures/cat_enemy.svg');
      case 'drone': return PIXI.Texture.from('/textures/drone.svg');
      case 'frog': return PIXI.Texture.from('/textures/frog_enemy.svg');
      case 'snake': return PIXI.Texture.from('/textures/snake_enemy.svg');
      case 'shark': return PIXI.Texture.from('/textures/shark_enemy.svg');
      case 'fish': return PIXI.Texture.from('/textures/fish_enemy.svg');
      case 'mouse': return PIXI.Texture.from('/textures/mouse_enemy.svg');
      default: return PIXI.Texture.from('/textures/cat_enemy.svg');
    }
  };
  
  const texture = getEnemyTexture();
  
  // Set initial position
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.x = x;
      containerRef.current.y = y;
    }
  }, [x, y]);
  
  // Enemy AI and movement logic
  useTick((delta) => {
    if (!containerRef.current || !spriteRef.current) return;
    
    // Get current positions
    const enemyPos = { 
      x: containerRef.current.x, 
      y: containerRef.current.y 
    };
    
    const playerPos = { 
      x: playerPosition[0], 
      y: playerPosition[1] 
    };
    
    // Distance to player
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerPos.x - enemyPos.x, 2) + 
      Math.pow(playerPos.y - enemyPos.y, 2)
    );
    
    // Enemy-specific behavior
    switch (type) {
      case 'cat':
        // Cats chase the player when close, otherwise patrol
        if (distanceToPlayer < 150) {
          // Chase player
          directionRef.current = playerPos.x > enemyPos.x ? 1 : -1;
          velocityRef.current.x = directionRef.current * speed * 1.2; // Faster when chasing
        } else {
          // Regular patrol
          velocityRef.current.x = directionRef.current * speed;
          
          // Change direction at patrol bounds
          if (
            (enemyPos.x >= patrolMaxX && directionRef.current > 0) ||
            (enemyPos.x <= patrolMinX && directionRef.current < 0)
          ) {
            directionRef.current *= -1;
          }
        }
        break;
        
      case 'frog':
        // Frogs make big jumps periodically
        jumpTimerRef.current += delta;
        
        if (jumpTimerRef.current > 3) { // Jump every 3 seconds
          jumpTimerRef.current = 0;
          velocityRef.current.y = -10; // Big jump
          
          // Jump toward player if nearby
          if (distanceToPlayer < 200) {
            directionRef.current = playerPos.x > enemyPos.x ? 1 : -1;
          } else {
            // Otherwise, random direction
            directionRef.current = Math.random() > 0.5 ? 1 : -1;
          }
          
          velocityRef.current.x = directionRef.current * speed * 2;
        }
        
        // Apply gravity
        velocityRef.current.y += 0.5 * delta;
        
        // Ground collision (simplified)
        if (enemyPos.y > y) { // y is original ground level
          enemyPos.y = y;
          velocityRef.current.y = 0;
        }
        break;
        
      case 'snake':
        // Snakes move in a slithering pattern
        velocityRef.current.x = directionRef.current * speed;
        
        // Vertical slithering motion
        containerRef.current.y = y + Math.sin(enemyPos.x * 0.05) * 10;
        
        // Change direction at patrol bounds
        if (
          (enemyPos.x >= patrolMaxX && directionRef.current > 0) ||
          (enemyPos.x <= patrolMinX && directionRef.current < 0)
        ) {
          directionRef.current *= -1;
        }
        break;
        
      case 'drone':
        // Drones patrol in the air and can move vertically too
        velocityRef.current.x = directionRef.current * speed;
        
        // Slight bobbing motion
        containerRef.current.y = y + Math.sin(Date.now() * 0.003) * 10;
        
        // Change direction at patrol bounds
        if (
          (enemyPos.x >= patrolMaxX && directionRef.current > 0) ||
          (enemyPos.x <= patrolMinX && directionRef.current < 0)
        ) {
          directionRef.current *= -1;
        }
        break;
        
      default:
        // Default patrol behavior
        velocityRef.current.x = directionRef.current * speed;
        
        // Change direction at patrol bounds
        if (
          (enemyPos.x >= patrolMaxX && directionRef.current > 0) ||
          (enemyPos.x <= patrolMinX && directionRef.current < 0)
        ) {
          directionRef.current *= -1;
        }
        break;
    }
    
    // Update position
    containerRef.current.x += velocityRef.current.x * delta;
    containerRef.current.y += velocityRef.current.y * delta;
    
    // Update sprite direction
    spriteRef.current.scale.x = directionRef.current;
    
    // Collision detection with player (simple circle collision)
    if (distanceToPlayer < 30) {
      takeDamage(1);
    }
    
    // Animation update
    animationTickRef.current += delta;
    if (animationTickRef.current > 0.1) {
      animationTickRef.current = 0;
      animationFrameRef.current = (animationFrameRef.current + 1) % 4;
    }
  });
  
  // Determine enemy size based on type
  const getEnemySize = () => {
    switch (type) {
      case 'cat': return { width: 50, height: 30 };
      case 'drone': return { width: 40, height: 40 };
      case 'frog': return { width: 40, height: 40 };
      case 'snake': return { width: 60, height: 20 };
      case 'shark': return { width: 70, height: 40 };
      case 'fish': return { width: 30, height: 20 };
      case 'mouse': return { width: 30, height: 25 };
      default: return { width: 40, height: 40 };
    }
  };
  
  const size = getEnemySize();
  
  return (
    <Container ref={containerRef} position={[x, y]}>
      <Sprite
        ref={spriteRef}
        texture={texture}
        width={size.width}
        height={size.height}
        anchor={0.5}
      />
    </Container>
  );
}