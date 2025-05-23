import { useEffect, useState } from "react";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useCollectibles } from "@/lib/stores/useCollectibles";
import { useLevels } from "@/lib/stores/useLevels";
import { Progress } from "./progress";
import { cn } from "@/lib/utils";

export default function GameHUD() {
  const { health, maxHealth, hearts, isPoweredUp } = usePlayer();
  const { collectibles } = useCollectibles();
  const { currentLevel, currentWorld } = useLevels();
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  
  // Calculate health percentage
  const healthPercentage = (health / maxHealth) * 100;
  
  // Effect for showing temporary messages
  useEffect(() => {
    // Example of showing a level start message
    setMessage(`World ${currentWorld + 1} - Level ${currentLevel + 1}`);
    setShowMessage(true);
    
    const timer = setTimeout(() => {
      setShowMessage(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [currentLevel, currentWorld]);
  
  // Count collectibles by type
  const countCollectibles = (type: string) => {
    return Object.values(collectibles).filter(item => item.type === type).length;
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Health Bar and Hearts */}
      <div className="absolute top-4 left-4 w-48">
        {/* Hearts display */}
        <div className="text-xs text-white mb-1 flex items-center gap-1">
          <span>HEARTS:</span>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`heart-${i}`}
                className="text-xs"
              >
                <span className={i < hearts ? "text-red-500" : "text-gray-500"}>❤️</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Health bar */}
        <div className="text-xs text-white mb-1 flex justify-between">
          <span>HEALTH</span>
          <span>{health} / {maxHealth}</span>
        </div>
        <Progress 
          value={healthPercentage} 
          className="h-3 bg-black/50"
          indicatorClassName={cn(
            "bg-green-500",
            healthPercentage < 30 && "bg-red-500",
            healthPercentage >= 30 && healthPercentage < 70 && "bg-yellow-500"
          )}
        />
        
        {/* Power-up Status */}
        <div className="mt-2 text-xs text-white flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPoweredUp ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
          <span>{isPoweredUp ? 'Chihuahua Mode' : 'Pear Head Mode'}</span>
        </div>
      </div>
      
      {/* Level Info */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded">
        <div className="text-sm font-bold">World {currentWorld + 1}</div>
        <div className="text-xs">Level {currentLevel + 1}</div>
      </div>
      
      {/* Collectibles Counter */}
      <div className="absolute top-28 left-4 bg-black/50 text-white px-3 py-1 rounded flex gap-3">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white rounded-full"></div>
          <span>{countCollectibles('bone')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>{countCollectibles('visa')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>{countCollectibles('snack')}</span>
        </div>
      </div>
      
      {/* Temporary Messages (level start, pickups, etc) */}
      {showMessage && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded text-lg font-bold">
          {message}
        </div>
      )}
      
      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 bg-black/50 text-white p-2 text-xs rounded">
        <div>Press <span className="font-bold">?</span> for controls</div>
        <div className="mt-1">Find <span className="font-bold">tequila statues</span> to save!</div>
      </div>
    </div>
  );
}
