import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  bossVictorySound: HTMLAudioElement | null;
  saveSound: HTMLAudioElement | null;
  levelCompleteSound: HTMLAudioElement | null;
  barkSound: HTMLAudioElement | null;
  enemyDefeatSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setBossVictorySound: (sound: HTMLAudioElement) => void;
  setSaveSound: (sound: HTMLAudioElement) => void;
  setLevelCompleteSound: (sound: HTMLAudioElement) => void;
  setBarkSound: (sound: HTMLAudioElement) => void;
  setEnemyDefeatSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playBossVictory: () => void;
  playSave: () => void;
  playLevelComplete: () => void;
  playBark: () => void;
  playEnemyDefeat: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  bossVictorySound: null,
  saveSound: null,
  levelCompleteSound: null,
  barkSound: null,
  enemyDefeatSound: null,
  isMuted: false, // Start unmuted by default
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setBossVictorySound: (sound) => set({ bossVictorySound: sound }),
  setSaveSound: (sound) => set({ saveSound: sound }),
  setLevelCompleteSound: (sound) => set({ levelCompleteSound: sound }),
  setBarkSound: (sound) => set({ barkSound: sound }),
  setEnemyDefeatSound: (sound) => set({ enemyDefeatSound: sound }),
  
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
      
      console.log("Playing HIT/DAMAGE sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Hit sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Hit sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Hit sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
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
      
      console.log("Playing COLLECTIBLE sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Collectible sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Success sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Collectible sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
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
      
      console.log("Playing BOSS VICTORY sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Boss victory sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Boss victory sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Boss victory sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
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
      
      console.log("Playing CHECKPOINT sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Checkpoint sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Save sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Checkpoint sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
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
      
      console.log("Playing BORDER CROSSING sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Border crossing sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Border crossing sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Border crossing sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
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
      
      console.log("Playing BARK sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Bark sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Bark sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Bark sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
          }, 100);
        });
      }
    }
  },
  
  playEnemyDefeat: () => {
    const { enemyDefeatSound, isMuted } = get();
    if (enemyDefeatSound || true) { // Allow playing even if not explicitly set
      // If sound is muted, don't play anything
      if (isMuted) {
        console.log("Enemy defeat sound skipped (muted)");
        return;
      }
      
      // Create a fresh audio instance to avoid playback issues
      const fxSound = new Audio("/sounds/enemy_defeat.mp3");
      fxSound.volume = 0.4;
      
      console.log("Playing ENEMY DEFEAT sound effect");
      
      // Force browser to play the sound
      const playPromise = fxSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log("✅ Enemy defeat sound playing successfully!");
        }).catch(error => {
          console.log("⚠️ Enemy defeat sound play prevented:", error);
          // Try a fallback technique
          setTimeout(() => {
            fxSound.play()
              .then(() => console.log("✅ Enemy defeat sound played on second attempt!"))
              .catch(err => console.log("❌ Second attempt failed too:", err));
          }, 100);
        });
      }
    }
  }
}));
