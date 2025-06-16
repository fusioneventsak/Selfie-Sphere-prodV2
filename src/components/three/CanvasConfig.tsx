// src/components/three/CanvasConfig.tsx - Optimized Canvas Configuration for Smooth Rendering
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// PERFORMANCE: Extend Three.js with optimized defaults
extend(THREE);

// CRITICAL: Optimized Canvas configuration for smooth rendering
export const optimizedCanvasConfig = {
  // PERFORMANCE: GPU acceleration and rendering optimizations
  gl: {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance" as const,
    stencil: false, // Disable stencil buffer for performance
    depth: true,
    logarithmicDepthBuffer: false, // Can cause performance issues
    preserveDrawingBuffer: false, // Better performance
    precision: "highp" as const,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: false,
  },
  
  // PERFORMANCE: Limit device pixel ratio to prevent excessive rendering load
  dpr: [1, 2] as [number, number],
  
  // PERFORMANCE: Frame rate management
  frameloop: "always" as const,
  
  // PERFORMANCE: Automatic performance scaling
  performance: {
    current: 1,
    min: 0.8, // Maintain at least 80% performance
    max: 1,
    debounce: 200, // Debounce performance adjustments
  },
  
  // CAMERA: Optimized camera settings
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 10, 25] as [number, number, number],
  },
  
  // SHADOWS: Optimized shadow settings (disable for performance if needed)
  shadows: {
    enabled: true,
    type: THREE.PCFSoftShadowMap,
    autoUpdate: true,
  },
  
  // TONE MAPPING: Optimized for photo display
  toneMapping: {
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.0,
  }
};

// PERFORMANCE: Optimized texture loader with caching
export class OptimizedTextureLoader {
  private static cache = new Map<string, THREE.Texture>();
  private static loader = new THREE.TextureLoader();
  private static loadingPromises = new Map<string, Promise<THREE.Texture>>();

  static async loadTexture(url: string): Promise<THREE.Texture> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && !cached.disposed) {
      return cached;
    }

    // Check if already loading
    const loadingPromise = this.loadingPromises.get(url);
    if (loadingPromise) {
      return loadingPromise;
    }

    // Create loading promise
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          // PERFORMANCE: Optimized texture settings
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.format = THREE.RGBAFormat;
          texture.generateMipmaps = false;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(4, texture.anisotropy); // Limit anisotropy
          texture.flipY = false; // Better performance
          
          // Cache the texture
          this.cache.set(url, texture);
          this.loadingPromises.delete(url);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(url);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  // Clean up disposed textures from cache
  static cleanCache() {
    for (const [url, texture] of this.cache.entries()) {
      if (texture.disposed) {
        this.cache.delete(url);
      }
    }
  }

  // Dispose all cached textures
  static disposeAll() {
    for (const texture of this.cache.values()) {
      if (!texture.disposed) {
        texture.dispose();
      }
    }
    this.cache.clear();
    this.loadingPromises.clear();
  }
}

// PERFORMANCE: Memory management utilities
export class MemoryManager {
  private static disposables = new Set<THREE.Object3D | THREE.Material | THREE.Texture | THREE.Geometry>();
  
  static track(object: THREE.Object3D | THREE.Material | THREE.Texture | THREE.Geometry) {
    this.disposables.add(object);
  }
  
  static dispose(object: THREE.Object3D | THREE.Material | THREE.Texture | THREE.Geometry) {
    if ('dispose' in object && typeof object.dispose === 'function') {
      object.dispose();
    }
    this.disposables.delete(object);
  }
  
  static disposeAll() {
    for (const object of this.disposables) {
      if ('dispose' in object && typeof object.dispose === 'function') {
        try {
          object.dispose();
        } catch (error) {
          console.warn('Error disposing object:', error);
        }
      }
    }
    this.disposables.clear();
  }
  
  static getMemoryUsage() {
    return {
      trackedObjects: this.disposables.size,
      textureCache: OptimizedTextureLoader.cache.size,
    };
  }
}

// PERFORMANCE: Render loop optimization
export class RenderOptimizer {
  private static frameTime = 16.67; // Target 60fps
  private static lastFrameTime = 0;
  private static skipFrames = 0;
  private static maxSkipFrames = 2;
  
  static shouldRender(currentTime: number): boolean {
    const deltaTime = currentTime - this.lastFrameTime;
    
    // If we're running slow, skip some frames
    if (deltaTime < this.frameTime && this.skipFrames < this.maxSkipFrames) {
      this.skipFrames++;
      return false;
    }
    
    this.skipFrames = 0;
    this.lastFrameTime = currentTime;
    return true;
  }
  
  static setTargetFPS(fps: number) {
    this.frameTime = 1000 / fps;
  }
}

// PERFORMANCE: Shader optimizations for photos
export const optimizedPhotoMaterial = {
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform sampler2D map;
    uniform float brightness;
    uniform float opacity;
    
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 texColor = texture2D(map, vUv);
      
      // Apply brightness
      texColor.rgb *= brightness;
      
      // Simple fog effect for depth
      float distance = length(vWorldPosition - cameraPosition);
      float fogFactor = 1.0 - clamp((distance - 50.0) / 100.0, 0.0, 1.0);
      
      gl_FragColor = vec4(texColor.rgb * fogFactor, texColor.a * opacity);
    }
  `
};

// PERFORMANCE: Geometry pooling for photos
export class GeometryPool {
  private static pools = new Map<string, THREE.BufferGeometry[]>();
  
  static getGeometry(type: string, ...args: number[]): THREE.BufferGeometry {
    const key = `${type}-${args.join('-')}`;
    let pool = this.pools.get(key);
    
    if (!pool) {
      pool = [];
      this.pools.set(key, pool);
    }
    
    if (pool.length > 0) {
      return pool.pop()!;
    }
    
    // Create new geometry
    switch (type) {
      case 'plane':
        return new THREE.PlaneGeometry(args[0], args[1]);
      case 'box':
        return new THREE.BoxGeometry(args[0], args[1], args[2]);
      default:
        return new THREE.PlaneGeometry(1, 1);
    }
  }
  
  static returnGeometry(type: string, geometry: THREE.BufferGeometry, ...args: number[]) {
    const key = `${type}-${args.join('-')}`;
    let pool = this.pools.get(key);
    
    if (!pool) {
      pool = [];
      this.pools.set(key, pool);
    }
    
    if (pool.length < 50) { // Limit pool size
      pool.push(geometry);
    } else {
      geometry.dispose();
    }
  }
  
  static disposeAll() {
    for (const pool of this.pools.values()) {
      for (const geometry of pool) {
        geometry.dispose();
      }
    }
    this.pools.clear();
  }
}

// PERFORMANCE: Level-of-detail system for photos
export class LODManager {
  static getPhotoLOD(distance: number): {
    textureSize: number;
    geometry: string;
    shadows: boolean;
  } {
    if (distance < 30) {
      return {
        textureSize: 512,
        geometry: 'plane',
        shadows: true,
      };
    } else if (distance < 60) {
      return {
        textureSize: 256,
        geometry: 'plane',
        shadows: false,
      };
    } else {
      return {
        textureSize: 128,
        geometry: 'plane',
        shadows: false,
      };
    }
  }
}

// Export all optimizations
export {
  OptimizedTextureLoader,
  MemoryManager,
  RenderOptimizer,
  GeometryPool,
  LODManager,
};