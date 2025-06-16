// src/components/three/CollageScene.tsx - PERFORMANCE OPTIMIZED - Smooth Rendering Fix
import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { type SceneSettings } from '../../store/sceneStore';
import { PatternFactory } from './patterns/PatternFactory';
import { addCacheBustToUrl } from '../../lib/supabase';
import CameraMovementSystem from './CameraMovementSystem';
import { useCollageStore } from '../../store/collageStore';

type Photo = {
  id: string;
  url: string;
  collage_id?: string;
  created_at?: string;
};

type CollageSceneProps = {
  settings: SceneSettings;
  onSettingsChange?: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
};

type PhotoWithPosition = Photo & {
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  displayIndex?: number;
  slotIndex: number;
};

// OPTIMIZED: Fine-tuned smoothing for ultra smooth animation
const POSITION_SMOOTHING = 0.08; // Slightly slower for smoother movement
const ROTATION_SMOOTHING = 0.08; // Slightly slower for smoother rotation
const TELEPORT_THRESHOLD = 25; // Reduced threshold to prevent jarring teleports

// CRITICAL FIX: Enhanced SlotManager with stability improvements
class SlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private assignmentLock = false; // Prevent concurrent modifications

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (newTotal === this.totalSlots || this.assignmentLock) return;
    
    this.assignmentLock = true;
    this.totalSlots = newTotal;
    
    // Clean up slots that are out of range
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    this.rebuildAvailableSlots();
    this.assignmentLock = false;
  }

  private rebuildAvailableSlots() {
    this.availableSlots = [];
    for (let i = 0; i < this.totalSlots; i++) {
      if (!this.occupiedSlots.has(i)) {
        this.availableSlots.push(i);
      }
    }
    this.availableSlots.sort((a, b) => a - b);
  }

  // OPTIMIZED: Batch assignment with stability guarantees
  assignSlots(photos: Photo[]): Map<string, number> {
    if (this.assignmentLock || !Array.isArray(photos)) {
      return this.slotAssignments;
    }

    this.assignmentLock = true;
    const safePhotos = photos.filter(p => p && p.id);
    
    // Remove photos that no longer exist
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    // Assign slots to new photos only
    for (const photo of safePhotos) {
      if (!this.slotAssignments.has(photo.id)) {
        if (this.availableSlots.length > 0) {
          const slotIndex = this.availableSlots.shift()!;
          this.slotAssignments.set(photo.id, slotIndex);
          this.occupiedSlots.add(slotIndex);
        }
      }
    }
    
    this.rebuildAvailableSlots();
    this.assignmentLock = false;
    return this.slotAssignments;
  }
}

// OPTIMIZED: Scene content with performance improvements
const SceneContent: React.FC<{
  photos: Photo[];
  settings: SceneSettings;
  onSettingsChange?: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
}> = ({ photos, settings, onSettingsChange }) => {
  const { camera } = useThree();
  const orbitControlsRef = useRef<any>(null);
  const userInteractingRef = useRef<boolean>(false);
  const patternRef = useRef<any>(null);
  const slotManagerRef = useRef<SlotManager>(new SlotManager(settings.photoCount || 100));
  
  // PERFORMANCE: Memoized photo positions with debouncing
  const [photosWithPositions, setPhotosWithPositions] = useState<PhotoWithPosition[]>([]);
  const lastUpdateTime = useRef<number>(0);
  const positionUpdateFrame = useRef<number | null>(null);
  const lastPhotoCount = useRef<number>(settings.photoCount || 100);
  const lastPhotoIds = useRef<string>('');
  
  // CRITICAL: Prevent excessive re-renders during photo uploads
  const currentPhotoIds = useMemo(() => {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    return safePhotos.map(p => p.id).sort().join(',');
  }, [photos]);

  // Initialize pattern
  useEffect(() => {
    try {
      patternRef.current = PatternFactory.createPattern(settings.animationPattern, settings);
    } catch (error) {
      console.error('Pattern creation error:', error);
      patternRef.current = PatternFactory.createPattern('grid', settings);
    }
  }, [settings.animationPattern]);

  // PERFORMANCE OPTIMIZED: Debounced position updates
  const updatePositions = useCallback((time: number, forceUpdate = false) => {
    const now = performance.now();
    
    // Throttle updates to 60fps max, but allow force updates
    if (!forceUpdate && now - lastUpdateTime.current < 16.67) {
      return;
    }
    
    lastUpdateTime.current = now;
    
    if (positionUpdateFrame.current) {
      cancelAnimationFrame(positionUpdateFrame.current);
    }
    
    positionUpdateFrame.current = requestAnimationFrame(() => {
      try {
        if (!patternRef.current) return;
        
        const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
        const patternState = patternRef.current.generatePositions(time);
        const slotAssignments = slotManagerRef.current.assignSlots(safePhotos);
        
        const newPhotosWithPositions: PhotoWithPosition[] = [];
        
        // Add photos with their assigned positions
        for (const photo of safePhotos) {
          const slotIndex = slotAssignments.get(photo.id);
          if (slotIndex !== undefined && patternState.positions[slotIndex]) {
            newPhotosWithPositions.push({
              ...photo,
              targetPosition: patternState.positions[slotIndex] || [0, 0, 0],
              targetRotation: patternState.rotations?.[slotIndex] || [0, 0, 0],
              displayIndex: slotIndex,
              slotIndex,
            });
          }
        }
        
        // Add empty slots for remaining positions
        for (let i = 0; i < (settings.photoCount || 100); i++) {
          const hasPhoto = newPhotosWithPositions.some(p => p.slotIndex === i);
          if (!hasPhoto) {
            newPhotosWithPositions.push({
              id: `placeholder-${i}`,
              url: '',
              targetPosition: patternState.positions[i] || [0, 0, 0],
              targetRotation: patternState.rotations?.[i] || [0, 0, 0],
              displayIndex: i,
              slotIndex: i,
            });
          }
        }
        
        // Sort by slot index for consistency
        newPhotosWithPositions.sort((a, b) => a.slotIndex - b.slotIndex);
        setPhotosWithPositions(newPhotosWithPositions);
        
      } catch (error) {
        console.error('Position update error:', error);
      }
    });
  }, [photos, settings.photoCount]);

  // Handle photo count changes immediately
  useEffect(() => {
    const photoCountChanged = (settings.photoCount || 100) !== lastPhotoCount.current;
    
    if (photoCountChanged) {
      slotManagerRef.current.updateSlotCount(settings.photoCount || 100);
      lastPhotoCount.current = settings.photoCount || 100;
      updatePositions(0, true); // Force update for photo count changes
    }
  }, [settings.photoCount, updatePositions]);

  // Handle photo changes with debouncing to prevent stuttering during uploads
  useEffect(() => {
    if (currentPhotoIds !== lastPhotoIds.current) {
      lastPhotoIds.current = currentPhotoIds;
      
      // Small delay to batch multiple photo uploads
      const timeoutId = setTimeout(() => {
        updatePositions(0, false);
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentPhotoIds, updatePositions]);

  // SMOOTH: Animation frame loop with consistent timing
  useFrame((state) => {
    const time = settings.animationEnabled ? 
      state.clock.elapsedTime * ((settings.animationSpeed || 50) / 50) : 0;
    
    updatePositions(time);
  });

  // Track user interaction to prevent camera conflicts
  const handleControlStart = useCallback(() => {
    userInteractingRef.current = true;
  }, []);

  const handleControlEnd = useCallback(() => {
    userInteractingRef.current = false;
  }, []);

  return (
    <>
      {/* OPTIMIZED: OrbitControls with performance settings */}
      <OrbitControls
        ref={orbitControlsRef}
        enabled={settings.orbitControlsEnabled}
        enableDamping={true}
        dampingFactor={0.05}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={500}
        minDistance={5}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        onStart={handleControlStart}
        onEnd={handleControlEnd}
        target={[0, settings.cameraLookAtY || 0, 0]}
      />

      {/* Camera Movement System */}
      <CameraMovementSystem
        settings={settings}
        enabled={true}
        controlsRef={orbitControlsRef}
        userInteractingRef={userInteractingRef}
      />

      {/* Photo Renderer */}
      <PhotoRenderer 
        photosWithPositions={photosWithPositions}
        settings={settings}
      />

      {/* Background */}
      <BackgroundRenderer settings={settings} />

      {/* Lighting */}
      <LightingSystem settings={settings} />

      {/* Floor */}
      {settings.showFloor && (
        <FloorRenderer settings={settings} />
      )}
    </>
  );
};

// OPTIMIZED: PhotoMesh with enhanced performance
const PhotoMesh: React.FC<{
  photo: PhotoWithPosition;
  size: number;
  emptySlotColor: string;
  pattern: string;
  shouldFaceCamera: boolean;
  brightness: number;
}> = React.memo(({ photo, size, emptySlotColor, pattern, shouldFaceCamera, brightness }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // PERFORMANCE: Use refs for smooth interpolation without re-renders
  const currentPosition = useRef<THREE.Vector3>(new THREE.Vector3(...photo.targetPosition));
  const currentRotation = useRef<THREE.Euler>(new THREE.Euler(...photo.targetRotation));
  const lastCameraFaceUpdate = useRef<number>(0);

  // Initialize positions immediately
  useEffect(() => {
    currentPosition.current.set(...photo.targetPosition);
    currentRotation.current.set(...photo.targetRotation);
  }, []);

  // OPTIMIZED: Texture loading with better error handling
  useEffect(() => {
    if (!photo.url) {
      setIsLoading(false);
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();
    setIsLoading(true);
    setHasError(false);

    const handleLoad = (loadedTexture: THREE.Texture) => {
      // PERFORMANCE: Optimized texture settings
      loadedTexture.minFilter = THREE.LinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.format = THREE.RGBAFormat;
      loadedTexture.generateMipmaps = false;
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = 4; // Reduced for performance
      
      setTexture(loadedTexture);
      setIsLoading(false);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    const imageUrl = photo.url.includes('?') 
      ? `${photo.url}&t=${Date.now()}`
      : `${photo.url}?t=${Date.now()}`;

    loader.load(imageUrl, handleLoad, undefined, handleError);

    return () => {
      if (texture) {
        texture.dispose();
      }
    };
  }, [photo.url]);

  // SMOOTH: Optimized animation loop
  useFrame((state) => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const targetPosition = new THREE.Vector3(...photo.targetPosition);
    const targetRotation = new THREE.Euler(...photo.targetRotation);

    // Calculate distance for teleport detection
    const distance = currentPosition.current.distanceTo(targetPosition);
    const isTeleport = distance > TELEPORT_THRESHOLD;

    if (isTeleport) {
      // Instant teleport for large movements
      currentPosition.current.copy(targetPosition);
      currentRotation.current.copy(targetRotation);
    } else {
      // Smooth interpolation
      currentPosition.current.lerp(targetPosition, POSITION_SMOOTHING);
      currentRotation.current.x += (targetRotation.x - currentRotation.current.x) * ROTATION_SMOOTHING;
      currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * ROTATION_SMOOTHING;
      currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * ROTATION_SMOOTHING;
    }

    // Apply position
    mesh.position.copy(currentPosition.current);

    // OPTIMIZED: Camera facing with throttling
    if (shouldFaceCamera) {
      const now = state.clock.elapsedTime;
      if (now - lastCameraFaceUpdate.current > 0.05) { // Update every 50ms
        mesh.lookAt(camera.position);
        lastCameraFaceUpdate.current = now;
      }
    } else {
      mesh.rotation.copy(currentRotation.current);
    }
  });

  // OPTIMIZED: Material creation with caching
  const material = useMemo(() => {
    if (texture) {
      return new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
        color: new THREE.Color().setScalar(brightness || 1.0),
      });
    } else {
      // Empty slot material
      const canvas = document.createElement('canvas');
      canvas.width = 256; // Reduced size for performance
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = emptySlotColor;
      ctx.fillRect(0, 0, 256, 256);
      
      // Add subtle pattern for empty slots
      if (pattern === 'grid') {
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 256; i += 32) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 256);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(256, i);
          ctx.stroke();
        }
      }
      
      const emptyTexture = new THREE.CanvasTexture(canvas);
      emptyTexture.minFilter = THREE.LinearFilter;
      emptyTexture.magFilter = THREE.LinearFilter;
      
      return new THREE.MeshStandardMaterial({
        map: emptyTexture,
        transparent: false,
        side: THREE.DoubleSide,
      });
    }
  }, [texture, emptySlotColor, pattern, brightness]);

  return (
    <mesh
      ref={meshRef}
      material={material}
      castShadow
      receiveShadow
    >
      <planeGeometry args={[(size || 4.0) * (9/16), size || 4.0]} />
    </mesh>
  );
}, (prevProps, nextProps) => {
  // OPTIMIZED: Precise comparison for memo
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.url === nextProps.photo.url &&
    prevProps.size === nextProps.size &&
    prevProps.emptySlotColor === nextProps.emptySlotColor &&
    prevProps.shouldFaceCamera === nextProps.shouldFaceCamera &&
    Math.abs(prevProps.brightness - nextProps.brightness) < 0.01 &&
    prevProps.photo.targetPosition.every((pos, i) => 
      Math.abs(pos - nextProps.photo.targetPosition[i]) < 0.001
    )
  );
});

// OPTIMIZED: Photo renderer with stable keys
const PhotoRenderer: React.FC<{ 
  photosWithPositions: PhotoWithPosition[]; 
  settings: SceneSettings;
}> = React.memo(({ photosWithPositions, settings }) => {
  const shouldFaceCamera = settings.animationPattern === 'float';
  
  return (
    <group>
      {photosWithPositions.map((photo) => (
        <PhotoMesh
          key={`${photo.id}-${photo.slotIndex}`} // Stable key combining both ID and slot
          photo={photo}
          size={settings.photoSize || 4.0}
          emptySlotColor={settings.emptySlotColor || '#333333'}
          pattern={settings.animationPattern}
          shouldFaceCamera={shouldFaceCamera}
          brightness={settings.photoBrightness || 1.0}
        />
      ))}
    </group>
  );
});

// Background renderer
const BackgroundRenderer: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
  const { scene, gl } = useThree();
  
  useEffect(() => {
    try {
      if (settings.backgroundGradient) {
        scene.background = null;
        gl.setClearColor('#000000', 0);
      } else {
        scene.background = new THREE.Color(settings.backgroundColor || '#000000');
        gl.setClearColor(settings.backgroundColor || '#000000', 1);
      }
    } catch (error) {
      console.error('Background render error:', error);
    }
  }, [
    scene, 
    gl, 
    settings.backgroundColor, 
    settings.backgroundGradient,
  ]);

  return null;
});

// OPTIMIZED: Lighting system
const LightingSystem: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
  return (
    <group>
      <ambientLight 
        intensity={settings.ambientLightIntensity || 0.6}
        color={settings.ambientLightColor || '#ffffff'}
      />
      <directionalLight
        position={[settings.directionalLightX || 10, settings.directionalLightY || 10, settings.directionalLightZ || 5]}
        intensity={settings.directionalLightIntensity || 1}
        color={settings.directionalLightColor || '#ffffff'}
        castShadow={settings.shadowsEnabled}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
    </group>
  );
});

// OPTIMIZED: Floor renderer
const FloorRenderer: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
  const floorSize = settings.floorSize || 200;
  
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, settings.wallHeight || 0, 0]}
      receiveShadow={settings.shadowsEnabled}
    >
      <planeGeometry args={[floorSize, floorSize]} />
      <meshStandardMaterial 
        color={settings.floorColor || '#2a2a2a'}
        transparent={true}
        opacity={settings.floorOpacity || 0.5}
      />
    </mesh>
  );
});

// Main CollageScene component
const CollageScene: React.FC<CollageSceneProps> = ({ settings, onSettingsChange }) => {
  const { photos } = useCollageStore();
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [
            settings.cameraX || 0,
            settings.cameraY || (settings.cameraHeight || 10),
            settings.cameraZ || (settings.cameraDistance || 25)
          ],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        shadows={settings.shadowsEnabled}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance", // PERFORMANCE: Use dedicated GPU when available
          stencil: false, // PERFORMANCE: Disable stencil buffer
          depth: true,
        }}
        dpr={[1, 2]} // PERFORMANCE: Limit device pixel ratio
        performance={{ min: 0.8 }} // PERFORMANCE: Maintain 80% performance
      >
        <SceneContent
          photos={photos}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </Canvas>
    </div>
  );
};

export default CollageScene;