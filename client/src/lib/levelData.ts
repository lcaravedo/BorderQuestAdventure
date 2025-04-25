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
    ],
    hazards: [
      // Sandstorm hazards
      { 
        position: [14, 1, 0], 
        type: "sandstorm", 
        size: [3, 3, 3], 
        triggerRadius: 2,
        damage: 1
      },
      { 
        position: [28, 1, 0], 
        type: "sandstorm", 
        size: [4, 4, 4], 
        triggerRadius: 2.5,
        damage: 1
      },
      // Patrol drone
      {
        position: [22, 5, 0],
        type: "drone",
        patrolArea: [15, 30],
        patrolSpeed: 1.5,
        triggerRadius: 1.5,
        damage: 1
      }
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
    ],
    hazards: [
      // Spotlight security system
      {
        position: [18, 0, 0],
        type: "spotlight",
        size: [1, 8, 1],
        triggerRadius: 4,
        damage: 1
      },
      {
        position: [32, 0, 0],
        type: "spotlight",
        size: [1, 8, 1],
        triggerRadius: 4,
        damage: 1
      },
      // Jungle trap (out of place in salt flats, but for testing)
      {
        position: [25, 0.1, 0],
        type: "jungle_trap",
        size: [2, 0.5, 2],
        triggerRadius: 1.2,
        damage: 2
      }
    ]
  }
];

// Level data for world 2 (Northern Tropics)
const world2Levels = [
  // Level 2-1: Guayaquil (Ecuador)
  {
    playerSpawn: [0, 1, 0],
    backgroundColor: "#2E8B57", // Forest green
    groundColor: "#3A5F0B",     // Jungle floor
    bounds: { min: -20, max: 45 },
    exit: [40, 1, 0],
    platforms: [
      // Main ground platforms - jungle floor
      { position: [0, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [10, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [20, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [30, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [40, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      
      // Tree branches and elevations
      { position: [8, 2, 0], size: [3, 0.5, 3], color: "#5D4037" },
      { position: [16, 3, 0], size: [4, 0.5, 3], color: "#5D4037" },
      { position: [24, 4, 0], size: [3, 0.5, 3], color: "#5D4037" },
      { position: [32, 5, 0], size: [4, 0.5, 3], color: "#5D4037" },
      
      // Moving platform (swinging vine)
      { position: [28, 3, 0], size: [2, 0.3, 2], color: "#33691E", moving: true, movementAxis: 'x', movementRange: 4, movementSpeed: 2 },
    ],
    decorations: [
      // Trees and vegetation
      { position: [5, 3, 1], type: "cylinder", scale: [0.5, 6, 0.5], color: "#5D4037" },
      { position: [15, 3, 1], type: "cylinder", scale: [0.6, 8, 0.6], color: "#5D4037" },
      { position: [25, 3, 1], type: "cylinder", scale: [0.5, 7, 0.5], color: "#5D4037" },
      { position: [35, 3, 1], type: "cylinder", scale: [0.7, 9, 0.7], color: "#5D4037" },
      
      // Bushes
      { position: [7, 0.8, 0], type: "sphere", scale: [1.2, 0.7, 1.2], color: "#2E7D32" },
      { position: [13, 0.8, 0], type: "sphere", scale: [1, 0.6, 1], color: "#2E7D32" },
      { position: [22, 0.8, 0], type: "sphere", scale: [1.3, 0.8, 1.3], color: "#2E7D32" },
      { position: [33, 0.8, 0], type: "sphere", scale: [1.1, 0.7, 1.1], color: "#2E7D32" },
    ],
    collectibles: [
      { position: [8, 3, 0], type: "bone" },
      { position: [16, 4, 0], type: "bone" },
      { position: [24, 5, 0], type: "visa" },
      { position: [32, 6, 0], type: "snack" },
      { position: [38, 1, 0], type: "bone" },
    ],
    enemies: [
      { position: [12, 0.5, 0], patrolArea: [10, 18], type: "snake", speed: 1.2 },
      { position: [22, 0.5, 0], patrolArea: [18, 25], type: "frog", speed: 1.5 },
      { position: [34, 0.5, 0], patrolArea: [30, 38], type: "snake", speed: 1.4 },
    ],
    hazards: [
      // Jungle traps
      {
        position: [10, 0.1, 0],
        type: "jungle_trap",
        size: [2, 0.5, 2],
        triggerRadius: 1.2,
        damage: 2
      },
      {
        position: [20, 0.1, 0],
        type: "jungle_trap",
        size: [2, 0.5, 2],
        triggerRadius: 1.2,
        damage: 2
      },
      {
        position: [30, 0.1, 0],
        type: "jungle_trap",
        size: [2, 0.5, 2],
        triggerRadius: 1.2,
        damage: 2
      },
      // Patrol drones
      {
        position: [15, 6, 0],
        type: "drone",
        patrolArea: [10, 35],
        patrolSpeed: 1.8,
        triggerRadius: 1.5,
        damage: 1
      }
    ]
  },
  // Level 2-2 placeholder
  {
    playerSpawn: [0, 1, 0],
    backgroundColor: "#4682B4", // Steel Blue
    groundColor: "#3A5F0B",     // Jungle floor
    bounds: { min: -20, max: 40 },
    exit: [35, 1, 0],
    platforms: [
      { position: [0, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [10, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [20, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
      { position: [30, 0, 0], size: [10, 1, 5], color: "#3A5F0B" },
    ],
    enemies: [
      { position: [10, 0.5, 0], patrolArea: [8, 15], type: "cat", speed: 1.5 },
    ]
  }
];

// Level data for world 3 (Borderland)
const world3Levels = [
  // Level 3-1: Border Crossing
  {
    playerSpawn: [0, 1, 0],
    backgroundColor: "#B0C4DE", // Light steel blue (border sky)
    groundColor: "#A0522D",     // Border desert ground
    bounds: { min: -20, max: 50 },
    exit: [45, 1, 0],
    platforms: [
      // Main ground platforms - border desert
      { position: [0, 0, 0], size: [10, 1, 5], color: "#A0522D" },
      { position: [10, 0, 0], size: [10, 1, 5], color: "#A0522D" },
      { position: [20, 0, 0], size: [10, 1, 5], color: "#A0522D" },
      { position: [30, 0, 0], size: [10, 1, 5], color: "#A0522D" },
      { position: [40, 0, 0], size: [10, 1, 5], color: "#A0522D" },
      
      // Border wall sections and platforms
      { position: [25, 0, 0], size: [2, 6, 5], color: "#808080" }, // Border wall
      { position: [15, 2, 0], size: [4, 0.5, 3], color: "#696969" }, // Platform
      { position: [33, 3, 0], size: [3, 0.5, 3], color: "#696969" }, // Platform
      { position: [42, 2, 0], size: [4, 0.5, 3], color: "#696969" }, // Platform
      
      // Checkpoint building
      { position: [25, 3, 0], size: [4, 1, 4], color: "#D3D3D3" },
    ],
    decorations: [
      // Border fence sections
      { position: [5, 1, 1], type: "box", scale: [0.2, 2, 8], color: "#A9A9A9" },
      { position: [15, 1, 1], type: "box", scale: [0.2, 2, 8], color: "#A9A9A9" },
      { position: [35, 1, 1], type: "box", scale: [0.2, 2, 8], color: "#A9A9A9" },
      
      // Cacti and desert vegetation
      { position: [8, 0.8, 0], type: "cylinder", scale: [0.3, 1.5, 0.3], color: "#2E8B57" },
      { position: [12, 0.8, 0], type: "cylinder", scale: [0.4, 2, 0.4], color: "#2E8B57" },
      { position: [38, 0.8, 0], type: "cylinder", scale: [0.3, 1.8, 0.3], color: "#2E8B57" },
    ],
    collectibles: [
      { position: [15, 3, 0], type: "bone" },
      { position: [25, 4.5, 0], type: "visa" }, // Visa at border checkpoint
      { position: [33, 4, 0], type: "bone" },
      { position: [42, 3, 0], type: "snack" },
    ],
    enemies: [
      { position: [8, 0.5, 0], patrolArea: [5, 12], type: "drone", speed: 1.5 }, // Border patrol drone
      { position: [18, 0.5, 0], patrolArea: [15, 22], type: "cat", speed: 1.8 }, // Border patrol "cat"
      { position: [32, 0.5, 0], patrolArea: [29, 35], type: "cat", speed: 2 }, // Border patrol "cat"
      { position: [40, 0.5, 0], patrolArea: [35, 45], type: "drone", speed: 1.5 }, // Border patrol drone
    ],
    hazards: [
      // Spotlights at border
      {
        position: [20, 0, 0],
        type: "spotlight",
        size: [1, 10, 1],
        triggerRadius: 5,
        damage: 1
      },
      {
        position: [30, 0, 0],
        type: "spotlight",
        size: [1, 10, 1],
        triggerRadius: 5,
        damage: 1
      },
      // Patrol drones
      {
        position: [10, 8, 0],
        type: "drone",
        patrolArea: [5, 45],
        patrolSpeed: 2.5,
        triggerRadius: 2,
        damage: 2
      },
      {
        position: [25, 10, 0],
        type: "drone",
        patrolArea: [15, 35],
        patrolSpeed: 2,
        triggerRadius: 2,
        damage: 2
      }
    ]
  }
];

// Level data organized by worlds
const levels = [
  world1Levels,
  world2Levels,
  world3Levels
  // Additional worlds would be added here
];
