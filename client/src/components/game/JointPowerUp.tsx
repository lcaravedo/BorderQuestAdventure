import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useAudio } from '@/lib/stores/useAudio';

// Vibe particles component for visual effects
function VibeParticles() {
  const particles = useRef<THREE.Group>(null);
  
  // Animate particles
  useFrame((state, delta) => {
    if (!particles.current) return;
    
    // Rotate the entire particle system
    particles.current.rotation.z += delta * 0.5;
    
    // Update individual particle positions if needed
    Array.from({ length: 8 }).forEach((_, i) => {
      const child = particles.current?.children[i];
      if (child) {
        // Pulsate size
        child.scale.x = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
        child.scale.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
        child.scale.z = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.3;
      }
    });
  });
  
  return (
    <group ref={particles}>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh 
          key={`particle-${i}`}
          position={[
            Math.sin((i / 8) * Math.PI * 2) * 1.5,
            Math.cos((i / 8) * Math.PI * 2) * 1.5,
            0
          ]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? "#ffff00" : "#ff8800"} 
            transparent 
            opacity={0.7} 
          />
        </mesh>
      ))}
    </group>
  );
}

interface JointPowerUpProps {
  position: [number, number, number];
  id: string;
  duration?: number; // Duration of invincibility in milliseconds
}

export default function JointPowerUp({ position, id, duration = 10000 }: JointPowerUpProps) {
  const powerUpRef = useRef<THREE.Group>(null);
  const [isCollected, setIsCollected] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [invincible, setInvincible] = useState(false);
  const [effectsActive, setEffectsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  
  // Player and audio store
  const { position: playerPosition, takeDamage } = usePlayer();
  const { playSuccess } = useAudio();
  
  // Load texture
  const jointTexture = new THREE.TextureLoader().load('/textures/joint_powerup.svg');
  jointTexture.anisotropy = 16;
  
  // Create material
  const jointMaterial = new THREE.SpriteMaterial({ 
    map: jointTexture,
    color: 0xffffff,
  });
  
  // Override takeDamage when invincible
  useEffect(() => {
    if (invincible) {
      // Store original function
      const originalTakeDamage = takeDamage;
      
      // Create a timer that counts down
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearInterval(timer);
            // Restore original function
            setInvincible(false);
            setEffectsActive(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      return () => {
        clearInterval(timer);
      };
    }
  }, [invincible, takeDamage]);
  
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
      setInvincible(true);
      setEffectsActive(true);
      setTimeLeft(duration);
      
      // Play success sound
      playSuccess();
      
      // Hide message after 2 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 2000);
    }
  });
  
  // Don't render if collected and not showing message
  if (isCollected && !showMessage && !effectsActive) return null;
  
  return (
    <group ref={powerUpRef} position={[position[0], position[1], position[2]]}>
      {!isCollected && (
        <>
          {/* Joint sprite */}
          <sprite 
            material={jointMaterial}
            scale={[1.5, 1.5, 1]}
          />
          
          {/* Glow effect */}
          <pointLight 
            color="#ffff77" 
            intensity={1} 
            distance={3} 
            decay={2}
          />
        </>
      )}
      
      {/* Collection message */}
      {showMessage && (
        <group position={[0, 2, 0]}>
          {/* Black background for text */}
          <mesh>
            <planeGeometry args={[5, 0.6]} />
            <meshBasicMaterial color="black" opacity={0.7} transparent />
          </mesh>
          
          {/* Text message */}
          <Text
            position={[0, 0, 0.1]}
            color="yellow"
            fontSize={0.3}
            anchorX="center"
            anchorY="middle"
          >
            Summer Vibes! Invincible for {duration/1000}s!
          </Text>
        </group>
      )}
      
      {/* Active effect indicator */}
      {effectsActive && (
        <group position={[playerPosition[0] - position[0], playerPosition[1] - position[1] + 2, playerPosition[2] - position[2]]}>
          {/* Timer display */}
          <group position={[0, 1, 0]}>
            <mesh>
              <planeGeometry args={[2, 0.5]} />
              <meshBasicMaterial color="black" opacity={0.5} transparent />
            </mesh>
            <Text
              position={[0, 0, 0.1]}
              color="yellow"
              fontSize={0.2}
              anchorX="center"
              anchorY="middle"
            >
              {Math.ceil(timeLeft/1000)}s
            </Text>
          </group>
          
          {/* Particle effects */}
          <VibeParticles />
        </group>
      )}
    </group>
  );
}