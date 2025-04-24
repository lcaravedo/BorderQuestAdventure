// Game controls
export enum Controls {
  LEFT = "left",
  RIGHT = "right",
  JUMP = "jump",
  BARK = "bark",
  DIG = "dig", 
  DASH = "dash"
}

// Game phases
export enum GamePhase {
  READY = "ready",
  SELECTING = "selecting",
  PLAYING = "playing",
  ENDED = "ended"
}

// Collectible types
export enum CollectibleType {
  BONE = "bone",
  VISA = "visa",
  SNACK = "snack"
}

// Enemy types
export enum EnemyType {
  CAT = "cat",
  DRONE = "drone",
  PATROL = "patrol"
}

// Game constants for physics, etc.
export const GRAVITY = 20;
export const JUMP_FORCE = 8;
export const MOVE_SPEED = 5;
export const DASH_MULTIPLIER = 2.0;
export const DIG_DURATION = 1000; // ms
export const BARK_DURATION = 400; // ms
export const BARK_COOLDOWN = 800; // ms
export const DASH_DURATION = 300; // ms
export const DASH_COOLDOWN = 1000; // ms

// Game settings
export const PIXEL_SIZE = 4; // For the pixel shader effect

// Level constants
export const LEVELS_PER_WORLD = 5;
export const TOTAL_WORLDS = 5;

// World names
export const WORLD_NAMES = [
  "Andes Trail 🇨🇱🇧🇴🇵🇪",
  "Northern Tropics 🇪🇨🇨🇴🇻🇪",
  "Jungle Jump 🌴🦜",
  "Borderland 🇲🇽🇺🇸",
  "The American Dream 🇺🇸⚡"
];

// Level names by world
export const LEVEL_NAMES = [
  ["Atacama (Chile)", "Uyuni (Bolivia)", "Cusco", "Lima", "Máncora (Peru)"],
  ["Guayaquil (Ecuador)", "Medellín", "Barranquilla", "Caracas", "Maracaibo"],
  ["Darién I", "Darién II", "Panamá City", "Costa Rica", "Belize"],
  ["CDMX", "Tijuana I", "Tijuana II", "Border Crossing", "Other Side"],
  ["Jailbreak", "Texas Border", "San Antonio", "Tesla Lab", "Escape"]
];
