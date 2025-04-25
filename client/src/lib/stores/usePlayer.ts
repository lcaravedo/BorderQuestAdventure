import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "../utils";

interface PlayerState {
  // Position and physics
  position: [number, number, number];
  velocity: [number, number, number, number]; // [x, y, z, barkFlag]
  isGrounded: boolean;
  
  // Stats
  health: number;
  maxHealth: number;
  hearts: number;  // Number of hearts (max lives)
  stamina: number;
  maxStamina: number;
  
  // Appearance and powerups
  isPoweredUp: boolean;  // If true, player is in chihuahua form; if false, in pear head form
  powerUpTimeRemaining: number;  // Time remaining for power-up in milliseconds
  
  // Abilities
  barkPower: number; // 1-3
  digLevel: number; // 1-3
  dashLevel: number; // 1-3
  
  // Status
  isHidden: boolean;
  isDashing: boolean;
  isBarking: boolean;
  isDigging: boolean;
  
  // Functions
  updatePosition: (newPosition: [number, number, number]) => void;
  setPosition: (newPosition: [number, number, number]) => void; // Alias for updatePosition
  updateVelocity: (newVelocity: [number, number, number, number?]) => void;
  setGrounded: (grounded: boolean) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  resetPlayer: () => void;
  setPlayerSpawn: (position: [number, number, number]) => void;
  upgradeAbility: (ability: 'bark' | 'dig' | 'dash') => void;
  setHidden: (hidden: boolean) => void;
  setIsDashing: (dashing: boolean) => void;
  setIsBarking: (barking: boolean) => void;
  setIsDigging: (digging: boolean) => void;
  powerUp: (duration: number) => void;  // Activate power-up for duration milliseconds
  resetPowerUp: () => void;  // Reset to pear head form
  addHeart: () => void;  // Add a heart (increase max lives)
  jump: () => void; // Make player jump
  dash: () => void; // Make player dash
  
  // Save/Load
  saveProgress: () => void;
  loadProgress: () => void;
}

export const usePlayer = create<PlayerState>()(
  subscribeWithSelector((set, get) => ({
    // Default values
    position: [0, 1, 0],
    velocity: [0, 0, 0, 0], // Last value is barkFlag
    isGrounded: false,
    
    // Stats
    health: 3,
    maxHealth: 3,
    hearts: 3,  // Start with 3 hearts
    stamina: 100,
    maxStamina: 100,
    
    // Appearance and powerups
    isPoweredUp: false,  // Start as pear head
    powerUpTimeRemaining: 0,
    
    // Abilities
    barkPower: 1,
    digLevel: 1,
    dashLevel: 1,
    
    // Status
    isHidden: false,
    isDashing: false,
    isBarking: false,
    isDigging: false,
    
    // Update player position
    updatePosition: (newPosition) => set({ position: newPosition }),
    setPosition: (newPosition) => set({ position: newPosition }), // Alias for updatePosition
    
    // Update velocity (and bark flag)
    updateVelocity: (newVelocity) => set({ 
      velocity: [
        newVelocity[0], 
        newVelocity[1], 
        newVelocity[2], 
        newVelocity[3] || 0
      ] 
    }),
    
    // Set ability states
    setIsDashing: (dashing) => set({ isDashing: dashing }),
    setIsBarking: (barking) => set({ isBarking: barking }),
    setIsDigging: (digging) => set({ isDigging: digging }),
    
    // Jump action
    jump: () => {
      const { isGrounded, velocity } = get();
      if (isGrounded) {
        set({ 
          velocity: [velocity[0], -8, velocity[2], velocity[3]], 
          isGrounded: false 
        });
      }
    },
    
    // Dash action
    dash: () => {
      const { isDashing, isGrounded, velocity, dashLevel } = get();
      if (!isDashing && isGrounded) {
        const dashPower = 1 + (dashLevel * 0.25);
        set({ 
          isDashing: true,
          velocity: [velocity[0] * dashPower, velocity[1], velocity[2], velocity[3]]
        });
        
        // Reset dash after a short duration
        setTimeout(() => {
          set({ isDashing: false });
        }, 300);
      }
    },
    
    // Set grounded state
    setGrounded: (grounded) => set({ isGrounded: grounded }),
    
    // Take damage
    takeDamage: (amount) => set((state) => {
      // If powered up, lose power-up instead of health
      if (state.isPoweredUp) {
        return {
          isPoweredUp: false,
          powerUpTimeRemaining: 0
        };
      }
      
      // Otherwise take health damage
      const newHealth = Math.max(0, state.health - amount);
      
      // If health reaches 0, reduce hearts by 1 and reset health if hearts remain
      if (newHealth === 0 && state.hearts > 1) {
        return {
          hearts: state.hearts - 1,
          health: state.maxHealth
        };
      }
      
      return { health: newHealth };
    }),
    
    // Heal player
    heal: (amount) => set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount)
    })),
    
    // Reset player to default state
    resetPlayer: () => set({
      position: [0, 1, 0],
      velocity: [0, 0, 0, 0],
      isGrounded: false,
      health: 3,
      stamina: 100,
      isHidden: false,
      isDashing: false,
      isBarking: false,
      isDigging: false,
      isPoweredUp: false,
      powerUpTimeRemaining: 0
    }),
    
    // Set player spawn position
    setPlayerSpawn: (position) => set({ position }),
    
    // Upgrade abilities
    upgradeAbility: (ability) => set((state) => {
      switch (ability) {
        case 'bark':
          return { barkPower: Math.min(3, state.barkPower + 1) };
        case 'dig':
          return { digLevel: Math.min(3, state.digLevel + 1) };
        case 'dash':
          return { dashLevel: Math.min(3, state.dashLevel + 1) };
        default:
          return {};
      }
    }),
    
    // Set hidden state (for dig ability)
    setHidden: (hidden) => set({ isHidden: hidden }),
    
    // Power up to chihuahua form
    powerUp: (duration) => set({
      isPoweredUp: true,
      powerUpTimeRemaining: duration
    }),
    
    // Reset to pear head form
    resetPowerUp: () => set({
      isPoweredUp: false,
      powerUpTimeRemaining: 0
    }),
    
    // Add a heart (increase max lives)
    addHeart: () => set((state) => ({
      hearts: Math.min(5, state.hearts + 1), // Maximum 5 hearts
      maxHealth: state.maxHealth + 1,
      health: state.health + 1 // Also heal by 1
    })),
    
    // Save player progress to localStorage
    saveProgress: () => {
      const { 
        health, maxHealth, hearts,
        barkPower, digLevel, dashLevel,
        isPoweredUp
      } = get();
      
      setLocalStorage('kaya_player', {
        health,
        maxHealth,
        hearts,
        barkPower,
        digLevel,
        dashLevel,
        isPoweredUp
      });
    },
    
    // Load player progress from localStorage
    loadProgress: () => {
      const data = getLocalStorage('kaya_player');
      if (data) {
        set({
          health: data.health || 3,
          maxHealth: data.maxHealth || 3,
          hearts: data.hearts || 3,
          barkPower: data.barkPower || 1,
          digLevel: data.digLevel || 1,
          dashLevel: data.dashLevel || 1,
          isPoweredUp: data.isPoweredUp || false
        });
      }
    }
  }))
);
