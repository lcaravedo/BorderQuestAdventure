import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { useGame } from "./lib/stores/useGame";
import { Howl } from "howler";
import GameMenu from "./components/ui/game-menu";
import LevelSelect from "./components/ui/level-select";
import GameUI from "./components/ui/game-ui";
import GameLevel from "./components/game/GameLevel";
import SoundManager from "./components/game/SoundManager";
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
  const { setBackgroundMusic, setHitSound, setSuccessSound } = useAudio();
  const [showCanvas, setShowCanvas] = useState(false);

  // Initialize audio assets and game state
  useEffect(() => {
    // Background music
    const backgroundMusic = new Audio("/sounds/game_music.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.4;
    setBackgroundMusic(backgroundMusic);

    // Hit sound (used for bark attack)
    const hitSound = new Audio("/sounds/hit.mp3");
    setHitSound(hitSound);

    // Success sound (used for collectibles)
    const successSound = new Audio("/sounds/success.mp3");
    setSuccessSound(successSound);

    console.log("App initialized in 'ready' state");

    // Show canvas after everything is loaded
    setShowCanvas(true);
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      {showCanvas && (
        <KeyboardControls map={keyboardMap}>
          {/* Game menu */}
          {phase === "ready" && <GameMenu />}
          
          {/* Level selection screen */}
          {phase === "selecting" && <LevelSelect />}
          
          {/* Active gameplay */}
          {phase === "playing" && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [0, 5, 10],
                  fov: 60,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  pixelRatio: window.devicePixelRatio
                }}
              >
                <color attach="background" args={["#87CEEB"]} />
                <ambientLight intensity={0.8} />
                <directionalLight 
                  position={[10, 10, 5]} 
                  intensity={1} 
                  castShadow 
                  shadow-mapSize={[1024, 1024]}
                />
                
                <Suspense fallback={null}>
                  <GameLevel />
                </Suspense>
              </Canvas>
              <GameUI />
            </>
          )}
          
          {/* Game over screen */}
          {phase === "ended" && <GameMenu showGameOver={true} />}
          
          {/* Sound manager component for handling game audio */}
          <SoundManager />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
