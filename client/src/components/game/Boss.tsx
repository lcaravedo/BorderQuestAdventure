import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useAudio } from '@/lib/stores/useAudio';

interface BossProps {
  position: [number, number, number];
  id: string;
  health?: number;
  worldIndex: number;
}

export default function Boss({ position, id, health = 10, worldIndex }: BossProps) {
  const bossRef = useRef<THREE.Group>(null);
  const [bossHealth, setBossHealth] = useState(health);
  const [isDefeated, setIsDefeated] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [attackCooldown, setAttackCooldown] = useState(0);
  const [playerAttackCooldown, setPlayerAttackCooldown] = useState(0);
  const [attackDirection, setAttackDirection] = useState<THREE.Vector3 | null>(null);
  
  // Player and audio store
  const { 
    position: playerPosition, 
    takeDamage, 
    addHeart, 
    isPoweredUp 
  } = usePlayer();
  const { playHit } = useAudio();
  
  // Load texture
  const bossTexture = new THREE.TextureLoader().load('/textures/boss.svg');
  bossTexture.anisotropy = 16;
  
  // Create material
  const bossMaterial = new THREE.SpriteMaterial({ 
    map: bossTexture,
    color: isDefeated ? 0x888888 : 0xffffff,
  });
  
  // Animation and boss logic
  useFrame((state, delta) => {
    if (!bossRef.current || isDefeated) return;
    
    // Boss movement
    const time = state.clock.elapsedTime;
    bossRef.current.position.x = position[0] + Math.sin(time * 0.5) * 2;
    bossRef.current.position.y = position[1] + Math.sin(time * 0.2) * 0.5;
    
    // Get positions
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    const bossPos = new THREE.Vector3(
      bossRef.current.position.x, 
      bossRef.current.position.y, 
      bossRef.current.position.z
    );
    const distance = playerPos.distanceTo(bossPos);
    
    // Decrease cooldowns
    if (attackCooldown > 0) setAttackCooldown(attackCooldown - delta);
    if (playerAttackCooldown > 0) setPlayerAttackCooldown(playerAttackCooldown - delta);
    
    // Boss attacks player when close
    if (distance < 5 && attackCooldown <= 0) {
      // Calculate attack direction
      const direction = new THREE.Vector3()
        .subVectors(playerPos, bossPos)
        .normalize();
      
      setAttackDirection(direction);
      setAttackCooldown(2); // 2 second cooldown
      
      // Damage player if very close
      if (distance < 2) {
        takeDamage(1);
        playHit();
      }
    }
    
    // Player attacks boss with bark
    if (distance < 3 && playerAttackCooldown <= 0 && playerPosition[3] > 0) {
      // Take more damage if powered up
      const damageAmount = isPoweredUp ? 2 : 1;
      setBossHealth(prev => Math.max(0, prev - damageAmount));
      setPlayerAttackCooldown(1); // 1 second cooldown
      playHit();
      
      // Check if boss is defeated
      if (bossHealth - damageAmount <= 0) {
        setIsDefeated(true);
        setShowMessage(true);
        
        // Award heart to player
        addHeart();
        
        // Hide message after 3 seconds
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      }
    }
  });
  
  // Render boss with health bar
  return (
    <group ref={bossRef} position={[position[0], position[1], position[2]]}>
      {/* Boss sprite */}
      <sprite 
        material={bossMaterial}
        scale={[3, 3, 1]}
      />
      
      {/* Health bar background */}
      {!isDefeated && (
        <>
          <mesh position={[0, 2, 0]}>
            <planeGeometry args={[3, 0.3]} />
            <meshBasicMaterial color="black" />
          </mesh>
          
          {/* Health bar fill */}
          <mesh position={[-(1.5 - (bossHealth / health * 1.5)), 2, 0.1]}>
            <planeGeometry args={[3 * (bossHealth / health), 0.2]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </>
      )}
      
      {/* Attack visualizer */}
      {attackDirection && attackCooldown > 1.5 && (
        <mesh 
          position={[
            attackDirection.x * 2,
            attackDirection.y * 2,
            0
          ]}
        >
          <sphereGeometry args={[0.5, 8, 8]} />
          <meshBasicMaterial color="red" transparent opacity={0.7} />
        </mesh>
      )}
      
      {/* Victory message */}
      {showMessage && (
        <Text
          position={[0, 3, 0]}
          color="yellow"
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
          backgroundColor="#000000"
          backgroundOpacity={0.7}
          padding={0.2}
        >
          ¡Victoria! +1 Heart Gained!
        </Text>
      )}
    </group>
  );
}