import React, { useRef } from 'react';
import { Container, Sprite, useTick } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';

interface Platform2DProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  moving?: boolean;
  movementAxis?: 'x' | 'y';
  movementRange?: number;
  movementSpeed?: number;
}

export default function Platform2D({
  x,
  y,
  width,
  height,
  color = '#8B4513',
  moving = false,
  movementAxis = 'x',
  movementRange = 100,
  movementSpeed = 1
}: Platform2DProps) {
  const containerRef = useRef<PIXI.Container>(null);
  const initialPosRef = useRef({ x, y });
  const movementDirectionRef = useRef(1); // 1 for positive, -1 for negative
  const movementProgressRef = useRef(0); // 0 to 1 for movement cycle
  
  // Convert color string to PIXI tint (hex number)
  const tint = parseInt(color.replace('#', '0x'), 16);
  
  // Create platform texture
  // For now using white texture with tint, later we can use actual textures
  const texture = PIXI.Texture.WHITE;
  
  // Platform movement animation
  useTick((delta) => {
    if (!containerRef.current || !moving) return;
    
    // Update movement progress
    movementProgressRef.current += (movementSpeed * 0.01 * movementDirectionRef.current * delta);
    
    // Reverse direction at ends
    if (movementProgressRef.current > 1) {
      movementProgressRef.current = 1;
      movementDirectionRef.current = -1;
    } else if (movementProgressRef.current < 0) {
      movementProgressRef.current = 0;
      movementDirectionRef.current = 1;
    }
    
    // Apply movement to platform
    if (movementAxis === 'x') {
      containerRef.current.x = initialPosRef.current.x + 
        (movementProgressRef.current * movementRange);
    } else { // y-axis
      containerRef.current.y = initialPosRef.current.y + 
        (movementProgressRef.current * movementRange);
    }
  });
  
  return (
    <Container ref={containerRef} position={[x, y]}>
      <Sprite
        texture={texture}
        width={width}
        height={height}
        tint={tint}
        anchor={0}
      />
    </Container>
  );
}