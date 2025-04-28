import { create } from "zustand";

// Define the shape of our audio state
interface AudioState {
  // State
  backgroundMusic: HTMLAudioElement | null;
  isMuted: boolean;
  audioInitialized: boolean;
  
  // Setters
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setAudioInitialized: (initialized: boolean) => void;
  
  // Controls
  toggleMute: () => void;
  
  // Helper function
  playSound: (url: string, volume?: number) => void;
  
  // Sound effects
  playHit: () => void;
  playSuccess: () => void;
  playBossVictory: () => void;
  playSave: () => void;
  playLevelComplete: () => void;
  playBark: () => void;
  playEnemyDefeat: () => void;
}

/**
 * Audio store for handling game sounds
 */
export const useAudio = create<AudioState>((set, get) => ({
  // State
  backgroundMusic: null,
  isMuted: false,
  audioInitialized: false,
  
  // Setters
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setAudioInitialized: (initialized) => set({ audioInitialized: initialized }),
  
  // Controls
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    set({ isMuted: newMutedState });
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  // Helper function to play sound with our global player
  playSound: (url: string, volume = 0.3) => {
    const { isMuted } = get();
    
    if (isMuted) return;
    
    // Use global player if available
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect(url, volume);
    } else {
      try {
        // Fallback to regular Audio API
        const sound = new Audio(url);
        sound.volume = volume;
        sound.play().catch(err => console.log("Audio play error:", err));
      } catch (err) {
        console.error("Failed to play sound:", err);
      }
    }
  },
  
  // Sound effects
  playHit: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Hit sound skipped (muted)");
      return;
    }
    
    console.log("Playing HIT/DAMAGE sound effect");
    useAudio.getState().playSound("/sounds/hit.mp3", 0.3);
  },
  
  playSuccess: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Success sound skipped (muted)");
      return;
    }
    
    console.log("Playing COLLECTIBLE sound effect");
    useAudio.getState().playSound("/sounds/success.mp3", 0.3);
  },
  
  playBossVictory: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Boss victory sound skipped (muted)");
      return;
    }
    
    console.log("Playing BOSS VICTORY sound effect");
    useAudio.getState().playSound("/sounds/boss_victory.mp3", 0.5);
  },
  
  playSave: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Save sound skipped (muted)");
      return;
    }
    
    console.log("Playing CHECKPOINT sound effect");
    useAudio.getState().playSound("/sounds/save_checkpoint.mp3", 0.4);
  },
  
  playLevelComplete: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Level complete sound skipped (muted)");
      return;
    }
    
    console.log("Playing BORDER CROSSING sound effect");
    useAudio.getState().playSound("/sounds/border_crossing.mp3", 0.5);
  },
  
  playBark: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Bark sound skipped (muted)");
      return;
    }
    
    console.log("Playing BARK sound effect");
    useAudio.getState().playSound("/sounds/bark.mp3", 0.25);
  },
  
  playEnemyDefeat: () => {
    const { isMuted } = get();
    
    if (isMuted) {
      console.log("Enemy defeat sound skipped (muted)");
      return;
    }
    
    console.log("Playing ENEMY DEFEAT sound effect");
    useAudio.getState().playSound("/sounds/enemy_defeat.mp3", 0.4);
  }
}));