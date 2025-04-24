import { LEVEL_NAMES, WORLD_NAMES } from "./consts";

// Get level data based on world and level index
export function getLevelData(worldIndex: number, levelIndex: number): any {
  // Get levels for specific world
  const worldLevels = levels[worldIndex] || [];
  
  // Return level data or default empty level
  return worldLevels[levelIndex] || defaultLevel;
}

// Get level title (name) based on world and level index
export function getLevelTitle(worldIndex: number, levelIndex: number): string {
  if (worldIndex >= 0 && worldIndex < WORLD_NAMES.length &&
      levelIndex >= 0 && levelIndex < LEVEL_NAMES[worldIndex].length) {
    return LEVEL_NAMES[worldIndex][levelIndex];
  }
  return "Unknown Level";
}

// Default empty level as fallback
const defaultLevel = {
  playerSpawn: [0, 1, 0],
  platforms: [
    { position: [0, 0, 0], size: [10, 1, 5], color: "#8B4513" }
  ],
  bounds: { min: -50, max: 50 },
  backgroundColor: "#87CEEB",
  groundColor: "#8B4513",
  exit: [10, 1, 0]
};

// Level data for world 1 (Andes Trail)
const world1Levels = [
  // Level 1-1: Atacama Desert (Chile)
  {
    playerSpawn: [0, 1, 0],
    backgroundColor: "#FFB74D", // Desert orange-yellow
    groundColor: "#E5A249",     // Sandy ground
    bounds: { min: -20, max: 40 },
    exit: [35, 1, 0],
    platforms: [
      // Main ground platforms
      { position: [0, 0, 0], size: [10, 1, 5], color: "#E5A249" },
      { position: [10, 0, 0], size: [10, 1, 5], color: "#E5A249" },
      { position: [20, 0, 0], size: [10, 1, 5], color: "#E5A249" },
      { position: [30, 0, 0], size: [10, 1, 5], color: "#E5A249" },
      
      // Elevated platforms
      { position: [5, 2, 0], size: [3, 0.5, 3], color: "#D4945A" },
      { position: [12, 3, 0], size: [2, 0.5, 3], color: "#D4945A" },
      { position: [18, 4, 0], size: [2, 0.5, 3], color: "#D4945A" },
      { position: [25, 3, 0], size: [3, 0.5, 3], color: "#D4945A" },
      { position: [32, 2, 0], size: [2, 0.5, 3], color: "#D4945A" },
    ],
    decorations: [
      // Cacti
      { position: [3, 1, 1], type: "cylinder", scale: [0.3, 1.5, 0.3], color: "#66AA66" },
      { position: [15, 1, 1], type: "cylinder", scale: [0.3, 2, 0.3], color: "#66AA66" },
      { position: [28, 1, 1], type: "cylinder", scale: [0.3, 1.8, 0.3], color: "#66AA66" },
      
      // Rocks
      { position: [8, 0.8, 0], type: "box", scale: [1, 0.6, 0.8], color: "#AAAAAA" },
      { position: [22, 0.8, 0], type: "box", scale: [1.2, 0.8, 1], color: "#888888" },
    ],
    collectibles: [
      { position: [5, 3, 0], type: "bone" },
      { position: [12, 4, 0], type: "bone" },
      { position: [18, 5, 0], type: "visa" },
      { position: [25, 4, 0], type: "bone" },
      { position: [32, 3, 0], type: "snack" },
    ],
    enemies: [
      { position: [10, 0.5, 0], patrolArea: [8, 15], type: "cat", speed: 1.5 },
      { position: [20, 0.5, 0], patrolArea: [15, 25], type: "cat", speed: 1.8 },
      { position: [30, 0.5, 0], patrolArea: [25, 35], type: "cat", speed: 2 },
    ]
  },
  
  // Level 1-2: Uyuni Salt Flats (Bolivia)
  {
    playerSpawn: [0, 1, 0],
    backgroundColor: "#87CEEB", // Sky blue
    groundColor: "#FFFFFF",     // White salt
    bounds: { min: -20, max: 45 },
    exit: [40, 1, 0],
    platforms: [
      // Main ground platforms - white salt flats
      { position: [0, 0, 0], size: [10, 1, 5], color: "#FFFFFF" },
      { position: [10, 0, 0], size: [10, 1, 5], color: "#FFFFFF" },
      { position: [20, 0, 0], size: [10, 1, 5], color: "#FFFFFF" },
      { position: [30, 0, 0], size: [10, 1, 5], color: "#FFFFFF" },
      { position: [40, 0, 0], size: [10, 1, 5], color: "#FFFFFF" },
      
      // Salt formations
      { position: [8, 1.5, 0], size: [3, 1, 3], color: "#EEEEEE" },
      { position: [15, 2, 0], size: [2, 1.5, 2], color: "#EEEEEE" },
      { position: [23, 1.5, 0], size: [2, 1, 2], color: "#EEEEEE" },
      { position: [30, 2.5, 0], size: [3, 2, 3], color: "#EEEEEE" },
      
      // Moving platform (salt raft)
      { position: [35, 2, 0], size: [3, 0.5, 3], color: "#CCFFFF", moving: true, movementAxis: 'y', movementRange: 1, movementSpeed: 0.8 },
    ],
    decorations: [
      // Salt crystals
      { position: [5, 1, 1], type: "box", scale: [0.5, 1, 0.5], color: "#FFFFFF" },
      { position: [12, 1, 1], type: "box", scale: [0.6, 0.8, 0.6], color: "#FFFFFF" },
      { position: [19, 1, 1], type: "box", scale: [0.4, 1.2, 0.4], color: "#FFFFFF" },
      { position: [27, 1, 1], type: "box", scale: [0.5, 0.9, 0.5], color: "#FFFFFF" },
      { position: [38, 1, 1], type: "box", scale: [0.7, 1.1, 0.7], color: "#FFFFFF" },
    ],
    collectibles: [
      { position: [8, 3, 0], type: "bone" },
      { position: [15, 4, 0], type: "visa" },
      { position: [23, 3, 0], type: "bone" },
      { position: [30, 5, 0], type: "snack" },
      { position: [35, 4, 0], type: "bone" },
    ],
    enemies: [
      { position: [12, 0.5, 0], patrolArea: [10, 15], type: "cat", speed: 1.6 },
      { position: [25, 0.5, 0], patrolArea: [20, 28], type: "cat", speed: 1.8 },
      { position: [37, 0.5, 0], patrolArea: [32, 40], type: "drone", speed: 1.2 },
    ]
  }
];

// Level data organized by worlds
const levels = [
  world1Levels,
  // Additional worlds would be added here
];
