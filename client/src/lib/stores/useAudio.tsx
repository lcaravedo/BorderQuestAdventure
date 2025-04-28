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
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Success sound skipped (muted)");
      return;
    }
    
    console.log("Playing COLLECTIBLE sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/success.mp3", 0.3);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/success.mp3");
      fxSound.volume = 0.3;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playBossVictory: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Boss victory sound skipped (muted)");
      return;
    }
    
    console.log("Playing BOSS VICTORY sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/boss_victory.mp3", 0.5);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/boss_victory.mp3");
      fxSound.volume = 0.5;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playSave: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Save sound skipped (muted)");
      return;
    }
    
    console.log("Playing CHECKPOINT sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/save_checkpoint.mp3", 0.4);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/save_checkpoint.mp3");
      fxSound.volume = 0.4;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playLevelComplete: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Level complete sound skipped (muted)");
      return;
    }
    
    console.log("Playing BORDER CROSSING sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/border_crossing.mp3", 0.5);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/border_crossing.mp3");
      fxSound.volume = 0.5;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playBark: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Bark sound skipped (muted)");
      return;
    }
    
    console.log("Playing BARK sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/bark.mp3", 0.25);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/bark.mp3");
      fxSound.volume = 0.25;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playEnemyDefeat: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Enemy defeat sound skipped (muted)");
      return;
    }
    
    console.log("Playing ENEMY DEFEAT sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/enemy_defeat.mp3", 0.4);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/enemy_defeat.mp3");
      fxSound.volume = 0.4;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  },
  
  playHit: () => {
    const { isMuted } = get();
    
    // If sound is muted, don't play anything
    if (isMuted) {
      console.log("Hit sound skipped (muted)");
      return;
    }
    
    console.log("Playing HIT/DAMAGE sound effect");
    
    // Use global sound player if available, otherwise fallback
    if (typeof window !== 'undefined' && window.playSoundEffect) {
      window.playSoundEffect("/sounds/hit.mp3", 0.3);
    } else {
      // Fallback method
      const fxSound = new Audio("/sounds/hit.mp3");
      fxSound.volume = 0.3;
      fxSound.play().catch(err => console.log("Audio play error:", err));
    }
  }
}));
