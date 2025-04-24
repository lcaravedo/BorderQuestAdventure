import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlayer } from "@/lib/stores/usePlayer";

interface PlatformProps {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  moving?: boolean;
  movementAxis?: 'x' | 'y';
  movementRange?: number;
  movementSpeed?: number;
}

interface PlatformsProps {
  platforms: PlatformProps[];
}

// Individual platform component
function Platform({
  position,
  size,
  color = "#8B4513",
  moving = false,
  movementAxis = 'x',
  movementRange = 3,
  movementSpeed = 1,
}: PlatformProps) {
  const platformRef = useRef<THREE.Mesh>(null);
  const initialPosition = useRef(new THREE.Vector3(...position));
  const time = useRef(Math.random() * 100);
  
  // Player position and state
  const { position: playerPosition, velocity, setGrounded, isGrounded } = usePlayer();
  
  // Texture for platform
  const texture = useMemo(() => {
    const groundTexture = new THREE.TextureLoader().load('/textures/tileset.svg');
    groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
    
    // Scale the texture based on platform size
    groundTexture.repeat.set(size[0], size[1]);
    return groundTexture;
  }, [size]);
  
  useFrame((state, delta) => {
    if (!platformRef.current) return;
    
    // Handle moving platforms
    if (moving) {
      time.current += delta;
      
      // Calculate movement offset using sine wave
      const movementOffset = Math.sin(time.current * movementSpeed) * movementRange;
      
      // Apply movement based on specified axis
      if (movementAxis === 'x') {
        platformRef.current.position.x = initialPosition.current.x + movementOffset;
      } else {
        platformRef.current.position.y = initialPosition.current.y + movementOffset;
      }
    }
    
    // Collision detection with player
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    const platformPos = platformRef.current.position.clone();
    const platformSize = new THREE.Vector3(size[0], size[1], size[2]);
    
    // Check if player is above the platform and falling down
    const isAbovePlatform = 
      playerPos.y > platformPos.y + platformSize.y / 2 &&
      playerPos.x >= platformPos.x - platformSize.x / 2 &&
      playerPos.x <= platformPos.x + platformSize.x / 2 &&
      velocity[1] <= 0;
    
    // Check if player is colliding with the top of the platform
    const isCollidingTop = 
      isAbovePlatform &&
      playerPos.y - 0.7 <= platformPos.y + platformSize.y / 2 && // 0.7 is about half the player height
      playerPos.y > platformPos.y;
    
    // If player is colliding with the top, set them on top of the platform
    if (isCollidingTop) {
      // Update player position to be on top of platform
      const newY = platformPos.y + platformSize.y / 2 + 0.7;
      
      // Mark player as grounded
      if (!isGrounded) {
        setGrounded(true);
      }
    }
  });
  
  return (
    <mesh
      ref={platformRef}
      position={position}
      receiveShadow
      castShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        map={texture}
        roughness={0.7}
      />
    </mesh>
  );
}

// Parent component for all platforms
export default function Platforms({ platforms }: PlatformsProps) {
  return (
    <group>
      {platforms.map((platform, index) => (
        <Platform
          key={`platform-${index}`}
          position={platform.position}
          size={platform.size}
          color={platform.color}
          moving={platform.moving}
          movementAxis={platform.movementAxis}
          movementRange={platform.movementRange}
          movementSpeed={platform.movementSpeed}
        />
      ))}
    </group>
  );
}
