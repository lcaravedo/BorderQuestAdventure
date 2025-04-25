import React, { useRef, useEffect } from 'react';
import { Container, Sprite, useTick } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { usePlayer } from '@/lib/stores/usePlayer';
import { GRAVITY, JUMP_FORCE, MOVE_SPEED, DASH_MULTIPLIER } from '@/lib/consts';

interface Character2DProps {
  x: number;
  y: number;
}

export default function Character2D({ x, y }: Character2DProps) {
  const containerRef = useRef<PIXI.Container>(null);
  const spriteRef = useRef<PIXI.Sprite>(null);
  const velocityRef = useRef({ x: 0, y: 0 });
  const isGroundedRef = useRef(false);
  const facingDirectionRef = useRef(1); // 1 for right, -1 for left
  const animationFrameRef = useRef(0);
  const animationTickRef = useRef(0);
  
  // Player state from the store
  const { 
    position, 
    setPosition, 
    health, 
    isDashing, 
    setIsDashing,
    isBarking,
    setIsBarking,
    isDigging,
    setIsDigging,
    jump,
    dash
  } = usePlayer();
  
  // Load character sprite
  const texture = PIXI.Texture.from('/textures/chihuahua.svg');
  
  // Initial setup
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.x = x;
      containerRef.current.y = y;
    }
  }, [x, y]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          facingDirectionRef.current = -1;
          if (spriteRef.current) {
            spriteRef.current.scale.x = -1; // Flip sprite
          }
          break;
        case 'ArrowRight':
        case 'KeyD':
          facingDirectionRef.current = 1;
          if (spriteRef.current) {
            spriteRef.current.scale.x = 1; // Normal orientation
          }
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          if (isGroundedRef.current) {
            velocityRef.current.y = -JUMP_FORCE;
            jump();
          }
          break;
        case 'KeyJ':
          setIsBarking(true);
          setTimeout(() => setIsBarking(false), 400); // Duration of bark
          break;
        case 'KeyK':
          if (isGroundedRef.current) {
            setIsDigging(true);
            setTimeout(() => setIsDigging(false), 1000); // Duration of dig
          }
          break;
        case 'KeyL':
        case 'ShiftLeft':
        case 'ShiftRight':
          if (!isDashing) {
            dash();
            setIsDashing(true);
            setTimeout(() => setIsDashing(false), 300); // Duration of dash
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [jump, setIsBarking, setIsDigging, setIsDashing, dash, isDashing]);
  
  // Game tick - update character position and animation
  useTick((delta) => {
    if (!containerRef.current) return;
    
    // Get keyboard state
    const leftPressed = 
      keyboard.isPressed('ArrowLeft') || 
      keyboard.isPressed('KeyA');
    
    const rightPressed = 
      keyboard.isPressed('ArrowRight') || 
      keyboard.isPressed('KeyD');
    
    // Movement and physics
    if (leftPressed) {
      velocityRef.current.x = isDashing 
        ? -MOVE_SPEED * DASH_MULTIPLIER 
        : -MOVE_SPEED;
    } else if (rightPressed) {
      velocityRef.current.x = isDashing 
        ? MOVE_SPEED * DASH_MULTIPLIER 
        : MOVE_SPEED;
    } else {
      // Apply friction
      velocityRef.current.x *= 0.8;
      if (Math.abs(velocityRef.current.x) < 0.1) {
        velocityRef.current.x = 0;
      }
    }
    
    // Apply gravity
    velocityRef.current.y += GRAVITY * delta;
    
    // Move character
    containerRef.current.x += velocityRef.current.x * delta;
    containerRef.current.y += velocityRef.current.y * delta;
    
    // Super simple ground collision detection (this will be improved)
    if (containerRef.current.y > 400) { // Temporary ground level
      containerRef.current.y = 400;
      velocityRef.current.y = 0;
      isGroundedRef.current = true;
    } else {
      isGroundedRef.current = false;
    }
    
    // Update character animation
    animationTickRef.current += delta;
    if (animationTickRef.current > 0.1) { // Frame rate control
      animationTickRef.current = 0;
      
      // Cycle through animation frames
      if (Math.abs(velocityRef.current.x) > 0.5) {
        // Walking animation
        animationFrameRef.current = (animationFrameRef.current + 1) % 4;
      } else {
        // Idle animation
        animationFrameRef.current = 0;
      }
    }
    
    // Update the player position in the store
    setPosition([
      containerRef.current.x,
      containerRef.current.y,
      0 // Z-axis not used in 2D
    ]);
  });
  
  // Visual states based on player actions
  const getCharacterState = () => {
    if (isDigging) return 'digging';
    if (isBarking) return 'barking';
    if (isDashing) return 'dashing';
    if (!isGroundedRef.current) return 'jumping';
    if (Math.abs(velocityRef.current.x) > 0.5) return 'walking';
    return 'idle';
  };
  
  // Temporarily using a simple sprite until we implement sprite sheets
  const characterState = getCharacterState();
  
  return (
    <Container ref={containerRef} position={[x, y]}>
      <Sprite
        ref={spriteRef}
        texture={texture}
        width={40}
        height={40}
        anchor={0.5}
        scale={[facingDirectionRef.current, 1]}
      />
    </Container>
  );
}

// Simple keyboard helper
const keyboard = {
  keysPressed: new Set<string>(),
  
  isPressed(key: string): boolean {
    return this.keysPressed.has(key);
  },
  
  init() {
    window.addEventListener('keydown', (e) => {
      this.keysPressed.add(e.code);
    });
    
    window.addEventListener('keyup', (e) => {
      this.keysPressed.delete(e.code);
    });
  }
};

// Initialize keyboard
keyboard.init();