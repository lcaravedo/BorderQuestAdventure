import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useAudio } from "@/lib/stores/useAudio";

interface EnemyProps {
  position: [number, number, number];
  patrolArea: [number, number]; // Min and max x positions for patrol
  type: 'cat' | 'drone' | 'frog' | 'snake' | 'shark' | 'fish' | 'mouse';
  speed?: number;
  isWaterEnemy?: boolean; // For water-based enemies like fish and sharks
}

export default function Enemy({
  position,
  patrolArea,
  type = 'cat',
  speed = 1.5,
  isWaterEnemy = false,
}: EnemyProps) {
  // References
  const enemyRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [frameCount, setFrameCount] = useState(0);
  const [isStunned, setIsStunned] = useState(false);
  const [isDamaging, setIsDamaging] = useState(false);
  
  // Get player data from store
  const { position: playerPosition, velocity: playerVelocity, takeDamage } = usePlayer();
  const { playHit } = useAudio();
  
  // Load appropriate enemy texture based on type
  let texturePath = '/textures/cat_enemy.svg';
  switch (type) {
    case 'cat':
      texturePath = '/textures/cat_enemy.svg';
      break;
    case 'drone':
      texturePath = '/textures/drone.svg';
      break;
    case 'frog':
      texturePath = '/textures/frog_enemy.svg';
      break;
    case 'snake':
      texturePath = '/textures/snake_enemy.svg';
      break;
    case 'shark':
      texturePath = '/textures/shark_enemy.svg';
      break;
    case 'fish':
      texturePath = '/textures/fish_enemy.svg';
      break;
    case 'mouse':
      texturePath = '/textures/mouse_enemy.svg';
      break;
    default:
      texturePath = '/textures/cat_enemy.svg';
  }
  
  const enemyTexture = new THREE.TextureLoader().load(texturePath);
  enemyTexture.anisotropy = 16;
  
  // Create enemy sprite material with appropriate color tint
  const spriteMaterial = new THREE.SpriteMaterial({
    map: enemyTexture,
    color: 0xffffff, // Default white (no tint)
  });
  
  // Handle enemy stunned by bark effect
  useEffect(() => {
    if (isStunned) {
      const timer = setTimeout(() => {
        setIsStunned(false);
      }, 2000); // Stunned for 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isStunned]);
  
  // Stunned visual effect using sine wave
  const getStunnedOffset = () => {
    if (!isStunned) return 0;
    return Math.sin(Date.now() * 0.01) * 0.1;
  };
  
  useFrame((state, delta) => {
    if (!enemyRef.current || !spriteRef.current) return;
    
    // Increment frame counter for animations
    setFrameCount((prev) => (prev + 1) % 60);
    
    // Get current positions
    const enemyPos = enemyRef.current.position;
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    
    // Calculate distance to player
    const distanceToPlayer = enemyPos.distanceTo(playerPos);
    
    // Check if player is nearby
    const isPlayerNearby = distanceToPlayer < 5;
    
    // Direction sprite should face
    const faceDirection = enemyPos.x > playerPos.x ? -1 : 1;
    
    // Update sprite facing direction
    spriteRef.current.scale.x = faceDirection * 1.5;
    
    // If stunned, don't move but add visual effect
    if (isStunned) {
      spriteRef.current.position.x = getStunnedOffset();
      spriteRef.current.position.y = getStunnedOffset();
      enemyRef.current.position.y = 0.5 + Math.sin(frameCount * 0.5) * 0.05;
      return;
    }
    
    // Handle different enemy movements based on type
    switch (type) {
      case 'cat':
        // Cats chase the player if nearby
        if (isPlayerNearby) {
          const moveDirection = enemyPos.x < playerPos.x ? 1 : -1;
          setDirection(moveDirection);
          
          // Move towards player
          enemyPos.x += moveDirection * speed * delta;
          
          // Simple hop animation
          enemyPos.y = 0.5 + Math.abs(Math.sin(frameCount * 0.1)) * 0.3;
        } else {
          // Otherwise patrol
          enemyPos.x += direction * speed * delta;
          enemyPos.y = 0.5 + Math.abs(Math.sin(frameCount * 0.2)) * 0.1;
        }
        break;
        
      case 'drone':
        // Drones hover and move in patrol area
        enemyPos.y = 2.5 + Math.sin(frameCount * 0.05) * 0.3;
        enemyPos.x += direction * speed * 0.5 * delta;
        break;
        
      case 'frog':
        // Frogs hop with big jumps
        enemyPos.x += direction * speed * delta * (Math.sin(frameCount * 0.05) > 0 ? 2 : 0.2);
        enemyPos.y = 0.5 + Math.abs(Math.sin(frameCount * 0.05)) * 1;
        break;
        
      case 'snake':
        // Snakes move in a slithering pattern
        enemyPos.x += direction * speed * delta;
        enemyPos.y = 0.3 + Math.sin(frameCount * 0.2) * 0.1;
        break;
        
      case 'shark':
      case 'fish':
        // Water enemies move with a swimming pattern
        if (isWaterEnemy) {
          // Stay in water area (assume water is below y=0)
          enemyPos.y = -0.5 + Math.sin(frameCount * 0.1) * 0.3;
          
          // Fish move faster but in more erratic patterns
          if (type === 'fish') {
            enemyPos.x += direction * speed * 1.5 * delta;
            // Occasionally change direction randomly
            if (Math.random() < 0.01) setDirection(direction * -1);
          } else {
            // Sharks move more deliberately
            enemyPos.x += direction * speed * delta;
          }
        }
        break;
        
      case 'mouse':
        // Mice move quickly with small erratic movements
        enemyPos.x += direction * speed * 1.2 * delta;
        enemyPos.y = 0.3 + Math.sin(frameCount * 0.3) * 0.05;
        // Occasionally make small jumps
        if (Math.random() < 0.005) {
          enemyPos.y += 0.2;
        }
        break;
        
      default:
        // Generic patrol movement for other enemies
        enemyPos.x += direction * speed * delta;
        enemyPos.y = 0.5 + Math.abs(Math.sin(frameCount * 0.2)) * 0.1;
    }
    
    // Change direction at patrol bounds for all enemy types
    if (enemyPos.x <= patrolArea[0] || enemyPos.x >= patrolArea[1]) {
      setDirection(direction * -1);
    }
    
    // Collision detection with player for damage (only if not recently damaged)
    if (!isDamaging && distanceToPlayer < 1.2) {
      setIsDamaging(true);
      takeDamage(1);
      playHit();
      
      // Cooldown between damage intervals
      setTimeout(() => {
        setIsDamaging(false);
      }, 1000);
    }
    
    // Detect if player is barking nearby - check playerVelocity[3] which would be our custom bark flag
    const isBeingBarkedAt = distanceToPlayer < 3 && playerVelocity[3] === 1;
    
    if (isBeingBarkedAt && !isStunned) {
      setIsStunned(true);
      playHit();
    }
  });
  
  return (
    <group ref={enemyRef} position={[position[0], position[1], position[2]]}>
      <sprite 
        ref={spriteRef} 
        material={spriteMaterial}
        scale={[1.5, 1.5, 1]}
      >
        {isStunned && (
          <spriteMaterial
            color={0xffff00} 
            opacity={0.5} 
            transparent
          />
        )}
      </sprite>
      
      {/* Invisible collision box */}
      <mesh visible={false}>
        <boxGeometry args={[0.8, 1.2, 0.8]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      
      {/* Stunned indicator */}
      {isStunned && (
        <sprite position={[0, 1, 0]} scale={[0.5, 0.5, 1]}>
          <spriteMaterial color={0xffff00} />
        </sprite>
      )}
      
      {/* Simple shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
