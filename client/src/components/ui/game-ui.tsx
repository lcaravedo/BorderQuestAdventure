import { useState, useEffect } from "react";
import { useGame } from "@/lib/stores/useGame";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useCollectibles } from "@/lib/stores/useCollectibles";
import { useLevels } from "@/lib/stores/useLevels";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Progress } from "./progress";
import { Button } from "./button";
import { ArrowUpCircle } from "lucide-react";

export default function GameUI() {
  const { setPhase } = useGame();
  const { health, maxHealth } = usePlayer();
  const { collectibles, boneCount } = useCollectibles();
  const { currentLevel, currentWorld } = useLevels();
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Open upgrade menu
  const openUpgradeMenu = () => {
    setPhase('upgrading');
  };
  
  // Health percentage
  const healthPercentage = (health / maxHealth) * 100;
  
  // Handle pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") {
        setIsPaused(prev => !prev);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  
  // Count collectibles by type
  const countCollectibles = (type: string) => {
    return Object.values(collectibles).filter(item => item.type === type).length;
  };
  
  return (
    <>
      {/* Top HUD - Health, Level, Collectibles */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-none">
        {/* Health and Level Info */}
        <Card className="bg-black/70 border-gray-700 text-white p-3 shadow-lg pointer-events-auto">
          <div className="flex items-center gap-4">
            {/* Health bar */}
            <div className="w-40">
              <div className="text-xs mb-1 flex justify-between">
                <span>HEALTH</span>
                <span>{health} / {maxHealth}</span>
              </div>
              <Progress 
                value={healthPercentage} 
                className="h-3 bg-gray-800"
                indicatorClassName={cn(
                  "bg-green-500",
                  healthPercentage < 30 && "bg-red-500",
                  healthPercentage >= 30 && healthPercentage < 70 && "bg-yellow-500"
                )}
              />
            </div>
            
            {/* Level indicator */}
            <div className="text-sm">
              <div className="font-bold">WORLD {currentWorld + 1}</div>
              <div>Level {currentLevel + 1}</div>
            </div>
          </div>
        </Card>
        
        {/* Collectibles Counter */}
        <Card className="bg-black/70 border-gray-700 text-white p-3 shadow-lg flex gap-3 pointer-events-auto">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-white rounded-full"></div>
            <span className="text-white">{countCollectibles('bone')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-white">{countCollectibles('visa')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-white">{countCollectibles('snack')}</span>
          </div>
        </Card>
      </div>
      
      {/* Controls Overlay (visible when ? is pressed) */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50">
          <Card className="bg-gray-900 border-gray-700 text-white p-6 shadow-lg max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">CONTROLS</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Move Left:</div>
              <div>A / ←</div>
              <div className="text-gray-400">Move Right:</div>
              <div>D / →</div>
              <div className="text-gray-400">Jump:</div>
              <div>W / ↑ / SPACE</div>
              <div className="text-gray-400">Bark Attack:</div>
              <div>J</div>
              <div className="text-gray-400">Dig:</div>
              <div>K</div>
              <div className="text-gray-400">Dash:</div>
              <div>L / SHIFT</div>
              <div className="text-gray-400">Mute Sound:</div>
              <div>M</div>
              <div className="text-gray-400">Pause:</div>
              <div>ESC</div>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setShowControls(false)}
            >
              CLOSE
            </Button>
          </Card>
        </div>
      )}
      
      {/* Pause Menu */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <Card className="bg-gray-900 border-gray-700 text-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">PAUSED</h2>
            <div className="flex flex-col gap-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setIsPaused(false)}
              >
                RESUME
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowControls(true)}
              >
                CONTROLS
              </Button>
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => setPhase('ready')}
              >
                QUIT TO MENU
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* Help button bottom right */}
      <button 
        className="absolute bottom-4 right-4 w-8 h-8 bg-black/70 text-white rounded-full flex items-center justify-center text-lg font-bold border border-gray-700 hover:bg-gray-800 transition-colors"
        onClick={() => setShowControls(true)}
      >
        ?
      </button>
      
      {/* Upgrade button bottom left */}
      <button 
        className="absolute bottom-4 left-4 px-3 py-2 bg-yellow-600/90 text-white rounded-lg flex items-center justify-center font-bold border border-yellow-500 hover:bg-yellow-700 transition-colors"
        onClick={openUpgradeMenu}
      >
        <ArrowUpCircle className="mr-1 h-4 w-4" />
        <span>Upgrades</span>
        <span className="ml-2 px-1.5 py-0.5 bg-white text-yellow-800 rounded-full text-xs">{boneCount}</span>
      </button>
    </>
  );
}
