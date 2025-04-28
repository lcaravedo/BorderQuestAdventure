import { useEffect, useState } from "react";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import GameMenu from "./components/ui/game-menu";
import LevelSelect from "./components/ui/level-select";
import GameUI from "./components/ui/game-ui";
import SoundManager from "./components/game/SoundManager";
import Game2DCanvas from "./components/game2d/Game2DCanvas";
import { Controls } from "./lib/consts";
import "@fontsource/inter";

// Define keyboard control mappings
const keyboardMap = [
  { name: Controls.LEFT, keys: ["KeyA", "ArrowLeft"] },
  { name: Controls.RIGHT, keys: ["KeyD", "ArrowRight"] },
  { name: Controls.JUMP, keys: ["KeyW", "ArrowUp", "Space"] },
  { name: Controls.BARK, keys: ["KeyJ"] },
  { name: Controls.DIG, keys: ["KeyK"] },
  { name: Controls.DASH, keys: ["KeyL", "ShiftLeft"] },
];

// Main App component
function App() {
  const { phase } = useGame();
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound,
    setBossVictorySound,
    setSaveSound,
    setLevelCompleteSound,
    setBarkSound
  } = useAudio();
  const [showCanvas, setShowCanvas] = useState(false);

  // Initialize audio assets and game state
  useEffect(() => {
    // Background music
    const backgroundMusic = new Audio("/sounds/game_music.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.4;
    setBackgroundMusic(backgroundMusic);

    // Hit sound (used for taking damage)
    const hitSound = new Audio("/sounds/hit.mp3");
    setHitSound(hitSound);

    // Success sound (used for collectibles)
    const successSound = new Audio("/sounds/success.mp3");
    setSuccessSound(successSound);
    
    // Boss victory sound (used when defeating bosses)
    const bossVictorySound = new Audio("/sounds/boss_victory.mp3");
    setBossVictorySound(bossVictorySound);
    
    // Save game sound (used when reaching checkpoints)
    const saveSound = new Audio("/sounds/save.mp3");
    setSaveSound(saveSound);
    
    // Level complete sound (used when reaching the border)
    const levelCompleteSound = new Audio("/sounds/level_complete.mp3");
    setLevelCompleteSound(levelCompleteSound);
    
    // Bark sound (used for bark attack)
    const barkSound = new Audio("/sounds/bark.mp3");
    setBarkSound(barkSound);

    console.log("App initialized in 'ready' state");

    // Show canvas after everything is loaded
    setShowCanvas(true);
  }, [
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound, 
    setBossVictorySound, 
    setSaveSound,
    setLevelCompleteSound,
    setBarkSound
  ]);
  
  // Add a listener for manual phase changes from our debug overlay
  const { setPhase } = useGame() as any;
  useEffect(() => {
    const handlePhaseChange = (e: CustomEvent) => {
      console.log("Custom phase change event:", e.detail);
      setPhase(e.detail);
    };
    
    window.addEventListener('changePhase', handlePhaseChange as EventListener);
    
    return () => {
      window.removeEventListener('changePhase', handlePhaseChange as EventListener);
    };
  }, [setPhase]);

  // Let the user know what's going on
  console.log("Current game phase:", phase);

  // Add a manual retry button if showing the canvas fails
  if (!showCanvas) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-blue-900">
        <div className="text-white text-center p-8 bg-black/50 rounded-xl max-w-xl">
          <h1 className="text-3xl font-bold mb-4">Loading Kaya Quest</h1>
          <p className="mb-4">Game assets are being loaded...</p>
          <button 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-bold"
            onClick={() => {
              console.log("Manual retry clicked");
              window.location.reload();
            }}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <div className="game-container">
        {/* Game menu with debug overlay */}
        {phase === "ready" && (
          <div className="relative w-full h-full">
            <GameMenu />
            {/* Debug overlay */}
            <div className="absolute top-2 right-2 z-50 bg-black/80 text-white p-2 rounded text-xs">
              <p>Debug: Phase = {phase}</p>
              <button 
                className="mt-1 px-2 py-1 bg-green-700 text-white rounded"
                onClick={() => {
                  console.log("Manual phase change to 'selecting'");
                  window.dispatchEvent(new CustomEvent('changePhase', { detail: 'selecting' }));
                }}
              >
                Force Level Select
              </button>
              <button 
                className="mt-1 ml-2 px-2 py-1 bg-blue-700 text-white rounded"
                onClick={() => {
                  console.log("Emergency play button clicked!");
                  window.dispatchEvent(new CustomEvent('changePhase', { detail: 'playing' }));
                }}
              >
                QUICK START
              </button>
            </div>
          </div>
        )}
        
        {/* Level selection screen */}
        {phase === "selecting" && <LevelSelect />}
        
        {/* Active gameplay - Using 2D game now */}
        {phase === "playing" && (
          <div className="game-wrapper">
            <Game2DCanvas />
            <GameUI />
          </div>
        )}
        
        {/* Game over screen */}
        {phase === "ended" && <GameMenu showGameOver={true} />}
        
        {/* Sound manager component for handling game audio */}
        <SoundManager />
      </div>
    </div>
  );
}

export default App;
