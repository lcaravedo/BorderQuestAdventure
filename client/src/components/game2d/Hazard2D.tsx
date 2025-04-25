import React, { useRef, useEffect } from 'react';
import { Container, Sprite, Graphics, useTick } from 'react-pixi-fiber';
import * as PIXI from 'pixi.js';
import { usePlayer } from '@/lib/stores/usePlayer';

interface Hazard2DProps {
  x: number;
  y: number;
  type: 'sandstorm' | 'jungle_trap' | 'drone' | 'spotlight';
  width?: number;
  height?: number;
  triggerRadius?: number;
  damage?: number;
  patrolMinX?: number;
  patrolMaxX?: number;
  patrolSpeed?: number;
}

export default function Hazard2D({
  x,
  y,
  type,
  width = 50,
  height = 50,
  triggerRadius = 40,
  damage = 1,
  patrolMinX,
  patrolMaxX,
  patrolSpeed = 1
}: Hazard2DProps) {
  const containerRef = useRef<PIXI.Container>(null);
  const spriteRef = useRef<PIXI.Sprite>(null);
  const particlesRef = useRef<PIXI.ParticleContainer | null>(null);
  const lastDamageTimeRef = useRef(0);
  const directionRef = useRef(1); // 1 for right, -1 for left
  const animationTickRef = useRef(0);
  const particlesArray = useRef<PIXI.Sprite[]>([]);
  
  // Get player position and damage function
  const { position: playerPosition, takeDamage } = usePlayer();
  
  // Get texture based on hazard type
  const getHazardTexture = () => {
    switch (type) {
      case 'sandstorm': return PIXI.Texture.from('/textures/sandstorm.svg');
      case 'jungle_trap': return PIXI.Texture.from('/textures/jungle_trap.svg');
      case 'drone': return PIXI.Texture.from('/textures/drone.svg');
      case 'spotlight': return PIXI.Texture.from('/textures/spotlight.svg');
      default: return PIXI.Texture.from('/textures/sandstorm.svg');
    }
  };
  
  const texture = getHazardTexture();
  
  // Initialize particles for effects
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (type === 'sandstorm' || type === 'spotlight') {
      // Create particle container
      const particleContainer = new PIXI.ParticleContainer(100, {
        position: true,
        rotation: true,
        alpha: true,
        scale: true
      });
      
      containerRef.current.addChild(particleContainer);
      particlesRef.current = particleContainer;
      
      // Create particles
      const particleCount = type === 'sandstorm' ? 50 : 20;
      const particleColor = type === 'sandstorm' ? 0xd2b48c : 0xffffff;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = new PIXI.Sprite(PIXI.Texture.WHITE);
        
        // Random size and position within the hazard area
        particle.width = particle.height = Math.random() * 4 + 1;
        particle.position.x = (Math.random() - 0.5) * width;
        particle.position.y = (Math.random() - 0.5) * height;
        
        // Appearance
        particle.tint = particleColor;
        particle.alpha = 0.6;
        
        // Add to container
        particleContainer.addChild(particle);
        particlesArray.current.push(particle);
      }
    }
    
    return () => {
      // Clean up
      if (particlesRef.current) {
        particlesRef.current.removeChildren();
      }
      particlesArray.current = [];
    };
  }, [type, width, height]);
  
  // Animation and hazard behavior
  useTick((delta) => {
    if (!containerRef.current) return;
    
    const hazardPos = {
      x: containerRef.current.x,
      y: containerRef.current.y
    };
    
    const playerPos = {
      x: playerPosition[0],
      y: playerPosition[1]
    };
    
    // Calculate distance to player
    const distanceToPlayer = Math.sqrt(
      Math.pow(playerPos.x - hazardPos.x, 2) +
      Math.pow(playerPos.y - hazardPos.y, 2)
    );
    
    // Check for collision with player
    const currentTime = Date.now();
    if (
      distanceToPlayer < triggerRadius && 
      currentTime - lastDamageTimeRef.current > 1000 // Damage cooldown: 1 second
    ) {
      takeDamage(damage);
      lastDamageTimeRef.current = currentTime;
    }
    
    // Animation tick
    animationTickRef.current += delta;
    
    // Hazard-specific behavior
    switch (type) {
      case 'sandstorm':
        // Animate particles
        if (particlesArray.current.length > 0) {
          particlesArray.current.forEach(particle => {
            // Swirl particle motion
            particle.position.x += (Math.sin(animationTickRef.current * 0.1) * 2 + 1) * delta;
            particle.position.y += (Math.cos(animationTickRef.current * 0.1) * 2) * delta;
            
            // Loop particles when they leave the area
            if (particle.position.x > width/2) particle.position.x = -width/2;
            if (particle.position.y > height/2) particle.position.y = -height/2;
            if (particle.position.y < -height/2) particle.position.y = height/2;
            
            // Pulse opacity
            particle.alpha = 0.3 + 0.3 * Math.sin(animationTickRef.current * 0.1 + particle.position.x);
          });
        }
        
        // Rotate the whole container slightly
        containerRef.current.rotation += 0.01 * delta;
        break;
        
      case 'jungle_trap':
        // Animate trap closing when player is nearby
        if (distanceToPlayer < triggerRadius * 1.5) {
          // Trap closing animation
          if (spriteRef.current) {
            spriteRef.current.rotation = Math.min(
              spriteRef.current.rotation + 0.1 * delta,
              Math.PI / 2
            );
          }
        } else {
          // Slowly reset trap
          if (spriteRef.current) {
            spriteRef.current.rotation = Math.max(
              spriteRef.current.rotation - 0.02 * delta,
              0
            );
          }
        }
        break;
        
      case 'drone':
        // Patrol movement
        if (patrolMinX !== undefined && patrolMaxX !== undefined) {
          containerRef.current.x += directionRef.current * patrolSpeed * delta;
          
          // Change direction at bounds
          if (
            (containerRef.current.x >= patrolMaxX && directionRef.current > 0) ||
            (containerRef.current.x <= patrolMinX && directionRef.current < 0)
          ) {
            directionRef.current *= -1;
            
            // Flip sprite horizontally
            if (spriteRef.current) {
              spriteRef.current.scale.x *= -1;
            }
          }
          
          // Add bobbing motion
          containerRef.current.y = y + Math.sin(animationTickRef.current * 0.1) * 10;
        }
        break;
        
      case 'spotlight':
        // Sweeping motion for spotlight
        const sweepAngle = Math.sin(animationTickRef.current * 0.05) * Math.PI * 0.25;
        
        // Move the spotlight source
        if (spriteRef.current) {
          spriteRef.current.rotation = sweepAngle;
        }
        
        // Update particles to follow the light cone
        if (particlesArray.current.length > 0) {
          particlesArray.current.forEach((particle, i) => {
            const dist = (i / particlesArray.current.length) * triggerRadius;
            particle.position.x = Math.sin(sweepAngle) * dist * 0.5;
            particle.position.y = Math.cos(sweepAngle) * dist;
            
            // Particles further away are fainter
            particle.alpha = 0.6 * (1 - (dist / triggerRadius));
          });
        }
        
        // Check if player is in spotlight beam
        const angleToPlayer = Math.atan2(
          playerPos.x - hazardPos.x,
          playerPos.y - hazardPos.y
        );
        
        const angleDiff = Math.abs(angleToPlayer - sweepAngle);
        if (
          distanceToPlayer < triggerRadius * 2 &&
          angleDiff < 0.3 &&
          currentTime - lastDamageTimeRef.current > 1000
        ) {
          takeDamage(damage);
          lastDamageTimeRef.current = currentTime;
        }
        break;
    }
  });
  
  return (
    <Container ref={containerRef} position={[x, y]}>
      <Sprite
        ref={spriteRef}
        texture={texture}
        width={width}
        height={height}
        anchor={0.5}
      />
    </Container>
  );
}