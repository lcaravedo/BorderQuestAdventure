import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useAudio } from "@/lib/stores/useAudio";
import { usePlayer } from "@/lib/stores/usePlayer";
import { Controls } from "@/lib/consts";

export default function Character({ position = [0, 1, 0] }) {
  // Set up refs
  const characterRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const velocity = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();

  // Animation states
  const [facingRight, setFacingRight] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [isDashing, setIsDashing] = useState(false);
  const [isDigging, setIsDigging] = useState(false);
  const [isBarking, setIsBarking] = useState(false);
  const [canJump, setCanJump] = useState(true);
  const [frameCount, setFrameCount] = useState(0);

  // Audio hooks
  const { playHit } = useAudio();

  // Player state from store
  const { 
    position: playerPosition, 
    health, 
    updatePosition, 
    updateVelocity, 
    takeDamage,
    isGrounded,
    setGrounded
  } = usePlayer();

  // Get keyboard inputs
  const [subscribeKeys, getKeys] = useKeyboardControls();

  // Load character textures
  const chihuahuaTexture = new THREE.TextureLoader().load('/textures/chihuahua.svg');
  const pearHeadTexture = new THREE.TextureLoader().load('/textures/pear_head.svg');
  chihuahuaTexture.anisotropy = 16;
  pearHeadTexture.anisotropy = 16;
  
  // Get powered-up state from player store
  const { isPoweredUp } = usePlayer();

  // Create sprite material based on current form
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: isPoweredUp ? chihuahuaTexture : pearHeadTexture, 
    color: 0xffffff,
  });

  // Movement parameters
  const MOVE_SPEED = 5;
  const JUMP_FORCE = 8;
  const DASH_MULTIPLIER = 2;
  const GRAVITY = 20;

  // Keyboard control subscription
  useEffect(() => {
    const unsubscribeJump = subscribeKeys(
      (state) => state[Controls.JUMP],
      (pressed) => {
        if (pressed && canJump && isGrounded) {
          velocity.current.y = JUMP_FORCE;
          setIsJumping(true);
          setCanJump(false);
          setGrounded(false);
          // Play jump sound (placeholder - using hit sound)
          playHit();
        }
      }
    );

    const unsubscribeBark = subscribeKeys(
      (state) => state[Controls.BARK],
      (pressed) => {
        if (pressed && !isBarking) {
          setIsBarking(true);
          playHit(); // Bark sound
          setTimeout(() => setIsBarking(false), 500);
        }
      }
    );

    const unsubscribeDig = subscribeKeys(
      (state) => state[Controls.DIG],
      (pressed) => {
        if (pressed && isGrounded && !isDigging) {
          setIsDigging(true);
          setTimeout(() => setIsDigging(false), 800);
        }
      }
    );

    const unsubscribeDash = subscribeKeys(
      (state) => state[Controls.DASH],
      (pressed) => {
        if (pressed && !isDashing) {
          setIsDashing(true);
          setTimeout(() => setIsDashing(false), 300);
        }
      }
    );

    // Reset jump ability when landing
    if (isGrounded && !canJump) {
      setCanJump(true);
      setIsJumping(false);
    }

    return () => {
      unsubscribeJump();
      unsubscribeBark();
      unsubscribeDig();
      unsubscribeDash();
    };
  }, [subscribeKeys, canJump, isGrounded, setGrounded, playHit]);

  // Game update loop
  useFrame((state, delta) => {
    // Skip if ref is not ready
    if (!characterRef.current) return;

    // Increment frame counter for animations
    setFrameCount((prev) => (prev + 1) % 60);
    
    // Get current keyboard state
    const { [Controls.LEFT]: leftPressed, [Controls.RIGHT]: rightPressed } = getKeys();

    // Handle horizontal movement
    let moveSpeed = MOVE_SPEED;
    if (isDashing) moveSpeed *= DASH_MULTIPLIER;
    
    if (!isDigging) { // Cannot move while digging
      if (leftPressed) {
        velocity.current.x = -moveSpeed;
        setFacingRight(false);
      } else if (rightPressed) {
        velocity.current.x = moveSpeed;
        setFacingRight(true);
      } else {
        // Apply friction
        velocity.current.x *= 0.8;
      }
    } else {
      // Slow down movement while digging
      velocity.current.x *= 0.5;
    }

    // Apply gravity
    if (!isGrounded) {
      velocity.current.y -= GRAVITY * delta;
    }

    // Update position
    const newPos = new THREE.Vector3(
      characterRef.current.position.x + velocity.current.x * delta,
      characterRef.current.position.y + velocity.current.y * delta,
      characterRef.current.position.z
    );

    // Update character position
    characterRef.current.position.copy(newPos);
    
    // Update global player position in store
    updatePosition([newPos.x, newPos.y, newPos.z]);
    updateVelocity([velocity.current.x, velocity.current.y, velocity.current.z]);

    // Camera follow
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, newPos.x, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, newPos.y + 3, 0.1);
    camera.lookAt(newPos);

    // Handle sprite flipping based on direction
    if (spriteRef.current) {
      spriteRef.current.scale.x = facingRight ? 1.5 : -1.5;
      spriteRef.current.scale.y = 1.5;
      
      // Simple animation effect
      if ((leftPressed || rightPressed) && !isJumping && !isDigging) {
        spriteRef.current.position.y = Math.sin(frameCount * 0.2) * 0.05;
      } else {
        spriteRef.current.position.y = 0;
      }
      
      // Squash and stretch for jumping
      if (isJumping) {
        spriteRef.current.scale.y = 1.6;
        spriteRef.current.scale.x = facingRight ? 1.4 : -1.4;
      }
      
      // Digging animation
      if (isDigging) {
        spriteRef.current.position.y = -0.3;
      }
      
      // Barking animation
      if (isBarking) {
        spriteRef.current.scale.x = facingRight ? 1.7 : -1.7;
      }
    }

    // Ground check (simplified - assume bottom of screen is ground)
    if (newPos.y <= 0.5) {
      characterRef.current.position.y = 0.5;
      velocity.current.y = 0;
      if (!isGrounded) setGrounded(true);
    }
  });

  return (
    <group 
      ref={characterRef} 
      position={[position[0], position[1], position[2]]}
    >
      <sprite 
        ref={spriteRef}
        material={spriteMaterial}
        scale={[1.5, 1.5, 1]}
      />
      
      {/* Invisible collision box */}
      <mesh visible={false}>
        <boxGeometry args={[0.8, 1.4, 0.8]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      
      {/* Simple shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
      
      {/* Bark attack visual effect */}
      {isBarking && (
        <sprite
          position={[facingRight ? 1 : -1, 0, 0]}
          scale={[1, 0.5, 1]}
        >
          <spriteMaterial
            transparent
            opacity={0.7}
            color="white"
          />
        </sprite>
      )}
      
      {/* Digging visual effect */}
      {isDigging && (
        <mesh
          position={[0, -0.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.8, 16]} />
          <meshBasicMaterial color="brown" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
