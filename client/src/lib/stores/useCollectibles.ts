import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { getLocalStorage, setLocalStorage } from "../utils";

interface CollectibleItem {
  id: string;
  type: string;
  collected: boolean;
}

interface CollectiblesState {
  // A record of all collected items keyed by their unique ID
  collectibles: Record<string, CollectibleItem>;
  
  // Total counts by type
  boneCount: number;
  visaCount: number;
  snackCount: number;
  
  // Functions
  collectItem: (id: string, type: string) => void;
  isCollected: (id: string) => boolean;
  resetCollectibles: () => void;
  
  // Save/Load
  saveProgress: () => void;
  loadProgress: () => void;
}

export const useCollectibles = create<CollectiblesState>()(
  subscribeWithSelector((set, get) => ({
    // Collectibles record
    collectibles: {},
    
    // Count trackers
    boneCount: 0,
    visaCount: 0,
    snackCount: 0,
    
    // Collect a new item
    collectItem: (id, type) => set((state) => {
      // Skip if already collected
      if (state.collectibles[id]) return state;
      
      // Create new collectibles record
      const newCollectibles = {
        ...state.collectibles,
        [id]: {
          id,
          type,
          collected: true
        }
      };
      
      // Update type counts
      let { boneCount, visaCount, snackCount } = state;
      
      switch (type) {
        case 'bone':
          boneCount++;
          break;
        case 'visa':
          visaCount++;
          break;
        case 'snack':
          snackCount++;
          break;
      }
      
      return {
        collectibles: newCollectibles,
        boneCount,
        visaCount,
        snackCount
      };
    }),
    
    // Check if an item has been collected
    isCollected: (id) => {
      const { collectibles } = get();
      return !!collectibles[id];
    },
    
    // Reset collectibles - typically used when restarting a level
    resetCollectibles: () => set({
      collectibles: {},
      boneCount: 0,
      visaCount: 0,
      snackCount: 0
    }),
    
    // Save collectibles to localStorage
    saveProgress: () => {
      const { collectibles, boneCount, visaCount, snackCount } = get();
      setLocalStorage('chihuahua_collectibles', {
        collectibles,
        boneCount,
        visaCount,
        snackCount
      });
    },
    
    // Load collectibles from localStorage
    loadProgress: () => {
      const data = getLocalStorage('chihuahua_collectibles');
      if (data) {
        set({
          collectibles: data.collectibles || {},
          boneCount: data.boneCount || 0,
          visaCount: data.visaCount || 0,
          snackCount: data.snackCount || 0
        });
      }
    }
  }))
);
