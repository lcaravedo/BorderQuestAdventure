import * as THREE from "three";

/**
 * Check for collision between two box-shaped objects
 */
export function checkBoxCollision(
  box1Pos: THREE.Vector3, 
  box1Size: THREE.Vector3,
  box2Pos: THREE.Vector3,
  box2Size: THREE.Vector3
): boolean {
  return (
    box1Pos.x - box1Size.x / 2 < box2Pos.x + box2Size.x / 2 &&
    box1Pos.x + box1Size.x / 2 > box2Pos.x - box2Size.x / 2 &&
    box1Pos.y - box1Size.y / 2 < box2Pos.y + box2Size.y / 2 &&
    box1Pos.y + box1Size.y / 2 > box2Pos.y - box2Size.y / 2 &&
    box1Pos.z - box1Size.z / 2 < box2Pos.z + box2Size.z / 2 &&
    box1Pos.z + box1Size.z / 2 > box2Pos.z - box2Size.z / 2
  );
}

/**
 * Calculate the distance between two points
 */
export function distance(point1: THREE.Vector3, point2: THREE.Vector3): number {
  return point1.distanceTo(point2);
}

/**
 * Calculate a point on a parabolic jump arc
 */
export function calculateJumpPosition(
  startPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  height: number,
  progress: number
): THREE.Vector3 {
  // Linear interpolation for x and z
  const x = startPos.x + (targetPos.x - startPos.x) * progress;
  const z = startPos.z + (targetPos.z - startPos.z) * progress;
  
  // Parabolic arc for y (height)
  // y = 4 * h * t * (1 - t) creates a parabola where h is the max height
  const y = startPos.y + (targetPos.y - startPos.y) * progress + 
            4 * height * progress * (1 - progress);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Get a random integer between min and max (inclusive)
 */
export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a point is within rectangular bounds
 */
export function isWithinBounds(
  point: THREE.Vector3,
  minBound: THREE.Vector3,
  maxBound: THREE.Vector3
): boolean {
  return (
    point.x >= minBound.x && point.x <= maxBound.x &&
    point.y >= minBound.y && point.y <= maxBound.y &&
    point.z >= minBound.z && point.z <= maxBound.z
  );
}

/**
 * Create 8-bit pixel art texture from text
 */
export function createTextTexture(
  text: string,
  fontSize: number = 24,
  color: string = "#ffffff",
  bgColor: string = "transparent"
): THREE.Texture {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context");
  
  // Set canvas size
  canvas.width = 256;
  canvas.height = 64;
  
  // Fill background if provided
  if (bgColor !== "transparent") {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw text
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px "Press Start 2P", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  
  return texture;
}

/**
 * Apply pixelation effect to canvas
 */
export function pixelateCanvas(canvas: HTMLCanvasElement, pixelSize: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  // Get canvas data
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Create a new canvas to work with
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return;
  
  // Set size of temporary canvas
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  
  // Draw the original image on temp canvas
  tempCtx.putImageData(imgData, 0, 0);
  
  // Clear original canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw pixelated version
  for (let y = 0; y < canvas.height; y += pixelSize) {
    for (let x = 0; x < canvas.width; x += pixelSize) {
      // Get the color of one pixel
      const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
      
      // Use that color to fill a rectangle of pixelSize
      ctx.fillStyle = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  }
}
