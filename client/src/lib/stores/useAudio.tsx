import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  bossVictorySound: HTMLAudioElement | null;
  saveSound: HTMLAudioElement | null;
  levelCompleteSound: HTMLAudioElement | null;
  barkSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setBossVictorySound: (sound: HTMLAudioElement) => void;
  setSaveSound: (sound: HTMLAudioElement) => void;
  setLevelCompleteSound: (sound: HTMLAudioElement) => void;
  setBarkSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playBossVictory: () => void;
  playSave: () => void;
  playLevelComplete: () => void;
  playBark: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  bossVictorySound: null,
  saveSound: null,
  levelCompleteSound: null,
  barkSound: null,
  isMuted: true, // Start muted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setBossVictorySound: (sound) => set({ bossVictorySound: sound }),
  setSaveSound: (sound) => set({ saveSound: sound }),
  setLevelCompleteSound: (sound) => set({ levelCompleteSound: sound }),
  setBarkSound: (sound) => set({ barkSound: sound }),
  
  toggleMute: () => {
    const { isMuted } = get();
    const newMutedState = !isMuted;
    
    // Just update the muted state
    set({ isMuted: newMutedState });
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Hit sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Success sound skipped (muted)");
        return;
      }
      
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playBossVictory: () => {
    const { bossVictorySound, isMuted } = get();
    if (bossVictorySound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Boss victory sound skipped (muted)");
        return;
      }
      
      bossVictorySound.currentTime = 0;
      bossVictorySound.volume = 0.5; // Special victory sound should be prominent
      bossVictorySound.play().catch(error => {
        console.log("Boss victory sound play prevented:", error);
      });
    }
  },
  
  playSave: () => {
    const { saveSound, isMuted } = get();
    if (saveSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Save sound skipped (muted)");
        return;
      }
      
      saveSound.currentTime = 0;
      saveSound.volume = 0.3;
      saveSound.play().catch(error => {
        console.log("Save sound play prevented:", error);
      });
    }
  },
  
  playLevelComplete: () => {
    const { levelCompleteSound, isMuted } = get();
    if (levelCompleteSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Level complete sound skipped (muted)");
        return;
      }
      
      levelCompleteSound.currentTime = 0;
      levelCompleteSound.volume = 0.4;
      levelCompleteSound.play().catch(error => {
        console.log("Level complete sound play prevented:", error);
      });
    }
  },
  
  playBark: () => {
    const { barkSound, isMuted } = get();
    if (barkSound) {
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Bark sound skipped (muted)");
        return;
      }
      
      // Clone the sound to allow overlapping playback
      const soundClone = barkSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.25;
      soundClone.play().catch(error => {
        console.log("Bark sound play prevented:", error);
      });
    }
  }
}));
