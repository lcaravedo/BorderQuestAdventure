import * as THREE from "three";
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { usePlayer } from "@/lib/stores/usePlayer";

interface EnvironmentalHazardProps {
  position: [number, number, number];
  type: 'sandstorm' | 'jungle_trap' | 'drone' | 'spotlight';
  size?: [number, number, number];
  rotation?: [number, number, number];
  triggerRadius?: number;
  damage?: number;
  patrolArea?: [number, number]; // For moving hazards like drones
  patrolSpeed?: number;
}

export default function EnvironmentalHazard({
  position,
  type,
  size = [3, 3, 3],
  rotation = [0, 0, 0],
  triggerRadius = 1.5,
  damage = 1,
  patrolArea = [position[0] - 5, position[0] + 5],
  patrolSpeed = 2
}: EnvironmentalHazardProps) {
  const hazardRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const { takeDamage } = usePlayer();
  
  const [frameCount, setFrameCount] = useState(0);
  const [direction, setDirection] = useState(1);
  const [playerTouched, setPlayerTouched] = useState(false);
  const [playerPosition, setPlayerPosition] = useState([0, 0, 0]);
  const [particles, setParticles] = useState<THREE.BufferGeometry | null>(null);
  
  // Texture based on hazard type - using SVG instead of PNG
  const textureMap = {
    sandstorm: "/textures/sandstorm.svg",
    jungle_trap: "/textures/jungle_trap.svg",
    drone: "/textures/drone.svg",
    spotlight: "/textures/spotlight.svg"
  };
  
  const texture = useTexture(textureMap[type]);
  
  // Load player position from player store
  useEffect(() => {
    const unsubscribe = usePlayer.subscribe(
      (state) => state.position,
      (position) => {
        setPlayerPosition(position);
      }
    );
    
    return () => unsubscribe();
  }, []);
  
  // Initialize particles for sandstorm and spotlight effects
  useEffect(() => {
    if (type === 'sandstorm' || type === 'spotlight') {
      const particleCount = type === 'sandstorm' ? 500 : 50;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        const radius = type === 'sandstorm' ? size[0] * 0.5 : size[0] * 0.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + (type === 'sandstorm' ? 0 : 1);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }
      
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      setParticles(particleGeometry);
    }
  }, [type, size]);
  
  // Update the hazard on each frame
  useFrame((state, delta) => {
    if (!hazardRef.current) return;
    
    // Increment frame counter for animations
    setFrameCount((prev) => (prev + 1) % 120);
    
    // Get current position of hazard
    const hazardPos = hazardRef.current.position.clone();
    
    // Calculate distance to player
    const playerPos = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    const distanceToPlayer = hazardPos.distanceTo(playerPos);
    
    // Check if player is in contact with hazard
    if (distanceToPlayer < triggerRadius && !playerTouched) {
      // Apply damage if player touches hazard
      takeDamage(damage);
      setPlayerTouched(true);
      
      // Reset touched state after cooldown
      setTimeout(() => {
        setPlayerTouched(false);
      }, 1000); // 1 second cooldown
    }
    
    // Update hazard based on type
    switch (type) {
      case 'sandstorm':
        // Rotate particles for sandstorm effect
        if (particlesRef.current) {
          particlesRef.current.rotation.y += delta * 0.5;
          
          // Pulsate the size
          const scale = 1 + Math.sin(frameCount * 0.05) * 0.2;
          particlesRef.current.scale.set(scale, scale, scale);
        }
        break;
        
      case 'jungle_trap':
        // Animate trap - snap shut when player is nearby
        if (distanceToPlayer < triggerRadius * 1.5) {
          // Spring animation for trap closing
          const closingSpeed = 0.1;
          hazardRef.current.rotation.x = Math.min(
            hazardRef.current.rotation.x + closingSpeed,
            Math.PI / 2
          );
        } else {
          // Slowly reset trap when player is away
          const openingSpeed = 0.02;
          hazardRef.current.rotation.x = Math.max(
            hazardRef.current.rotation.x - openingSpeed,
            0
          );
        }
        break;
        
      case 'drone':
        // Patrol movement pattern
        hazardRef.current.position.x += direction * patrolSpeed * delta;
        
        // Simple bobbing animation
        hazardRef.current.position.y = position[1] + Math.sin(frameCount * 0.05) * 0.3;
        
        // Change direction at bounds
        if (
          hazardRef.current.position.x <= patrolArea[0] ||
          hazardRef.current.position.x >= patrolArea[1]
        ) {
          setDirection(direction * -1);
          
          // Flip the drone sprite
          hazardRef.current.scale.x = -hazardRef.current.scale.x;
        }
        
        break;
        
      case 'spotlight':
        // Spotlight sweep animation
        if (spotlightRef.current) {
          const sweepAngle = Math.sin(frameCount * 0.02) * Math.PI * 0.25;
          spotlightRef.current.position.x = position[0] + Math.sin(sweepAngle) * 2;
          spotlightRef.current.position.z = position[2] + Math.cos(sweepAngle) * 2;
          
          // Make spotlight always point toward ground
          spotlightRef.current.lookAt(
            position[0] + Math.sin(sweepAngle) * 10,
            0,
            position[2] + Math.cos(sweepAngle) * 10
          );
          
          // Check if player is in spotlight beam
          const angleToPlayer = Math.atan2(
            playerPos.x - hazardRef.current.position.x,
            playerPos.z - hazardRef.current.position.z
          );
          
          const angleDiff = Math.abs(angleToPlayer - sweepAngle);
          if (
            distanceToPlayer < triggerRadius * 3 &&
            angleDiff < 0.3 &&
            playerPos.y < 2 &&
            !playerTouched
          ) {
            takeDamage(damage);
            setPlayerTouched(true);
            
            setTimeout(() => {
              setPlayerTouched(false);
            }, 1000);
          }
        }
        break;
    }
  });
  
  return (
    <group 
      ref={hazardRef} 
      position={[position[0], position[1], position[2]]} 
      rotation={[rotation[0], rotation[1], rotation[2]]}
    >
      {type === 'sandstorm' && (
        <>
          {/* Sandstorm particles */}
          {particles && (
            <points ref={particlesRef}>
              <primitive object={particles} />
              <pointsMaterial
                size={0.2}
                color="#d2b48c"
                opacity={0.6}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </points>
          )}
          
          {/* Sandstorm base */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[size[0] * 0.5, size[0] * 0.3, 1, 16]} />
            <meshStandardMaterial 
              color="#d2b48c" 
              opacity={0.4} 
              transparent
            />
          </mesh>
        </>
      )}
      
      {type === 'jungle_trap' && (
        <>
          {/* Trap base */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[size[0], 0.2, size[2]]} />
            <meshStandardMaterial color="#553311" />
          </mesh>
          
          {/* Trap jaws */}
          <group position={[0, 0.2, -size[2] * 0.25]}>
            <mesh rotation={[0, 0, 0]}>
              <boxGeometry args={[size[0], 0.1, size[2] * 0.5]} />
              <meshStandardMaterial color="#331100" />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.2, 0.4, 4]} />
              <meshStandardMaterial color="#330000" />
            </mesh>
          </group>
          
          <group position={[0, 0.2, size[2] * 0.25]}>
            <mesh rotation={[0, Math.PI, 0]}>
              <boxGeometry args={[size[0], 0.1, size[2] * 0.5]} />
              <meshStandardMaterial color="#331100" />
            </mesh>
            <mesh position={[0, 0.1, 0]}>
              <coneGeometry args={[0.2, 0.4, 4]} />
              <meshStandardMaterial color="#330000" />
            </mesh>
          </group>
        </>
      )}
      
      {type === 'drone' && (
        <>
          {/* Drone body */}
          <sprite scale={[1.5, 1.5, 1]}>
            <spriteMaterial map={texture} />
          </sprite>
          
          {/* Shadow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
            <circleGeometry args={[0.5, 16]} />
            <meshBasicMaterial color="black" transparent opacity={0.3} />
          </mesh>
        </>
      )}
      
      {type === 'spotlight' && (
        <>
          {/* Spotlight source */}
          <mesh position={[0, size[1] * 0.5, 0]}>
            <boxGeometry args={[1, 0.5, 1]} />
            <meshStandardMaterial color="#111111" />
          </mesh>
          
          {/* Light source */}
          <spotLight
            ref={spotlightRef}
            position={[0, size[1] * 0.5, 0]}
            angle={Math.PI / 12}
            penumbra={0.5}
            intensity={5}
            color="#ffffff"
            distance={20}
            castShadow
          />
          
          {/* Light beam particles */}
          {particles && (
            <points position={[0, size[1] * 0.5, 0]}>
              <primitive object={particles} />
              <pointsMaterial
                size={0.1}
                color="#ffffff"
                opacity={0.2}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </points>
          )}
          
          {/* Support pole */}
          <mesh position={[0, size[1] * 0.25, 0]}>
            <cylinderGeometry args={[0.1, 0.1, size[1], 8]} />
            <meshStandardMaterial color="#333333" />
          </mesh>
        </>
      )}
      
      {/* Collision indicator (for debugging) */}
      {/* <mesh visible={false}>
        <sphereGeometry args={[triggerRadius, 16, 16]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh> */}
    </group>
  );
}