import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "../utils";

interface LevelsState {
  // World and level tracking
  worlds: number[];
  currentWorld: number;
  currentLevel: number;
  
  // Unlocked levels per world
  // e.g. unlockedLevels[0] = [0, 1] means world 0 has levels 0 and 1 unlocked
  unlockedLevels: Record<number, number[]>;
  
  // Functions
  setCurrentWorld: (worldIndex: number) => void;
  setCurrentLevel: (levelIndex: number) => void;
  unlockLevel: (worldIndex: number, levelIndex: number) => void;
  unlockNextLevel: () => void;
  resetProgress: () => void;
  
  // Save/Load
  saveProgress: () => void;
  loadProgress: () => void;
}

export const useLevels = create<LevelsState>()(
  subscribeWithSelector((set, get) => ({
    // Default values - 5 worlds with 5 levels each
    worlds: [0, 1, 2, 3, 4],
    currentWorld: 0,
    currentLevel: 0,
    
    // By default all levels of the first world are unlocked for testing
    unlockedLevels: {
      0: [0, 1, 2, 3, 4], // All levels in World 1 unlocked
      1: [0, 1],  // Some levels in World 2
      2: [0],  // First level in World 3
      3: [],  // No levels unlocked in World 4
      4: []   // No levels unlocked in World 5
    },
    
    // Set current world
    setCurrentWorld: (worldIndex) => set({ currentWorld: worldIndex }),
    
    // Set current level
    setCurrentLevel: (levelIndex) => set({ currentLevel: levelIndex }),
    
    // Unlock a specific level
    unlockLevel: (worldIndex, levelIndex) => set((state) => {
      const newUnlockedLevels = { ...state.unlockedLevels };
      
      // Initialize the world array if it doesn't exist
      if (!newUnlockedLevels[worldIndex]) {
        newUnlockedLevels[worldIndex] = [];
      }
      
      // Add the level if it's not already unlocked
      if (!newUnlockedLevels[worldIndex].includes(levelIndex)) {
        newUnlockedLevels[worldIndex] = [
          ...newUnlockedLevels[worldIndex],
          levelIndex
        ].sort((a, b) => a - b); // Keep levels sorted
      }
      
      return { unlockedLevels: newUnlockedLevels };
    }),
    
    // Unlock the next level after completing the current one
    unlockNextLevel: () => set((state) => {
      const { currentWorld, currentLevel, worlds } = state;
      const newUnlockedLevels = { ...state.unlockedLevels };
      
      // If there's another level in this world
      if (currentLevel < 4) { // 5 levels per world (0-4)
        const nextLevel = currentLevel + 1;
        
        // Initialize world array if needed
        if (!newUnlockedLevels[currentWorld]) {
          newUnlockedLevels[currentWorld] = [];
        }
        
        // Add the next level if not already unlocked
        if (!newUnlockedLevels[currentWorld].includes(nextLevel)) {
          newUnlockedLevels[currentWorld] = [
            ...newUnlockedLevels[currentWorld],
            nextLevel
          ].sort((a, b) => a - b);
        }
      } 
      // If we finished the last level in a world, unlock the first level of the next world
      else if (currentWorld < worlds.length - 1) {
        const nextWorld = currentWorld + 1;
        
        // Initialize next world array if needed
        if (!newUnlockedLevels[nextWorld]) {
          newUnlockedLevels[nextWorld] = [];
        }
        
        // Add the first level of the next world if not already unlocked
        if (!newUnlockedLevels[nextWorld].includes(0)) {
          newUnlockedLevels[nextWorld] = [
            ...newUnlockedLevels[nextWorld],
            0
          ].sort((a, b) => a - b);
        }
      }
      
      return { unlockedLevels: newUnlockedLevels };
    }),
    
    // Reset all progress (only first level unlocked)
    resetProgress: () => set({
      currentWorld: 0,
      currentLevel: 0,
      unlockedLevels: {
        0: [0],
        1: [],
        2: [],
        3: [],
        4: []
      }
    }),
    
    // Save level progress to localStorage
    saveProgress: () => {
      const { unlockedLevels } = get();
      setLocalStorage('chihuahua_levels', { unlockedLevels });
    },
    
    // Load level progress from localStorage
    loadProgress: () => {
      const data = getLocalStorage('chihuahua_levels');
      if (data && data.unlockedLevels) {
        set({ unlockedLevels: data.unlockedLevels });
      }
    }
  }))
);
