import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useLevels } from '@/lib/stores/useLevels';
import { useCollectibles } from '@/lib/stores/useCollectibles';

interface CheckpointProps {
  position: [number, number, number];
  id: string;
}

export default function Checkpoint({ position, id }: CheckpointProps) {
  const checkpointRef = useRef<THREE.Group>(null);
  const [isActive, setIsActive] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  // Load stores
  const { position: playerPosition, saveProgress: savePlayerProgress } = usePlayer();
  const { saveProgress: saveLevelsProgress } = useLevels();
  const { saveProgress: saveCollectiblesProgress } = useCollectibles();
  
  // Load texture
  const statueTexture = new THREE.TextureLoader().load('/textures/tequila_statue.svg');
  statueTexture.anisotropy = 16;
  
  // Create material
  const statueMaterial = new THREE.SpriteMaterial({ 
    map: statueTexture,
    color: isActive ? 0xffff99 : 0xffffff,
  });
  
  // Floating animation and rotation
  useFrame((state, delta) => {
    if (!checkpointRef.current) return;
    
    // Gentle floating effect
    checkpointRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.1;
    
    // Check if player is close enough to activate
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    const checkpointPos = new THREE.Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(checkpointPos);
    
    // Activate if player is close (within 2 units)
    if (distance < 2 && !hasTriggered) {
      setIsActive(true);
      
      // Only trigger once until player moves away
      if (!hasTriggered) {
        setHasTriggered(true);
        setShowMessage(true);
        
        // Save all progress
        savePlayerProgress();
        saveLevelsProgress();
        saveCollectiblesProgress();
        
        // Hide message after 3 seconds
        setTimeout(() => {
          setShowMessage(false);
        }, 3000);
      }
    } else if (distance > 3) {
      // Reset trigger when player moves away
      setHasTriggered(false);
      setIsActive(false);
    }
  });
  
  return (
    <group ref={checkpointRef} position={[position[0], position[1], position[2]]}>
      {/* Statue sprite */}
      <sprite 
        material={statueMaterial}
        scale={[2, 2, 1]}
      />
      
      {/* Checkpoint light when active */}
      {isActive && (
        <pointLight 
          color="#ffff99" 
          intensity={2} 
          distance={4} 
          decay={2}
        />
      )}
      
      {/* Checkpoint message */}
      {showMessage && (
        <Text
          position={[0, 2, 0]}
          color="white"
          fontSize={0.5}
          anchorX="center"
          anchorY="middle"
          backgroundColor="#000000"
          backgroundOpacity={0.7}
          padding={0.2}
        >
          Game Saved! ¡Salud!
        </Text>
      )}
    </group>
  );
}