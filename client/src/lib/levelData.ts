import { LEVEL_NAMES, WORLD_NAMES } from "./consts";

// Define a basic test level with enemies
const testLevel = {
  playerSpawn: [100, 400, 0],
  backgroundColor: "#87CEEB", // Sky blue
  groundColor: "#8B4513", // Brown
  bounds: { min: 0, max: 5000 },
  exit: [4900, 450, 0],
  platforms: [
    // Elevated platforms
    { position: [500, 350, 0], size: [200, 30, 10], color: "#8B4513" },
    { position: [800, 300, 0], size: [150, 30, 10], color: "#8B4513" },
    { position: [1200, 250, 0], size: [200, 30, 10], color: "#8B4513" },
  ],
  collectibles: [
    { position: [500, 300, 0], type: "bone" },
    { position: [800, 250, 0], type: "bone" },
    { position: [1200, 200, 0], type: "visa" },
  ],
  enemies: [
    // Cat enemy that patrols early area
    { 
      position: [500, 400, 0],
      patrolArea: [300, 700],
      type: 'cat',
      speed: 2,
      direction: 'right'
    },
    // Drone enemy that patrols middle area
    { 
      position: [1500, 250, 0],
      patrolArea: [1300, 1700],
      type: 'drone',
      speed: 3,
      direction: 'left'
    },
    // Boss at the end of the level
    { 
      position: [4500, 400, 0],
      patrolArea: [4300, 4700],
      type: 'cat',
      speed: 1.5,
      isBoss: true,
      direction: 'left'
    }
  ]
};

// Default empty level as fallback
const defaultLevel = {
  playerSpawn: [0, 1, 0],
  platforms: [
    { position: [0, 0, 0], size: [10, 1, 5], color: "#8B4513" }
  ],
  bounds: { min: -50, max: 50 },
  backgroundColor: "#87CEEB",
  groundColor: "#8B4513",
  exit: [10, 1, 0],
  enemies: [
    { 
      position: [25, 5, 0],
      patrolArea: [20, 30],
      type: 'cat',
      speed: 1.2,
      direction: 'right'
    }
  ]
};

// Single world with test level
const worlds = [
  [testLevel] // World 0, Level 0
];

// Get level data based on world and level index
export function getLevelData(worldIndex: number, levelIndex: number): any {
  // Get levels for specific world
  const worldLevels = worlds[worldIndex] || [];
  
  // Return level data or default empty level
  const levelData = worldLevels[levelIndex] || defaultLevel;
  
  // Ensure enemies are properly defined
  if (!levelData.enemies || levelData.enemies.length === 0) {
    // Add some basic enemies if none exist
    levelData.enemies = [
      // Cat enemy that patrols
      { 
        position: [500, 300, 0], // Start 500px to the right
        patrolArea: [300, 700],  // Patrol between x=300 and x=700
        type: 'cat',
        speed: 2,
        direction: 'right'
      },
      // Boss at the end of the level
      { 
        position: [4500, 300, 0], // Near end of level
        patrolArea: [4300, 4700],
        type: 'cat',
        speed: 1.5,
        isBoss: true,
        direction: 'left'
      }
    ];
  }
  
  return levelData;
}

// Get level title (name) based on world and level index
export function getLevelTitle(worldIndex: number, levelIndex: number): string {
  if (worldIndex >= 0 && worldIndex < WORLD_NAMES.length &&
      levelIndex >= 0 && levelIndex < LEVEL_NAMES[worldIndex].length) {
    return LEVEL_NAMES[worldIndex][levelIndex];
  }
  return "Unknown Level";
}