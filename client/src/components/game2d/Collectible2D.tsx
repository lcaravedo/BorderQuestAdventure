import React, { useRef, useState, useEffect } from 'react';
import { Container, Sprite, useTick } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { usePlayer } from '@/lib/stores/usePlayer';
import { useCollectibles } from '@/lib/stores/useCollectibles';
import { useAudio } from '@/lib/stores/useAudio';

interface Collectible2DProps {
  id: string;
  x: number;
  y: number;
  type: 'bone' | 'visa' | 'snack';
}

export default function Collectible2D({ id, x, y, type }: Collectible2DProps) {
  const containerRef = useRef<PIXI.Container>(null);
  const spriteRef = useRef<PIXI.Sprite>(null);
  const [collected, setCollected] = useState(false);
  const [hoverOffset, setHoverOffset] = useState(0);
  
  // Get necessary hooks
  const { position: playerPosition } = usePlayer();
  const { collectItem, isCollected } = useCollectibles();
  const { playSuccess } = useAudio();
  
  // Check if this collectible is already collected
  useEffect(() => {
    const wasCollected = isCollected(id);
    if (wasCollected) {
      setCollected(true);
    }
  }, [id, isCollected]);
  
  // Get texture based on type
  const getCollectibleTexture = () => {
    switch (type) {
      case 'bone': return PIXI.Texture.from('/textures/bone.svg');
      case 'visa': return PIXI.Texture.from('/textures/visa.svg');
      case 'snack': return PIXI.Texture.from('/textures/snack.svg');
      default: return PIXI.Texture.from('/textures/bone.svg');
    }
  };
  
  const texture = getCollectibleTexture();
  
  // Animation and collection detection
  useTick((delta) => {
    if (!containerRef.current || collected) return;
    
    // Hover animation
    const newHoverOffset = (hoverOffset + delta * 0.05) % (Math.PI * 2);
    setHoverOffset(newHoverOffset);
    
    // Apply hover animation
    containerRef.current.y = y + Math.sin(newHoverOffset) * 5;
    
    // Get player position
    const playerPos = {
      x: playerPosition[0],
      y: playerPosition[1]
    };
    
    // Check for collection (simple collision detection)
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerPos.x - containerRef.current.x, 2) +
      Math.pow(playerPos.y - containerRef.current.y, 2)
    );
    
    if (distanceToPlayer < 30 && !collected) { // Collection radius
      // Mark as collected
      setCollected(true);
      
      // Add to collected items in store
      collectItem(id, type);
      
      // Play success sound
      playSuccess();
      
      // Visual collection effect
      if (containerRef.current) {
        const scaleTween = () => {
          if (!containerRef.current) return;
          
          containerRef.current.scale.x *= 1.1;
          containerRef.current.scale.y *= 1.1;
          containerRef.current.alpha *= 0.9;
          
          if (containerRef.current.alpha > 0.1) {
            requestAnimationFrame(scaleTween);
          } else {
            containerRef.current.visible = false;
          }
        };
        
        scaleTween();
      }
    }
  });
  
  // Don't render if already collected
  if (collected) return null;
  
  // Get collectible size based on type
  const getCollectibleSize = () => {
    switch (type) {
      case 'bone': return { width: 30, height: 30 };
      case 'visa': return { width: 30, height: 30 };
      case 'snack': return { width: 25, height: 25 };
      default: return { width: 30, height: 30 };
    }
  };
  
  const size = getCollectibleSize();
  
  // Get glow color based on collectible type
  const getGlowColor = () => {
    switch (type) {
      case 'bone': return 0xFFFFFF;
      case 'visa': return 0x66EE66;
      case 'snack': return 0xFFDD44;
      default: return 0xFFFFFF;
    }
  };
  
  return (
    <Container ref={containerRef} position={[x, y]}>
      <Sprite
        ref={spriteRef}
        texture={texture}
        width={size.width}
        height={size.height}
        anchor={0.5}
      />
      
      {/* Glow effect - will be replaced with a proper filter */}
      <Sprite
        texture={PIXI.Texture.WHITE}
        width={size.width * 1.5}
        height={size.height * 1.5}
        tint={getGlowColor()}
        alpha={0.2}
        anchor={0.5}
        blendMode={PIXI.BLEND_MODES.ADD}
      />
    </Container>
  );
}