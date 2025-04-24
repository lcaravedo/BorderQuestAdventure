import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useCollectibles } from "@/lib/stores/useCollectibles";
import { useAudio } from "@/lib/stores/useAudio";

interface CollectibleProps {
  id: string;
  position: [number, number, number];
  type: 'bone' | 'visa' | 'snack';
}

export default function Collectible({ id, position, type }: CollectibleProps) {
  const collectibleRef = useRef<THREE.Group>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [hoverOffset, setHoverOffset] = useState(0);
  
  // Get needed store functions
  const { position: playerPosition } = usePlayer();
  const { collectItem, isCollected: checkIfCollected } = useCollectibles();
  const { playSuccess } = useAudio();
  
  // Check if this collectible was already collected
  const wasCollected = checkIfCollected(id);
  
  // Don't render if already collected
  if (wasCollected) return null;
  
  // Load the appropriate texture based on collectible type
  const getTextureForType = () => {
    switch (type) {
      case 'bone':
        return new THREE.TextureLoader().load('/textures/bone.svg');
      case 'visa':
        return new THREE.TextureLoader().load('/textures/visa.svg');
      case 'snack':
        return new THREE.TextureLoader().load('/textures/snack.svg');
      default:
        return new THREE.TextureLoader().load('/textures/bone.svg');
    }
  };
  
  // Set color based on collectible type
  const getColorForType = () => {
    switch (type) {
      case 'bone': return new THREE.Color(0xFFFFFF);
      case 'visa': return new THREE.Color(0x66EE66);
      case 'snack': return new THREE.Color(0xFFDD44);
      default: return new THREE.Color(0xFFFFFF);
    }
  };
  
  // Create material for the collectible
  const collectibleTexture = getTextureForType();
  const collectibleMaterial = new THREE.SpriteMaterial({
    map: collectibleTexture,
    color: getColorForType(),
  });
  
  // Animation and collision detection
  useFrame((state, delta) => {
    if (!collectibleRef.current || isCollected) return;
    
    // Get current positions
    const itemPos = collectibleRef.current.position;
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    
    // Hover animation
    const newHoverOffset = (hoverOffset + delta) % (Math.PI * 2);
    setHoverOffset(newHoverOffset);
    
    // Apply hover animation
    collectibleRef.current.position.y = position[1] + Math.sin(newHoverOffset * 2) * 0.2;
    collectibleRef.current.rotation.y += delta * 2;
    
    // Check for collision with player
    const distanceToPlayer = itemPos.distanceTo(playerPos);
    
    if (distanceToPlayer < 1.2 && !isCollected) {
      // Mark as collected
      setIsCollected(true);
      
      // Add to collected items in store
      collectItem(id, type);
      
      // Play success sound
      playSuccess();
      
      // Visual collection effect
      if (collectibleRef.current) {
        // Create a simple collection animation
        const origScale = collectibleRef.current.scale.clone();
        const animateCollection = () => {
          if (collectibleRef.current) {
            collectibleRef.current.scale.multiplyScalar(1.1);
            collectibleRef.current.position.y += 0.1;
            
            if (collectibleRef.current.scale.x < origScale.x * 2) {
              requestAnimationFrame(animateCollection);
            }
          }
        };
        
        animateCollection();
      }
    }
  });
  
  // Handle collection value by type
  const getValue = () => {
    switch (type) {
      case 'bone': return 10; // Points
      case 'visa': return 1; // Progress
      case 'snack': return 2; // Health
      default: return 10;
    }
  };
  
  return (
    <group 
      ref={collectibleRef} 
      position={[position[0], position[1], position[2]]}
    >
      <sprite
        scale={[1, 1, 1]}
        material={collectibleMaterial}
      />
      
      {/* Glow effect */}
      <pointLight 
        color={getColorForType()} 
        intensity={0.8} 
        distance={2} 
      />
      
      {/* Value indicator */}
      <sprite
        position={[0, 0.7, 0]}
        scale={[0.3, 0.3, 0.3]}
      >
        <spriteMaterial 
          color="white"
          transparent
          opacity={0.8}
        />
      </sprite>
    </group>
  );
}
