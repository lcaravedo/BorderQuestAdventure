import { useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";

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
    toggleMute,
    setAudioInitialized 
  } = useAudio();

  // Initialize audio context and set up global sound helpers
  useEffect(() => {
    console.log("Setting up audio system...");
    
    // Create audio context if needed
    if (!window.audioContext) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        window.audioContext = new AudioContext();
      }
    }
    
    // Create global sound effect player function
    window.playSoundEffect = (url: string, volume = 0.3) => {
      if (isMuted) return;
      
      const audio = new Audio(url);
      audio.volume = volume;
      
      audio.play().catch(error => {
        console.log(`Failed to play sound ${url}:`, error);
        
        // Try again on next interaction
        const retry = () => {
          audio.play().catch(err => console.log("Still couldn't play sound:", err));
          document.removeEventListener('click', retry);
          document.removeEventListener('keydown', retry);
        };
        
        document.addEventListener('click', retry, { once: true });
        document.addEventListener('keydown', retry, { once: true });
      });
    };
    
    // Mark audio as initialized so others know it's ready
    window.audioInitialized = true;
    setAudioInitialized(true);
    
    // Preload common sound effects for better performance
    [
      '/sounds/hit.mp3',
      '/sounds/success.mp3',
      '/sounds/enemy_defeat.mp3',
      '/sounds/boss_victory.mp3',
      '/sounds/save_checkpoint.mp3',
      '/sounds/bark.mp3',
      '/sounds/border_crossing.mp3'
    ].forEach(url => {
      const audio = new Audio();
      audio.src = url;
      audio.preload = 'auto';
    });
    
    console.log("🔊 Audio system successfully initialized");
  }, [isMuted, setAudioInitialized]);
  
  // Handle background music playback based on game phase
  useEffect(() => {
    if (!backgroundMusic) return;
    
    if (phase === "playing" && !isMuted) {
      // Try to play background music when game is active
      backgroundMusic.play().catch(error => {
        console.log("Background music autoplay prevented:", error);
        
        // Try again on user interaction
        const playMusic = () => {
          backgroundMusic.play().catch(err => console.log("Still couldn't play music:", err));
          document.removeEventListener('click', playMusic);
          document.removeEventListener('keydown', playMusic);
        };
        
        document.addEventListener('click', playMusic, { once: true });
        document.addEventListener('keydown', playMusic, { once: true });
      });
    } else {
      // Pause when not in gameplay
      backgroundMusic.pause();
    }
    
    return () => {
      backgroundMusic.pause();
    };
  }, [phase, backgroundMusic, isMuted]);
  
  // Listen for mute toggle (N key) 
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "KeyN") {
        toggleMute();
        console.log("Mute toggled with N key");
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggleMute]);
  
  // Component doesn't render anything
  return null;
}