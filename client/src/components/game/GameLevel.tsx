import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import Character from "./Character";
import Enemy from "./Enemy";
import Platforms from "./Platforms";
import Collectible from "./Collectible";
import EnvironmentalHazard from "./EnvironmentalHazard";
import { usePlayer } from "@/lib/stores/usePlayer";
import { useLevels } from "@/lib/stores/useLevels";
import { useCollectibles } from "@/lib/stores/useCollectibles";
import { getLevelData } from "@/lib/levelData";
import { PixelShader } from "./PixelShader";

export default function GameLevel() {
  const { scene } = useThree();
  const { currentLevel, currentWorld } = useLevels();
  const { resetPlayer, setPlayerSpawn } = usePlayer();
  const { resetCollectibles } = useCollectibles();
  const [levelData, setLevelData] = useState<any>(null);
  
  // Pixel effect
  useEffect(() => {
    return PixelShader(scene, { pixelSize: 4 });
  }, [scene]);
  
  // Load level data when level changes
  useEffect(() => {
    try {
      console.log(`Loading level: World ${currentWorld}, Level ${currentLevel}`);
      
      // Reset player and collectibles
      resetPlayer();
      resetCollectibles();
      
      // Get level data for current level
      const data = getLevelData(currentWorld, currentLevel);
      console.log("Level data loaded:", data ? "success" : "failed");
      setLevelData(data);
      
      // Set player spawn point from level data
      if (data?.playerSpawn) {
        setPlayerSpawn(data.playerSpawn);
      }
      
      // Set level background color
      if (data?.backgroundColor) {
        scene.background = new THREE.Color(data.backgroundColor);
      }
    } catch (error) {
      console.error("Error loading level:", error);
      // Fallback to default level if there's an error
      setLevelData({
        playerSpawn: [0, 1, 0],
        platforms: [{ position: [0, 0, 0], size: [10, 1, 5], color: "#8B4513" }],
        bounds: { min: -50, max: 50 },
        backgroundColor: "#87CEEB",
        groundColor: "#8B4513",
        exit: [10, 1, 0]
      });
    }
  }, [currentLevel, currentWorld, resetPlayer, resetCollectibles, setPlayerSpawn, scene]);
  
  // If level data isn't loaded yet, show loading state
  if (!levelData) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="gray" />
      </mesh>
    );
  }
  
  return (
    <>
      {/* Character */}
      <Character position={levelData.playerSpawn || [0, 1, 0]} />
      
      {/* Environment */}
      <Platforms platforms={levelData.platforms} />
      
      {/* Ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]} 
        receiveShadow
      >
        <planeGeometry args={[200, 50]} />
        <meshStandardMaterial 
          color={levelData.groundColor || "#8B4513"} 
          roughness={0.8}
        />
      </mesh>
      
      {/* Level decorations - simple shapes to represent environment elements */}
      {levelData.decorations?.map((deco: any, index: number) => (
        <mesh 
          key={`deco-${index}`} 
          position={[deco.position[0], deco.position[1], deco.position[2]]}
          scale={deco.scale || [1, 1, 1]}
        >
          {deco.type === 'box' ? (
            <boxGeometry args={[1, 1, 1]} />
          ) : deco.type === 'cylinder' ? (
            <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
          ) : (
            <sphereGeometry args={[0.5, 8, 8]} />
          )}
          <meshStandardMaterial color={deco.color || "#666666"} />
        </mesh>
      ))}
      
      {/* Enemies */}
      {levelData.enemies?.map((enemy: any, index: number) => (
        <Enemy
          key={`enemy-${index}`}
          position={enemy.position}
          patrolArea={enemy.patrolArea}
          type={enemy.type || 'cat'}
          speed={enemy.speed || 1.5}
        />
      ))}
      
      {/* Collectibles */}
      {levelData.collectibles?.map((collectible: any, index: number) => (
        <Collectible
          key={`collect-${index}`}
          id={`${currentWorld}-${currentLevel}-${index}`}
          position={collectible.position}
          type={collectible.type}
        />
      ))}
      
      {/* Environmental Hazards */}
      {levelData.hazards?.map((hazard: any, index: number) => (
        <EnvironmentalHazard
          key={`hazard-${index}`}
          position={hazard.position}
          type={hazard.type}
          size={hazard.size}
          rotation={hazard.rotation}
          triggerRadius={hazard.triggerRadius}
          damage={hazard.damage}
          patrolArea={hazard.patrolArea}
          patrolSpeed={hazard.patrolSpeed}
        />
      ))}
      
      {/* Level bounds - invisible walls */}
      <mesh position={[levelData.bounds?.min || -50, 5, 0]} visible={false}>
        <boxGeometry args={[1, 20, 10]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      
      <mesh position={[levelData.bounds?.max || 50, 5, 0]} visible={false}>
        <boxGeometry args={[1, 20, 10]} />
        <meshBasicMaterial color="red" wireframe />
      </mesh>
      
      {/* Goal/Exit portal */}
      {levelData.exit && (
        <group position={[levelData.exit[0], levelData.exit[1], levelData.exit[2]]}>
          <mesh>
            <boxGeometry args={[1.5, 2.5, 0.5]} />
            <meshBasicMaterial color="#4422FF" transparent opacity={0.6} />
          </mesh>
          <pointLight color="#4422FF" intensity={2} distance={5} />
        </group>
      )}
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
    </>
  );
}
