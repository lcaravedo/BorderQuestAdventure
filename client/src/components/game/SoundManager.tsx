import { useEffect, useState } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import { Howl } from "howler";

// Extend Window interface to add our global sound methods
declare global {
  interface Window {
    playSoundEffect: (url: string, volume?: number) => void;
    audioContext: AudioContext | null;
    audioInitialized: boolean;
  }
}

// SoundManager handles all game audio, ensuring sounds are loaded and played correctly
export default function SoundManager() {
  const { phase } = useGame();
  const { 
    backgroundMusic, 
    isMuted, 
    toggleMute 
  } = useAudio();
  
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Initialize audio context and set up global sound helpers
  useEffect(() => {
    // Initialize audio context (this works around browser autoplay restrictions)
    const setupAudio = () => {
      // Create AudioContext only once
      if (!window.audioContext) {
        // Use standard or webkit prefix
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        window.audioContext = new AudioContext();
      }
      
      // Create global helper for playing sound effects
      window.playSoundEffect = (url: string, volume = 0.3) => {
        if (isMuted) return; // Skip if muted
        
        // Create and play a sound immediately
        const audio = new Audio(url);
        audio.volume = volume;
        
        // Play with error handling
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log(`Failed to play sound ${url}:`, error);
          });
        }
      };
      
      // Pre-cache our sound effects for better performance
      const preloadSounds = [
        '/sounds/hit.mp3',
        '/sounds/success.mp3', 
        '/sounds/enemy_defeat.mp3',
        '/sounds/boss_victory.mp3',
        '/sounds/save_checkpoint.mp3',
        '/sounds/border_crossing.mp3',
        '/sounds/bark.mp3'
      ];
      
      // Create Audio objects for each sound to preload them
      preloadSounds.forEach(url => {
        const audio = new Audio(url);
        // Set to preload but not play
        audio.preload = 'auto';
        // Load a tiny bit of the audio to prime the browser
        audio.load();
      });
      
      // Mark audio as initialized
      window.audioInitialized = true;
      setAudioInitialized(true);
      console.log("🔊 Audio system successfully initialized");
    };
    
    // Run setup
    setupAudio();
  }, [isMuted]);
  
  // Initialize all sounds on first load
  useEffect(() => {
    // Load the game sounds using native Audio API
    const loadSounds = async () => {
      if (typeof window !== 'undefined') {
        try {
          // Create the background music
          const bgMusic = new Audio('/sounds/game_music.mp3');
          bgMusic.loop = true;
          bgMusic.volume = 0.2;
          bgMusic.preload = 'auto';
          
          // Store in global state
          useAudio.getState().setBackgroundMusic(bgMusic);
          
          console.log("🎵 All audio assets loaded and ready");
        } catch (error) {
          console.error("Failed to initialize audio:", error);
        }
      }
    };
    
    loadSounds();
  }, []);

  // Play/pause background music based on game phase
  useEffect(() => {
    if (!backgroundMusic || !audioInitialized) return;
    
    if (phase === "playing") {
      // Only play if not muted
      if (!isMuted) {
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("Background music autoplay prevented:", err);
          });
        }
      }
    } else {
      backgroundMusic.pause();
    }
    
    return () => {
      backgroundMusic.pause();
    };
  }, [phase, backgroundMusic, isMuted, audioInitialized]);
  
  // Handle user interaction to enable audio (browser autoplay policy)
  useEffect(() => {
    // This function needs to be called after user interaction
    const enableAudio = () => {
      // Resume AudioContext if it's suspended
      if (window.audioContext && window.audioContext.state === 'suspended') {
        window.audioContext.resume().then(() => {
          console.log("AudioContext resumed successfully");
        });
      }
      
      // Try to play the background music
      if (backgroundMusic && phase === "playing" && !isMuted) {
        const playPromise = backgroundMusic.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.log("Background music play prevented:", err);
          });
        }
      }
      
      // Play a silent sound to unlock audio on iOS
      const silentSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABBgCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAAAAA=");
      silentSound.play();
      
      // Mark as initialized
      window.audioInitialized = true;
      setAudioInitialized(true);
    };

    // Listen for various user interactions
    const events = ["click", "touchstart", "keydown"];
    
    // Only add these listeners if audio isn't initialized yet
    if (!audioInitialized) {
      events.forEach(event => window.addEventListener(event, enableAudio, { once: true }));
    }
    
    return () => {
      if (!audioInitialized) {
        events.forEach(event => window.removeEventListener(event, enableAudio));
      }
    };
  }, [backgroundMusic, phase, isMuted, audioInitialized]);

  // Keyboard listener for mute toggle (N key) - changed from M to avoid conflict with sword attack
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyN") {
        toggleMute();
        
        // If we're unmuting and the game is playing, start the background music
        if (phase === "playing" && backgroundMusic && !isMuted) {
          const playPromise = backgroundMusic.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.log("Background music play prevented:", err);
            });
          }
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMute, backgroundMusic, phase, isMuted]);

  // This component doesn't render anything
  return null;
}
