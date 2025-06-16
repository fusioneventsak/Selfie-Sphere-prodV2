// src/components/three/CollageScene.tsx - COMPLETE: Full-featured scene with all original functionality
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
  photos?: Photo[];
  settings: SceneSettings;
  onSettingsChange?: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
};

type PhotoWithPosition = Photo & {
  targetPosition: [number, number, number];
  targetRotation: [number, number, number];
  displayIndex?: number;
  slotIndex: number;
};

// Adjusted smoothing values for float pattern
const POSITION_SMOOTHING = 0.1;
const ROTATION_SMOOTHING = 0.1;
const TELEPORT_THRESHOLD = 30;

// ENHANCED: Stable slot assignment system that preserves slots during uploads
class SlotManager {
  private slotAssignments = new Map<string, number>();
  private occupiedSlots = new Set<number>();
  private availableSlots: number[] = [];
  private totalSlots = 0;
  private assignmentLock = false;

  constructor(totalSlots: number) {
    this.updateSlotCount(totalSlots);
  }

  updateSlotCount(newTotal: number) {
    if (newTotal === this.totalSlots) return;
    
    this.totalSlots = newTotal;
    
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (slotIndex >= newTotal) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
    this.rebuildAvailableSlots();
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

  assignSlots(photos: Photo[]): Map<string, number> {
    if (this.assignmentLock) return this.slotAssignments;
    this.assignmentLock = true;

    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    
    if (this.totalSlots !== Math.max(safePhotos.length + 50, 100)) {
      this.updateSlotCount(Math.max(safePhotos.length + 50, 100));
    }
    
    const currentPhotoIds = new Set(safePhotos.map(p => p.id));
    for (const [photoId, slotIndex] of this.slotAssignments.entries()) {
      if (!currentPhotoIds.has(photoId)) {
        this.slotAssignments.delete(photoId);
        this.occupiedSlots.delete(slotIndex);
      }
    }
    
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

// Enhanced PhotoMesh component with full functionality
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
  
  const currentPosition = useRef(new THREE.Vector3(...photo.targetPosition));
  const currentRotation = useRef(new THREE.Euler(...photo.targetRotation));
  const lastPositionRef = useRef<[number, number, number]>(photo.targetPosition);
  const isInitializedRef = useRef(false);

  // Load texture for real photos
  useEffect(() => {
    if (!photo.url) {
      setTexture(null);
      return;
    }

    const loader = new THREE.TextureLoader();

    const handleLoad = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      setTexture(tex);
    };

    const handleError = (error: any) => {
      console.error('Texture load error:', error);
      setTexture(null);
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

  // Camera facing logic
  useFrame(() => {
    if (!meshRef.current || !shouldFaceCamera) return;

    const mesh = meshRef.current;
    const currentPositionArray = mesh.position.toArray() as [number, number, number];
    
    const positionChanged = currentPositionArray.some((coord, index) => 
      Math.abs(coord - lastPositionRef.current[index]) > 0.01
    );

    if (positionChanged || !isInitializedRef.current) {
      mesh.lookAt(camera.position);
      lastPositionRef.current = currentPositionArray;
      isInitializedRef.current = true;
    }
  });

  // ENHANCED: Smoother animation with better teleport detection
  useFrame(() => {
    if (!meshRef.current) return;

    const targetPosition = new THREE.Vector3(...photo.targetPosition);
    const targetRotation = new THREE.Euler(...photo.targetRotation);

    const distance = currentPosition.current.distanceTo(targetPosition);
    const isTeleport = distance > TELEPORT_THRESHOLD;

    if (isTeleport) {
      currentPosition.current.copy(targetPosition);
      currentRotation.current.copy(targetRotation);
    } else {
      currentPosition.current.lerp(targetPosition, POSITION_SMOOTHING);
      currentRotation.current.x += (targetRotation.x - currentRotation.current.x) * ROTATION_SMOOTHING;
      currentRotation.current.y += (targetRotation.y - currentRotation.current.y) * ROTATION_SMOOTHING;
      currentRotation.current.z += (targetRotation.z - currentRotation.current.z) * ROTATION_SMOOTHING;
    }

    meshRef.current.position.copy(currentPosition.current);
    if (!shouldFaceCamera) {
      meshRef.current.rotation.copy(currentRotation.current);
    }
  });

  // Material with full functionality
  const material = useMemo(() => {
    if (texture) {
      const brightnessMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      
      brightnessMaterial.color.setScalar(brightness || 1.0);
      return brightnessMaterial;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      
      ctx.fillStyle = emptySlotColor || '#333333';
      ctx.fillRect(0, 0, 512, 512);
      
      const emptyTexture = new THREE.CanvasTexture(canvas);
      emptyTexture.colorSpace = THREE.SRGBColorSpace;
      
      return new THREE.MeshStandardMaterial({
        map: emptyTexture,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
    }
  }, [texture, brightness, emptySlotColor]);

  return (
    <mesh ref={meshRef} material={material} castShadow receiveShadow>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
});

// Animation Controller
const AnimationController: React.FC<{
  settings: SceneSettings;
  photos: Photo[];
  onPositionsUpdate: (positions: PhotoWithPosition[]) => void;
}> = React.memo(({ settings, photos, onPositionsUpdate }) => {
  const patternRef = useRef<any>(null);
  const slotManagerRef = useRef<SlotManager>(new SlotManager(settings.photoCount || 100));
  const lastUpdateTime = useRef<number>(0);
  const positionUpdateFrame = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const currentPhotoIds = useMemo(() => {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    return safePhotos.map(p => p.id).sort().join(',');
  }, [photos]);

  const updatePositions = useCallback((time: number, forceUpdate = false) => {
    const now = performance.now();
    
    if (!forceUpdate && now - lastUpdateTime.current < 16.67) {
      return;
    }
    
    lastUpdateTime.current = now;
    
    if (positionUpdateFrame.current) {
      cancelAnimationFrame(positionUpdateFrame.current);
    }
    
    positionUpdateFrame.current = requestAnimationFrame(() => {
      try {
        const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
        const safeSettings = settings || {};

        const slotAssignments = slotManagerRef.current.assignSlots(safePhotos);
        
        let patternState;
        try {
          const pattern = PatternFactory.createPattern(
            safeSettings.animationPattern || 'grid', 
            safeSettings
          );
          patternState = pattern.generatePositions(time);
        } catch (error) {
          console.error('Pattern generation error:', error);
          const positions = [];
          const rotations = [];
          for (let i = 0; i < (safeSettings.photoCount || 100); i++) {
            const x = (i % 10) * 5 - 25;
            const z = Math.floor(i / 10) * 5 - 25;
            positions.push([x, 0, z] as [number, number, number]);
            rotations.push([0, 0, 0] as [number, number, number]);
          }
          patternState = { positions, rotations };
        }
        
        const photosWithPositions: PhotoWithPosition[] = [];
        
        for (const photo of safePhotos) {
          const slotIndex = slotAssignments.get(photo.id);
          if (slotIndex !== undefined && slotIndex < (safeSettings.photoCount || 100)) {
            photosWithPositions.push({
              ...photo,
              targetPosition: patternState.positions[slotIndex] || [0, 0, 0],
              targetRotation: patternState.rotations?.[slotIndex] || [0, 0, 0],
              displayIndex: slotIndex,
              slotIndex,
            });
          }
        }
        
        for (let i = 0; i < (safeSettings.photoCount || 100); i++) {
          const hasPhoto = photosWithPositions.some(p => p.slotIndex === i);
          if (!hasPhoto) {
            photosWithPositions.push({
              id: `placeholder-${i}`,
              url: '',
              targetPosition: patternState.positions[i] || [0, 0, 0],
              targetRotation: patternState.rotations?.[i] || [0, 0, 0],
              displayIndex: i,
              slotIndex: i,
            });
          }
        }
        
        onPositionsUpdate(photosWithPositions);
      } catch (error) {
        console.error('Position update error:', error);
      }
    });
  }, [photos, settings, onPositionsUpdate]);

  useEffect(() => {
    const photoCount = settings.photoCount || 100;
    slotManagerRef.current.updateSlotCount(photoCount);
  }, [settings.photoCount]);

  useEffect(() => {
    const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
    slotManagerRef.current.assignSlots(safePhotos);
  }, [currentPhotoIds, photos]);

  useFrame((state) => {
    const time = settings.animationEnabled ? 
      state.clock.elapsedTime * ((settings.animationSpeed || 50) / 50) : 0;
    
    updatePositions(time);
  });

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return null;
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
    settings.backgroundGradientStart,
    settings.backgroundGradientEnd,
    settings.backgroundGradientAngle
  ]);

  return null;
});

// Enhanced PhotoMesh component for volumetric lighting
const VolumetricSpotlight: React.FC<{
  position: [number, number, number];
  target: [number, number, number];
  color: string;
  intensity: number;
  angle: number;
  distance: number;
  penumbra: number;
}> = ({ position, target, color, intensity, angle, distance, penumbra }) => {
  const lightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());

  useEffect(() => {
    if (targetRef.current) {
      targetRef.current.position.set(...target);
    }
  }, [target]);

  useEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current;
    }
  }, []);

  return (
    <group>
      <spotLight
        ref={lightRef}
        position={position}
        color={color}
        intensity={intensity}
        angle={angle}
        distance={distance}
        penumbra={penumbra}
        castShadow={true}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={distance}
        shadow-camera-fov={angle * 180 / Math.PI}
      />
      <primitive object={targetRef.current} />
    </group>
  );
};

// Dynamic lighting system
const DynamicLightingSystem: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const lights = useMemo(() => {
    const lightCount = Math.min(settings.spotlightCount || 1, 4);
    const lightArray = [];
    
    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const radius = 15 + Math.sin(i * 2.3) * 5;
      const height = 10 + Math.cos(i * 1.7) * 5;
      const intensityVariation = 0.8 + Math.sin(i * 3.1) * 0.2;
      
      lightArray.push({
        position: [
          Math.cos(angle) * radius,
          height,
          Math.sin(angle) * radius
        ] as [number, number, number],
        target: [0, 0, 0] as [number, number, number],
        intensityVariation,
      });
    }
    
    return lightArray;
  }, [settings.spotlightCount]);

  return (
    <group>
      {lights.map((light, index) => {
        const adjustedAngle = Math.max(0.1, Math.min(Math.PI / 3, (settings.spotlightAngle || 30) * Math.PI / 180));
        
        return (
          <group key={index}>
            <VolumetricSpotlight
              position={light.position}
              target={light.target}
              angle={adjustedAngle}
              color={settings.spotlightColor || '#ffffff'}
              intensity={(settings.spotlightIntensity || 1) * light.intensityVariation}
              distance={settings.spotlightDistance || 50}
              penumbra={settings.spotlightPenumbra || 0.5}
            />
          </group>
        );
      })}
    </group>
  );
};

// Photo renderer component
const PhotoRenderer: React.FC<{
  photosWithPositions: PhotoWithPosition[];
  settings: SceneSettings;
}> = React.memo(({ photosWithPositions, settings }) => {
  const shouldFaceCamera = settings.faceCameraEnabled || settings.animationPattern === 'float';
  
  return (
    <group>
      {photosWithPositions.map((photo) => (
        <PhotoMesh
          key={`${photo.id}-${photo.slotIndex}`}
          photo={photo}
          size={settings.photoSize || 4.0}
          emptySlotColor={settings.emptySlotColor || '#333333'}
          pattern={settings.animationPattern || 'grid'}
          shouldFaceCamera={shouldFaceCamera}
          brightness={settings.photoBrightness || 1.0}
        />
      ))}
    </group>
  );
});

// Scene lighting system
const SceneLighting: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
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

// Floor renderer
const Floor: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
  const floorSize = settings.floorSize || 200;
  
  if (!settings.floorEnabled) return null;
  
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

// Grid helper component
const Grid: React.FC<{ settings: SceneSettings }> = React.memo(({ settings }) => {
  const gridHelper = useMemo(() => {
    if (!settings.gridEnabled) return null;
    
    const helper = new THREE.GridHelper(
      settings.gridSize || 100,
      settings.gridDivisions || 30,
      settings.gridColor || '#444444',
      settings.gridColor || '#444444'
    );
    
    const material = helper.material as THREE.LineBasicMaterial;
    material.transparent = true;
    material.opacity = Math.min(settings.gridOpacity || 1.0, 1.0);
    material.color = new THREE.Color(settings.gridColor || '#444444');
    
    helper.position.y = -9.99;
    
    return helper;
  }, [settings.gridEnabled, settings.gridSize, settings.gridDivisions, settings.gridColor, settings.gridOpacity]);

  return gridHelper ? <primitive object={gridHelper} /> : null;
});

// Camera Controller component with full functionality
const CameraController: React.FC<{ settings: SceneSettings }> = ({ settings }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>();
  const userInteractingRef = useRef(false);
  const lastInteractionTimeRef = useRef(0);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cameraMovementEnabled = useRef(true);

  // Initialize camera position
  useEffect(() => {
    if (camera && controlsRef.current) {
      const initialDistance = settings.cameraDistance || 25;
      const initialHeight = settings.cameraHeight || 10;
      
      const phi = Math.PI / 3;
      const theta = 0;
      
      const x = initialDistance * Math.sin(phi) * Math.cos(theta);
      const y = initialHeight + initialDistance * Math.cos(phi) * 0.5;
      const z = initialDistance * Math.sin(phi) * Math.sin(theta);
      
      camera.position.set(x, y, z);
      
      const target = new THREE.Vector3(0, initialHeight * 0.3, 0);
      controlsRef.current.target.copy(target);
      controlsRef.current.update();
    }
  }, [camera, settings.cameraDistance, settings.cameraHeight]);

  // Enhanced user interaction detection
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleStart = () => {
      userInteractingRef.current = true;
      lastInteractionTimeRef.current = Date.now();
      cameraMovementEnabled.current = false;
      
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
        interactionTimeoutRef.current = null;
      }
    };

    const handleEnd = () => {
      lastInteractionTimeRef.current = Date.now();
      
      interactionTimeoutRef.current = setTimeout(() => {
        userInteractingRef.current = false;
        cameraMovementEnabled.current = true;
      }, 1500);
    };

    const controls = controlsRef.current;
    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
      
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };
  }, []);

  // Reset camera movement when settings change
  useEffect(() => {
    if (settings.cameraRotationEnabled) {
      cameraMovementEnabled.current = true;
      userInteractingRef.current = false;
    }
  }, [settings.cameraRotationEnabled, settings.animationPattern]);

  // Regular auto rotation
  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const shouldRotate = settings.cameraRotationEnabled && 
                        !userInteractingRef.current && 
                        settings.cameraEnabled !== false;

    if (shouldRotate) {
      try {
        const controls = controlsRef.current;
        const target = controls.target;
        
        const offset = new THREE.Vector3().copy(camera.position).sub(target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        
        const rotationSpeed = (settings.cameraRotationSpeed || 0.2) * delta;
        spherical.theta += rotationSpeed;
        
        const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(target);
        camera.position.copy(newPosition);
        
        controls.update();
      } catch (error) {
        console.error('Camera rotation error:', error);
      }
    }
  });

  return (
    <>
      <CameraMovementSystem 
        settings={settings}
        enabled={settings.cameraEnabled !== false}
        controlsRef={controlsRef}
        userInteractingRef={userInteractingRef}
      />

      <OrbitControls
        ref={controlsRef}
        enabled={settings.cameraEnabled !== false}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={200}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
        enableDamping={true}
        dampingFactor={0.05}
        zoomSpeed={1.0}
        rotateSpeed={1.0}
        panSpeed={1.0}
        autoRotate={false}
        autoRotateSpeed={0}
        target={[0, settings.wallHeight || 0, 0]}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
      />
    </>
  );
};

// Photo debugger component
const PhotoDebugger: React.FC<{ photos: Photo[] }> = ({ photos }) => {
  return null; // Placeholder for debugging functionality
};

// Main scene content component
const SceneContent: React.FC<{
  photos: Photo[];
  settings: SceneSettings;
  onSettingsChange?: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
}> = ({ photos, settings, onSettingsChange }) => {
  const [photosWithPositions, setPhotosWithPositions] = useState<PhotoWithPosition[]>([]);

  return (
    <>
      <BackgroundRenderer settings={settings} />
      <CameraController settings={settings} />
      <SceneLighting settings={settings} />
      <Floor settings={settings} />
      <Grid settings={settings} />
      
      <AnimationController
        settings={settings}
        photos={photos}
        onPositionsUpdate={setPhotosWithPositions}
      />
      
      <PhotoDebugger photos={photos} />
      
      <PhotoRenderer 
        photosWithPositions={photosWithPositions}
        settings={settings}
      />
      
      <DynamicLightingSystem settings={settings} />
    </>
  );
};

// Main CollageScene component
const CollageScene: React.FC<CollageSceneProps> = ({ photos: propPhotos, settings, onSettingsChange }) => {
  const { photos: storePhotos } = useCollageStore();
  
  // Use photos from props if provided, otherwise use store photos
  const photos = propPhotos || storePhotos || [];
  const safePhotos = Array.isArray(photos) ? photos.filter(p => p && p.id) : [];
  const safeSettings = { ...settings };

  // Background style for gradient backgrounds
  const backgroundStyle = useMemo(() => {
    if (safeSettings.backgroundGradient) {
      return {
        background: `linear-gradient(${safeSettings.backgroundGradientAngle || 45}deg, ${safeSettings.backgroundGradientStart || '#000000'}, ${safeSettings.backgroundGradientEnd || '#000000'})`
      };
    }
    return {
      background: safeSettings.backgroundColor || '#000000'
    };
  }, [
    safeSettings.backgroundGradient,
    safeSettings.backgroundColor,
    safeSettings.backgroundGradientStart,
    safeSettings.backgroundGradientEnd,
    safeSettings.backgroundGradientAngle
  ]);

  return (
    <div style={backgroundStyle} className="w-full h-full">
      <Canvas
        shadows={safeSettings.shadowsEnabled}
        camera={{ 
          position: [0, 0, 20], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true, 
          alpha: safeSettings.backgroundGradient || false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        onCreated={(state) => {
          if (safeSettings.backgroundGradient) {
            state.gl.setClearColor('#000000', 0);
          }
          state.gl.shadowMap.enabled = true;
          state.gl.shadowMap.type = THREE.PCFSoftShadowMap;
          state.gl.shadowMap.autoUpdate = true;
          state.gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }}
        performance={{ min: 0.8 }}
        linear={true}
      >
        <SceneContent
          photos={safePhotos}
          settings={safeSettings}
          onSettingsChange={onSettingsChange}
        />
      </Canvas>
    </div>
  );
};

export default CollageScene;