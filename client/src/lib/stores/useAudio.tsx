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
  isMuted: false, // Start unmuted by default
  
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/hit.mp3");
      fxSound.volume = 0.3;
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Hit sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/success.mp3");
      fxSound.volume = 0.3;
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Success sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/boss_victory.mp3");
      fxSound.volume = 0.5; // Special victory sound should be prominent
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Boss victory sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/save_checkpoint.mp3");
      fxSound.volume = 0.4;
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Save sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/border_crossing.mp3");
      fxSound.volume = 0.5;
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Level complete sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
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
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/bark.mp3");
      fxSound.volume = 0.25;
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Bark sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play().catch(err => console.log("Second attempt failed too:", err));
          }, 100);
        });
      }
    }
  }
}));
