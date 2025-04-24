import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
import { Button } from "./button";
import { useLevels } from "@/lib/stores/useLevels";
import { useGame } from "@/lib/stores/useGame";
import { getLevelTitle } from "@/lib/levelData";

export default function LevelSelect() {
  const { worlds, unlockedLevels, setCurrentLevel, setCurrentWorld, currentWorld } = useLevels();
  const { start, setPhase } = useGame() as any; // Added setPhase for typings
  const [selectedWorld, setSelectedWorld] = useState(0);
  
  // Update selected world to the highest unlocked world
  useEffect(() => {
    // Find the highest world with unlocked levels
    for (let i = worlds.length - 1; i >= 0; i--) {
      if (unlockedLevels[i] && unlockedLevels[i].length > 0) {
        setSelectedWorld(i);
        break;
      }
    }
  }, [worlds, unlockedLevels]);
  
  // Handle level selection
  const handleLevelSelect = (worldIndex: number, levelIndex: number) => {
    // Check if level is unlocked
    if (!isLevelUnlocked(worldIndex, levelIndex)) return;
    
    // Set the current level and world
    setCurrentWorld(worldIndex);
    setCurrentLevel(levelIndex);
    
    // Start the game
    start();
  };
  
  // Check if a level is unlocked
  const isLevelUnlocked = (worldIndex: number, levelIndex: number) => {
    return unlockedLevels[worldIndex]?.includes(levelIndex);
  };
  
  // Get level status class
  const getLevelStatusClass = (worldIndex: number, levelIndex: number) => {
    if (!isLevelUnlocked(worldIndex, levelIndex)) {
      return "bg-gray-700 text-gray-500 cursor-not-allowed";
    }
    return "bg-gray-800 hover:bg-yellow-700 text-white cursor-pointer";
  };
  
  // World display names
  const worldNames = [
    "Andes Trail 🇨🇱🇧🇴🇵🇪",
    "Northern Tropics 🇪🇨🇨🇴🇻🇪",
    "Jungle Jump 🌴🦜",
    "Borderland 🇲🇽🇺🇸",
    "The American Dream 🇺🇸⚡"
  ];
  
  // Levels per world (example)
  const worldLevels = [
    ["Atacama (Chile)", "Uyuni (Bolivia)", "Cusco", "Lima", "Máncora (Peru)"],
    ["Guayaquil (Ecuador)", "Medellín", "Barranquilla", "Caracas", "Maracaibo"],
    ["Darién I", "Darién II", "Panamá City", "Costa Rica", "Belize"],
    ["CDMX", "Tijuana I", "Tijuana II", "Border Crossing", "Other Side"],
    ["Jailbreak", "Texas Border", "San Antonio", "Tesla Lab", "Escape"]
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-600 to-blue-900 p-4">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-6"
      >
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">SELECT LEVEL</h1>
      </motion.div>
      
      <Card className="w-full max-w-3xl bg-gray-900/90 border-gray-700 shadow-xl">
        <CardContent className="p-4">
          <Tabs defaultValue={selectedWorld.toString()} className="w-full">
            <TabsList className="w-full mb-4 bg-gray-800">
              {worlds.map((_, index) => (
                <TabsTrigger
                  key={`world-${index}`}
                  value={index.toString()}
                  className={`flex-1 ${unlockedLevels[index]?.length ? '' : 'opacity-50 cursor-not-allowed'}`}
                  disabled={!unlockedLevels[index]?.length}
                  onClick={() => setSelectedWorld(index)}
                >
                  World {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {worlds.map((_, worldIndex) => (
              <TabsContent key={`content-${worldIndex}`} value={worldIndex.toString()}>
                <div className="mb-3 text-lg font-medium text-white">
                  {worldNames[worldIndex]}
                </div>
                
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {Array.from({ length: 5 }).map((_, levelIndex) => (
                    <motion.div
                      key={`level-${worldIndex}-${levelIndex}`}
                      variants={itemVariants}
                      onClick={() => handleLevelSelect(worldIndex, levelIndex)}
                    >
                      <div 
                        className={`p-3 rounded-lg border border-gray-700 ${getLevelStatusClass(worldIndex, levelIndex)}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {levelIndex + 1}. {worldLevels[worldIndex][levelIndex]}
                          </span>
                          {!isLevelUnlocked(worldIndex, levelIndex) && (
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">🔒</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
      
      <Button
        className="mt-6"
        variant="outline"
        onClick={() => setPhase("ready")}
      >
        Back to Menu
      </Button>
    </div>
  );
}
