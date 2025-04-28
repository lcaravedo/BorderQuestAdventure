import { useEffect } from "react";
import { useAudio } from "@/lib/stores/useAudio";
import { useGame } from "@/lib/stores/useGame";
import { Howl } from "howler";

// SoundManager handles all game audio, ensuring sounds are loaded and played correctly
export default function SoundManager() {
  const { phase } = useGame();
  const { 
    backgroundMusic, 
    isMuted, 
    toggleMute 
  } = useAudio();

  // Initialize all sounds
  useEffect(() => {
    // Load the game sounds using Howler
    const loadSounds = async () => {
      // This would be replaced with Howler implementation, but we're using
      // the HTML Audio element directly via the useAudio store for now
      
      // Optional: Add additional sound loading here if needed
    };
    
    loadSounds();
  }, []);

  // Play/pause background music based on game phase
  useEffect(() => {
    if (!backgroundMusic) return;
    
    if (phase === "playing") {
      // Only play if not muted
      if (!isMuted) {
        backgroundMusic.play().catch(err => {
          console.log("Background music autoplay prevented:", err);
        });
      }
    } else {
      backgroundMusic.pause();
    }
    
    return () => {
      backgroundMusic.pause();
    };
  }, [phase, backgroundMusic, isMuted]);
  
  // Handle user interaction to enable audio (browser autoplay policy)
  useEffect(() => {
    const enableAudio = () => {
      if (backgroundMusic && phase === "playing" && !isMuted) {
        // Try to play the background music
        backgroundMusic.play().catch(err => {
          console.log("Background music play prevented:", err);
        });
      }
    };

    // These events indicate user interaction
    window.addEventListener("click", enableAudio);
    window.addEventListener("touchstart", enableAudio);
    window.addEventListener("keydown", enableAudio);
    
    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
      window.removeEventListener("keydown", enableAudio);
    };
  }, [backgroundMusic, phase, isMuted]);

  // Keyboard listener for mute toggle (M key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyM") {
        toggleMute();
        
        // If we're unmuting and the game is playing, start the background music
        if (phase === "playing" && backgroundMusic && !isMuted) {
          backgroundMusic.play().catch(err => {
            console.log("Background music play prevented:", err);
          });
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleMute, backgroundMusic, phase, isMuted]);

  // This component doesn't render anything
  return null;
}
