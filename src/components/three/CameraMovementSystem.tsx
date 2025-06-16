// src/components/three/CameraMovementSystem.tsx - OPTIMIZED: Conflict Resolution & Smooth Movement
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { type SceneSettings } from '../../store/sceneStore';

interface CameraMovementSystemProps {
  settings: SceneSettings;
  enabled: boolean;
  controlsRef?: React.RefObject<any>;
  userInteractingRef?: React.RefObject<boolean>;
}

interface CameraState {
  time: number;
  cyclePhase: number;
  currentMode: string;
  transitionTime: number;
  lastUpdateTime: number;
  smoothPosition: THREE.Vector3;
  smoothTarget: THREE.Vector3;
}

const CameraMovementSystem: React.FC<CameraMovementSystemProps> = ({ 
  settings, 
  enabled, 
  controlsRef,
  userInteractingRef 
}) => {
  const { camera } = useThree();
  const stateRef = useRef<CameraState>({
    time: 0,
    cyclePhase: 0,
    currentMode: 'default',
    transitionTime: 0,
    lastUpdateTime: 0,
    smoothPosition: new THREE.Vector3(),
    smoothTarget: new THREE.Vector3(),
  });

  // Initialize smooth positions
  useEffect(() => {
    stateRef.current.smoothPosition.copy(camera.position);
    stateRef.current.smoothTarget.set(0, settings.cameraLookAtY || 0, 0);
  }, []);

  const baseDistance = settings.cameraDistance || 25;
  const globalSpeed = (settings.cameraRotationSpeed || 0.2) * 0.5;

  useFrame((state, delta) => {
    // CRITICAL FIX: Don't move camera if user is interacting or disabled
    if (!enabled || 
        !settings.cameraEnabled || 
        userInteractingRef?.current) {
      return;
    }

    const cameraState = stateRef.current;
    const now = state.clock.elapsedTime;
    
    // PERFORMANCE: Throttle updates to reduce stuttering
    if (now - cameraState.lastUpdateTime < 0.016) { // ~60fps
      return;
    }
    cameraState.lastUpdateTime = now;

    // CONFLICT RESOLUTION: Determine camera movement priority
    const pattern = settings.animationPattern;
    const isPatternCameraEnabled = settings.patterns[pattern]?.cameraMovementEnabled;
    const isGlobalRotationEnabled = settings.cameraRotationEnabled;

    // PRIORITY SYSTEM:
    // 1. Pattern-specific camera movement (if enabled)
    // 2. Global camera rotation (if pattern camera disabled but global enabled)
    // 3. No automatic movement

    if (isPatternCameraEnabled) {
      handlePatternCameraMovement(camera, cameraState, pattern, settings, controlsRef, delta);
    } else if (isGlobalRotationEnabled) {
      handleGlobalCameraRotation(camera, cameraState, baseDistance, settings, controlsRef, delta);
    }
    // If neither is enabled, camera stays static (user can still manually control)
  });

  return null;
};

// OPTIMIZED: Pattern-specific camera movement with smooth transitions
function handlePatternCameraMovement(
  camera: THREE.Camera,
  state: CameraState,
  pattern: string,
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>,
  delta?: number
) {
  const globalSpeed = (settings.cameraRotationSpeed || 0.2) * 0.5;
  state.time += (delta || 0.016) * globalSpeed;
  
  const baseDistance = settings.cameraDistance || 25;
  let targetPosition = new THREE.Vector3();
  let targetLookAt = new THREE.Vector3(0, settings.cameraLookAtY || 0, 0);

  // Calculate target position based on pattern
  switch (pattern) {
    case 'float':
      calculateFloatCamera(targetPosition, targetLookAt, state, baseDistance, settings);
      break;
    case 'wave':
      calculateWaveCamera(targetPosition, targetLookAt, state, baseDistance, settings);
      break;
    case 'spiral':
      calculateSpiralCamera(targetPosition, targetLookAt, state, baseDistance, settings);
      break;
    case 'grid':
      calculateGridCamera(targetPosition, targetLookAt, state, baseDistance, settings);
      break;
    default:
      calculateDefaultCamera(targetPosition, targetLookAt, state, baseDistance, settings);
      break;
  }

  // SMOOTH: Apply position with interpolation to prevent jarring movements
  applySmoothCameraMovement(camera, state, targetPosition, targetLookAt, controlsRef);
}

// OPTIMIZED: Global camera rotation when pattern camera is disabled
function handleGlobalCameraRotation(
  camera: THREE.Camera,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>,
  delta?: number
) {
  const globalSpeed = (settings.cameraRotationSpeed || 0.2) * 0.5;
  state.time += (delta || 0.016) * globalSpeed;
  
  // Simple orbital rotation around the scene center
  const radius = baseDistance;
  const height = settings.cameraHeight || 10;
  const angle = state.time * 0.5; // Slow, smooth rotation
  
  const targetPosition = new THREE.Vector3(
    Math.cos(angle) * radius,
    height,
    Math.sin(angle) * radius
  );
  
  const targetLookAt = new THREE.Vector3(0, settings.cameraLookAtY || 0, 0);
  
  // Apply smooth movement
  applySmoothCameraMovement(camera, state, targetPosition, targetLookAt, controlsRef);
}

// CRITICAL: Smooth camera movement application to prevent stuttering
function applySmoothCameraMovement(
  camera: THREE.Camera,
  state: CameraState,
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  controlsRef?: React.RefObject<any>
) {
  const smoothingFactor = 0.05; // Gentle smoothing
  
  // Smooth position interpolation
  state.smoothPosition.lerp(targetPosition, smoothingFactor);
  state.smoothTarget.lerp(targetLookAt, smoothingFactor);
  
  // Apply to camera
  camera.position.copy(state.smoothPosition);
  
  // Apply to controls if available
  if (controlsRef?.current) {
    controlsRef.current.target.copy(state.smoothTarget);
  }
}

// PATTERN-SPECIFIC CAMERA CALCULATIONS

// Float Pattern: Gentle floating movement around the scene
function calculateFloatCamera(
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings
) {
  const time = state.time;
  const orbitRadius = settings.patterns.float.cameraOrbitRadius || baseDistance;
  
  // 120-second perfect loop for ultra-smooth movement
  const cycleDuration = 120;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2;
  
  // Gentle oval orbit
  const x = Math.cos(phase) * orbitRadius;
  const z = Math.sin(phase * 0.8) * orbitRadius * 0.6; // Oval shape
  
  // Gentle height variation
  const baseHeight = settings.cameraHeight || 10;
  const heightVariation = Math.sin(phase * 0.5) * 3;
  const y = baseHeight + heightVariation;
  
  targetPosition.set(x, y, z);
  
  // Gentle look-at variation
  const lookAtX = Math.sin(phase * 0.3) * 2;
  const lookAtY = (settings.cameraLookAtY || 0) + Math.cos(phase * 0.2) * 1;
  targetLookAt.set(lookAtX, lookAtY, 0);
}

// Wave Pattern: Smooth wave-like movement
function calculateWaveCamera(
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings
) {
  const time = state.time;
  const amplitude = settings.patterns.wave.cameraWaveAmplitude || 1;
  
  // 90-second perfect loop
  const cycleDuration = 90;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2;
  
  // Smooth wave orbital movement
  const waveAngle = phase * 2;
  const radius = baseDistance;
  
  const x = Math.cos(waveAngle) * radius;
  const z = Math.sin(waveAngle) * radius;
  
  // Single smooth wave height
  const baseHeight = settings.cameraHeight || 10;
  const waveY = Math.sin(phase * 1.2) * (4 * amplitude);
  const y = baseHeight + waveY;
  
  targetPosition.set(x, y, z);
  targetLookAt.set(0, settings.cameraLookAtY || 0, 0);
}

// Spiral Pattern: Spiral movement with height variation
function calculateSpiralCamera(
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings
) {
  const time = state.time;
  const orbitSpeed = settings.patterns.spiral.cameraOrbitSpeed || 1;
  const orbitRadius = settings.patterns.spiral.cameraOrbitRadius || 20;
  const heightVariation = settings.patterns.spiral.cameraHeightVariation !== false;
  const direction = settings.patterns.spiral.cameraOrbitDirection === 'counterclockwise' ? -1 : 1;
  
  // 100-second perfect loop
  const cycleDuration = 100;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2;
  
  // Orbital movement
  const orbitAngle = phase * 5 * orbitSpeed * direction;
  
  // Smooth zoom cycle
  const zoomCycle = Math.sin(phase) * 0.3 + 0.7;
  const currentRadius = orbitRadius * zoomCycle;
  
  const x = Math.cos(orbitAngle) * currentRadius;
  const z = Math.sin(orbitAngle) * currentRadius;
  
  // Height variation
  const baseHeight = settings.cameraHeight || 10;
  let y = baseHeight;
  
  if (heightVariation) {
    const heightWave = Math.sin(phase * 2) * 8 + Math.sin(phase * 3) * 3;
    y = baseHeight + heightWave;
  }
  
  targetPosition.set(x, y, z);
  
  // Dynamic look-at for spiral
  const lookAtX = Math.sin(phase) * 2;
  const lookAtY = Math.cos(phase * 1.5) * 1.5;
  targetLookAt.set(lookAtX, lookAtY, 0);
}

// Grid Pattern: Structured movement showcasing the grid layout
function calculateGridCamera(
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings
) {
  const time = state.time;
  
  // 150-second cycle for thorough grid showcase
  const cycleDuration = 150;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2;
  
  // Rectangular orbit to showcase grid structure
  const t = cycleTime * 4; // 4 sides of rectangle
  const side = Math.floor(t) % 4;
  const sideProgress = t - Math.floor(t);
  
  const gridSize = Math.min(baseDistance * 1.5, 40);
  let x: number, z: number;
  
  switch (side) {
    case 0: // Top side
      x = -gridSize + (sideProgress * 2 * gridSize);
      z = gridSize;
      break;
    case 1: // Right side
      x = gridSize;
      z = gridSize - (sideProgress * 2 * gridSize);
      break;
    case 2: // Bottom side
      x = gridSize - (sideProgress * 2 * gridSize);
      z = -gridSize;
      break;
    case 3: // Left side
      x = -gridSize;
      z = -gridSize + (sideProgress * 2 * gridSize);
      break;
    default:
      x = gridSize;
      z = 0;
  }
  
  // Gentle height variation
  const baseHeight = settings.cameraHeight || 10;
  const heightVariation = Math.sin(phase * 0.5) * 5;
  const y = baseHeight + heightVariation + 5; // Slightly elevated for grid overview
  
  targetPosition.set(x, y, z);
  
  // Look at center with slight variation
  const lookAtY = (settings.cameraLookAtY || 0) + Math.sin(phase * 0.3) * 2;
  targetLookAt.set(0, lookAtY, 0);
}

// Default Pattern: Simple orbital movement
function calculateDefaultCamera(
  targetPosition: THREE.Vector3,
  targetLookAt: THREE.Vector3,
  state: CameraState,
  baseDistance: number,
  settings: SceneSettings
) {
  const time = state.time;
  
  // Simple 80-second orbit
  const angle = (time * 0.5) % (Math.PI * 2);
  const radius = baseDistance;
  const height = settings.cameraHeight || 10;
  
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = height + Math.sin(time * 0.3) * 2;
  
  targetPosition.set(x, y, z);
  targetLookAt.set(0, settings.cameraLookAtY || 0, 0);
}

export default CameraMovementSystem;