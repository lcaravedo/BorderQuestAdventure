import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useAudio } from '@/lib/stores/useAudio';

interface PowerUpProps {
  position: [number, number, number];
  id: string;
  duration?: number; // Duration of power-up in milliseconds
}

export default function PowerUp({ position, id, duration = 10000 }: PowerUpProps) {
  const powerUpRef = useRef<THREE.Group>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  // Player and audio store
  const { position: playerPosition, isPoweredUp, powerUp } = usePlayer();
  const { playSuccess } = useAudio();
  
  // Load texture
  const mushroomTexture = new THREE.TextureLoader().load('/textures/mushroom_powerup.svg');
  mushroomTexture.anisotropy = 16;
  
  // Create material
  const mushroomMaterial = new THREE.SpriteMaterial({ 
    map: mushroomTexture,
    color: 0xffffff,
  });
  
  // Animation and collection check
  useFrame((state, delta) => {
    if (!powerUpRef.current || isCollected) return;
    
    // Spinning animation
    powerUpRef.current.rotation.y += delta * 2;
    
    // Floating animation
    powerUpRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    
    // Check for collision with player
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    const powerUpPos = new THREE.Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(powerUpPos);
    
    // If player is close enough, collect the power-up
    if (distance < 1.5 && !isCollected) {
      setIsCollected(true);
      setShowMessage(true);
      
      // Play success sound
      playSuccess();
      
      // Apply power-up effect
      powerUp(duration);
      
      // Hide message after 2 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 2000);
    }
  });
  
  // Don't render if collected
  if (isCollected && !showMessage) return null;
  
  return (
    <group ref={powerUpRef} position={[position[0], position[1], position[2]]}>
      {!isCollected && (
        <>
          {/* Mushroom sprite */}
          <sprite 
            material={mushroomMaterial}
            scale={[1.5, 1.5, 1]}
          />
          
          {/* Glow effect */}
          <pointLight 
            color="#ffff00" 
            intensity={1} 
            distance={3} 
            decay={2}
          />
        </>
      )}
      
      {/* Collection message */}
      {showMessage && (
        <Text
          position={[0, 2, 0]}
          color="yellow"
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
          backgroundColor="#000000"
          backgroundOpacity={0.7}
          padding={0.2}
        >
          Power Up! Full Chihuahua Mode!
        </Text>
      )}
    </group>
  );
}