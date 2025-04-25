import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import { Switch } from "./switch";
import { Label } from "./label";
import { useGame } from "@/lib/stores/useGame";
import { useAudio } from "@/lib/stores/useAudio";
import { useLevels } from "@/lib/stores/useLevels";

interface GameMenuProps {
  showGameOver?: boolean;
}

export default function GameMenu({ showGameOver = false }: GameMenuProps) {
  const { start, setPhase } = useGame() as any; // Added setPhase
  const { toggleMute, isMuted } = useAudio();
  const { resetProgress } = useLevels();
  const [showCredits, setShowCredits] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  // Animation variants for title
  const titleVariants = {
    initial: { y: -50, opacity: 0 },
    animate: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };
  
  // Animation variants for buttons
  const buttonVariants = {
    initial: { x: -20, opacity: 0 },
    animate: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: 0.1 * i, duration: 0.3 },
    }),
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-500 to-sky-800 p-4">
      {showGameOver ? (
        /* Game Over Screen */
        <Card className="max-w-md w-full bg-black/80 border-red-900 shadow-xl">
          <CardContent className="p-6 flex flex-col items-center">
            <motion.h1 
              className="text-4xl font-bold text-red-500 mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              GAME OVER
            </motion.h1>
            
            <p className="text-white mb-6 text-center">Your chihuahua's journey has come to an early end.</p>
            
            <div className="flex flex-col w-full gap-3">
              <Button 
                variant="destructive"
                className="w-full"
                onClick={() => start()}
              >
                TRY AGAIN
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-white border-gray-600"
                onClick={() => resetProgress()}
              >
                RESET ALL PROGRESS
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Main Menu */
        <>
          <motion.div
            className="text-center mb-8"
            initial="initial"
            animate="animate"
            variants={titleVariants}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] mb-2">
              KAYA
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
              QUEST
            </h2>
            <p className="text-white text-lg mt-2">8-Bit Freedom Adventure</p>
          </motion.div>
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </div>
          
          <Card className="max-w-md w-full bg-black/70 border-gray-700 shadow-xl">
            <CardContent className="p-6">
              <div className="flex flex-col gap-3">
                <motion.div
                  custom={0}
                  initial="initial"
                  animate="animate"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="default" 
                    className="w-full py-6 text-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-4 border-yellow-300"
                    onClick={() => {
                      console.log("PLAY button clicked!");
                      setPhase("selecting");
                    }}
                  >
                    PLAY GAME
                  </Button>
                </motion.div>
                
                <motion.div
                  custom={1}
                  initial="initial"
                  animate="animate"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="outline" 
                    className="w-full text-white border-gray-600"
                    onClick={() => setShowControls(true)}
                  >
                    CONTROLS
                  </Button>
                </motion.div>
                
                <motion.div
                  custom={2}
                  initial="initial"
                  animate="animate"
                  variants={buttonVariants}
                >
                  <div className="flex items-center justify-between px-2 py-1">
                    <Label htmlFor="sound-toggle" className="text-white">Sound</Label>
                    <Switch
                      id="sound-toggle"
                      checked={!isMuted}
                      onCheckedChange={() => toggleMute()}
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  custom={3}
                  initial="initial"
                  animate="animate"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="outline" 
                    className="w-full text-white border-gray-600"
                    onClick={() => setShowCredits(true)}
                  >
                    CREDITS
                  </Button>
                </motion.div>
                
                <motion.div
                  custom={4}
                  initial="initial"
                  animate="animate"
                  variants={buttonVariants}
                >
                  <Button 
                    variant="outline" 
                    className="w-full text-white border-gray-600"
                    onClick={() => resetProgress()}
                  >
                    RESET PROGRESS
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
          
          {/* Pixel art footer */}
          <div className="mt-16 flex justify-center">
            <div className="h-12 w-full max-w-md bg-green-900"></div>
          </div>
          
          {/* Controls modal */}
          {showControls && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
              <Card className="max-w-md w-full bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">CONTROLS</h2>
                  <div className="text-gray-300 space-y-3">
                    <div className="grid grid-cols-2 gap-2 border-b border-gray-700 pb-2">
                      <div className="font-bold">Movement:</div>
                      <div>Arrow Keys or A/D</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-gray-700 pb-2">
                      <div className="font-bold">Jump:</div>
                      <div>Space, W, or Up Arrow</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-gray-700 pb-2">
                      <div className="font-bold">Bark:</div>
                      <div>J Key</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-b border-gray-700 pb-2">
                      <div className="font-bold">Dig:</div>
                      <div>K Key</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <div className="font-bold">Dash:</div>
                      <div>L Key or Left Shift</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-white border-gray-600"
                    onClick={() => setShowControls(false)}
                  >
                    CLOSE
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Credits modal */}
          {showCredits && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
              <Card className="max-w-md w-full bg-gray-900 border-gray-700">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">CREDITS</h2>
                  <div className="text-gray-300 space-y-4">
                    <p>Kaya Quest: 8-Bit Freedom Adventure</p>
                    <p>A satirical game about immigration, travel, and unexpected career paths.</p>
                    <p>Created with React, Three.js, and shadcn/ui.</p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 text-white border-gray-600"
                    onClick={() => setShowCredits(false)}
                  >
                    CLOSE
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
