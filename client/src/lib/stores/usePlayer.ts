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
  stamina: number;
  maxStamina: number;
  
  // Abilities
  barkPower: number; // 1-3
  digLevel: number; // 1-3
  dashLevel: number; // 1-3
  
  // Status
  isHidden: boolean;
  
  // Functions
  updatePosition: (newPosition: [number, number, number]) => void;
  updateVelocity: (newVelocity: [number, number, number, number?]) => void;
  setGrounded: (grounded: boolean) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  resetPlayer: () => void;
  setPlayerSpawn: (position: [number, number, number]) => void;
  upgradeAbility: (ability: 'bark' | 'dig' | 'dash') => void;
  setHidden: (hidden: boolean) => void;
  
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
    
    health: 5,
    maxHealth: 5,
    stamina: 100,
    maxStamina: 100,
    
    barkPower: 1,
    digLevel: 1,
    dashLevel: 1,
    
    isHidden: false,
    
    // Update player position
    updatePosition: (newPosition) => set({ position: newPosition }),
    
    // Update velocity (and bark flag)
    updateVelocity: (newVelocity) => set({ 
      velocity: [
        newVelocity[0], 
        newVelocity[1], 
        newVelocity[2], 
        newVelocity[3] || 0
      ] 
    }),
    
    // Set grounded state
    setGrounded: (grounded) => set({ isGrounded: grounded }),
    
    // Take damage
    takeDamage: (amount) => set((state) => ({
      health: Math.max(0, state.health - amount)
    })),
    
    // Heal player
    heal: (amount) => set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount)
    })),
    
    // Reset player to default state
    resetPlayer: () => set({
      position: [0, 1, 0],
      velocity: [0, 0, 0, 0],
      isGrounded: false,
      health: 5,
      stamina: 100,
      isHidden: false
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
    
    // Save player progress to localStorage
    saveProgress: () => {
      const { health, maxHealth, barkPower, digLevel, dashLevel } = get();
      setLocalStorage('chihuahua_player', {
        health,
        maxHealth,
        barkPower,
        digLevel,
        dashLevel
      });
    },
    
    // Load player progress from localStorage
    loadProgress: () => {
      const data = getLocalStorage('chihuahua_player');
      if (data) {
        set({
          health: data.health || 5,
          maxHealth: data.maxHealth || 5,
          barkPower: data.barkPower || 1,
          digLevel: data.digLevel || 1,
          dashLevel: data.dashLevel || 1
        });
      }
    }
  }))
);
