import * as THREE from "three";

// Create a post-processing effect for pixelation to achieve 8-bit aesthetic
export function PixelShader(scene: THREE.Scene, options = { pixelSize: 4 }) {
  const composer = new THREE.EffectComposer(
    new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    })
  );
  
  // Create a shader for pixelation
  const pixelationShader = {
    uniforms: {
      "tDiffuse": { value: null },
      "resolution": { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      "pixelSize": { value: options.pixelSize }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float pixelSize;
      varying vec2 vUv;
      
      void main() {
        vec2 dxy = pixelSize / resolution;
        vec2 coord = dxy * floor(vUv / dxy);
        gl_FragColor = texture2D(tDiffuse, coord);
        
        // Add some color banding for more 8-bit feel
        gl_FragColor.rgb = floor(gl_FragColor.rgb * 8.0) / 8.0;
      }
    `
  };
  
  // Since we're in a React environment, we'll rely on the built-in effect composer
  // from Three.js rather than adding a shader pass here
  
  // But we can return a cleanup function for when components unmount
  return () => {
    composer.dispose();
  };
}

// Alternative approach using post-processing material
export const createPixelMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      "tDiffuse": { value: null },
      "resolution": { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      "pixelSize": { value: 4.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float pixelSize;
      varying vec2 vUv;
      
      void main() {
        vec2 dxy = pixelSize / resolution;
        vec2 coord = dxy * floor(vUv / dxy);
        gl_FragColor = texture2D(tDiffuse, coord);
        
        // Add some color banding for more 8-bit feel
        gl_FragColor.rgb = floor(gl_FragColor.rgb * 8.0) / 8.0;
      }
    `
  });
};
