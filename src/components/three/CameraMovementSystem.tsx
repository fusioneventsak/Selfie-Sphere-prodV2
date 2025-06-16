// src/components/three/CameraMovementSystem.tsx - Enhanced with pattern-specific controls
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
    transitionTime: 0
  });

  const baseDistance = settings.cameraDistance || 25;
  const globalSpeed = (settings.cameraRotationSpeed || 0.2) * 0.5; // Global speed multiplier

  useFrame((state, delta) => {
    // Don't move camera if disabled, not enabled, or user is interacting
    if (!enabled || 
        !settings.cameraEnabled || 
        (userInteractingRef?.current)) {
      return;
    }

    // Check if pattern-specific camera movement is enabled
    const pattern = settings.animationPattern;
    const isPatternCameraEnabled = settings.patterns[pattern]?.cameraMovementEnabled;
    
    // Fall back to global camera rotation if pattern camera is disabled
    if (!isPatternCameraEnabled && settings.cameraRotationEnabled) {
      handleGlobalCameraRotation(state, delta);
      return;
    }

    // Only proceed if pattern camera movement is enabled
    if (!isPatternCameraEnabled) return;

    const cameraState = stateRef.current;
    cameraState.time += delta * globalSpeed;
    
    // Calculate camera position based on pattern
    switch (pattern) {
      case 'float':
        updateFloatCamera(camera, cameraState, baseDistance, settings, controlsRef);
        break;
      case 'wave':
        updateWaveCamera(camera, cameraState, baseDistance, settings, controlsRef);
        break;
      case 'spiral':
        updateSpiralCamera(camera, cameraState, baseDistance, settings, controlsRef);
        break;
      case 'grid':
        updateGridCamera(camera, cameraState, baseDistance, settings, controlsRef);
        break;
      default:
        updateDefaultCamera(camera, cameraState, baseDistance, settings, controlsRef);
    }

    // Update controls if available
    if (controlsRef?.current) {
      controlsRef.current.update();
    }
  });

  // Global camera rotation (existing functionality)
  const handleGlobalCameraRotation = (state: any, delta: number) => {
    if (!controlsRef?.current) return;

    const offset = new THREE.Vector3().copy(camera.position).sub(controlsRef.current.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    
    spherical.theta += (settings.cameraRotationSpeed || 0.5) * delta;
    
    const newPosition = new THREE.Vector3().setFromSpherical(spherical).add(controlsRef.current.target);
    camera.position.copy(newPosition);
    controlsRef.current.update();
  };

  return null;
};

// Float Pattern: Extended cinematic journey with outer edges and backwards movement
function updateFloatCamera(
  camera: THREE.Camera, 
  state: CameraState, 
  baseDistance: number, 
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>
) {
  const time = state.time;
  const intensity = settings.patterns.float.cameraFloatIntensity || 1;
  
  // 300-second extended loop (5 minutes) - cinematic journey
  const cycleDuration = 300;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  
  // CINEMATIC JOURNEY: Wide shots -> Close exploration -> Backwards journey
  let finalX, finalY, finalZ;
  let lookAtX = 0, lookAtY = 0, lookAtZ = 0;
  
  if (cycleTime < 0.2) {
    // 1. Wide Orbital Shots (0-20% = 60 seconds)
    const widePhase = cycleTime / 0.2;
    const phase = widePhase * Math.PI * 2;
    
    // Large orbital movement at outer edges
    const wideRadius = baseDistance * (2 + intensity * 0.5); // Much wider
    const orbitAngle = phase * 1.5; // 1.5 orbits during wide phase
    
    finalX = Math.cos(orbitAngle) * wideRadius;
    finalZ = Math.sin(orbitAngle) * wideRadius;
    
    // Varied heights for different perspectives
    const heightRange = 20 * intensity;
    finalY = (settings.cameraHeight || 10) + Math.sin(phase * 2) * heightRange;
    
    // Look at center
    lookAtX = 0;
    lookAtY = 0;
    lookAtZ = 0;
    
  } else if (cycleTime < 0.25) {
    // 2. Spiral In Transition (20-25% = 15 seconds)
    const spiralPhase = (cycleTime - 0.2) / 0.05;
    const phase = spiralPhase * Math.PI * 2;
    
    // Spiral inward from wide to normal distance
    const startRadius = baseDistance * (2 + intensity * 0.5);
    const endRadius = baseDistance;
    const currentRadius = startRadius + (endRadius - startRadius) * spiralPhase;
    
    const spiralAngle = phase * 3; // 3 spirals during transition
    
    finalX = Math.cos(spiralAngle) * currentRadius;
    finalZ = Math.sin(spiralAngle) * currentRadius;
    finalY = (settings.cameraHeight || 10) + Math.sin(phase) * (10 * intensity);
    
    lookAtX = 0;
    lookAtY = 0;
    lookAtZ = 0;
    
  } else if (cycleTime < 0.45) {
    // 3. Close Exploration (25-45% = 60 seconds)
    const explorePhase = (cycleTime - 0.25) / 0.2;
    const phase = explorePhase * Math.PI * 2;
    
    // Normal distance with detailed movement
    const radius = baseDistance;
    const orbitAngle = phase * 2; // 2 complete orbits
    
    finalX = Math.cos(orbitAngle) * radius;
    finalZ = Math.sin(orbitAngle) * radius;
    
    // Gentle floating height
    finalY = (settings.cameraHeight || 10) + Math.sin(phase * 0.8) * (5 * intensity);
    
    lookAtX = 0;
    lookAtY = 0;
    lookAtZ = 0;
    
  } else if (cycleTime < 0.5) {
    // 4. Diving Through Transition (45-50% = 15 seconds)
    const divePhase = (cycleTime - 0.45) / 0.05;
    const phase = divePhase * Math.PI * 2;
    
    // Move through the center of the collage
    const moveDistance = baseDistance * 0.3;
    
    finalX = Math.sin(phase * 2) * moveDistance;
    finalZ = Math.cos(phase * 2) * moveDistance;
    finalY = (settings.cameraHeight || 10) + Math.sin(phase * 4) * (8 * intensity);
    
    // Look ahead in movement direction
    lookAtX = Math.sin(phase * 2 + 0.5) * moveDistance;
    lookAtY = 0;
    lookAtZ = Math.cos(phase * 2 + 0.5) * moveDistance;
    
  } else {
    // 5. BACKWARDS JOURNEY (50-100% = 150 seconds)
    const backwardPhase = (cycleTime - 0.5) / 0.5;
    
    // Reverse the entire journey in reverse order
    const reversedPhase = 1 - backwardPhase; // Go backwards through time
    
    if (reversedPhase > 0.8) {
      // Backwards: Wide Orbital Shots
      const widePhase = (reversedPhase - 0.8) / 0.2;
      const phase = widePhase * Math.PI * 2;
      
      const wideRadius = baseDistance * (2 + intensity * 0.5);
      const orbitAngle = phase * 1.5;
      
      // Move in opposite direction for backwards effect
      finalX = Math.cos(-orbitAngle) * wideRadius;
      finalZ = Math.sin(-orbitAngle) * wideRadius;
      finalY = (settings.cameraHeight || 10) + Math.sin(phase * 2) * (20 * intensity);
      
    } else if (reversedPhase > 0.75) {
      // Backwards: Spiral In Transition
      const spiralPhase = (reversedPhase - 0.75) / 0.05;
      const phase = spiralPhase * Math.PI * 2;
      
      const startRadius = baseDistance * (2 + intensity * 0.5);
      const endRadius = baseDistance;
      const currentRadius = startRadius + (endRadius - startRadius) * spiralPhase;
      
      const spiralAngle = phase * 3;
      
      // Reverse spiral direction
      finalX = Math.cos(-spiralAngle) * currentRadius;
      finalZ = Math.sin(-spiralAngle) * currentRadius;
      finalY = (settings.cameraHeight || 10) + Math.sin(phase) * (10 * intensity);
      
    } else if (reversedPhase > 0.55) {
      // Backwards: Close Exploration
      const explorePhase = (reversedPhase - 0.55) / 0.2;
      const phase = explorePhase * Math.PI * 2;
      
      const radius = baseDistance;
      const orbitAngle = phase * 2;
      
      // Reverse orbit direction
      finalX = Math.cos(-orbitAngle) * radius;
      finalZ = Math.sin(-orbitAngle) * radius;
      finalY = (settings.cameraHeight || 10) + Math.sin(phase * 0.8) * (5 * intensity);
      
    } else if (reversedPhase > 0.5) {
      // Backwards: Diving Through Transition
      const divePhase = (reversedPhase - 0.5) / 0.05;
      const phase = divePhase * Math.PI * 2;
      
      const moveDistance = baseDistance * 0.3;
      
      // Reverse movement direction
      finalX = Math.sin(-phase * 2) * moveDistance;
      finalZ = Math.cos(-phase * 2) * moveDistance;
      finalY = (settings.cameraHeight || 10) + Math.sin(phase * 4) * (8 * intensity);
      
      lookAtX = Math.sin(-phase * 2 - 0.5) * moveDistance;
      lookAtY = 0;
      lookAtZ = Math.cos(-phase * 2 - 0.5) * moveDistance;
      
    } else {
      // Extended backwards wide exploration
      const extendedPhase = reversedPhase / 0.5;
      const phase = extendedPhase * Math.PI * 4; // More orbits for variety
      
      const extraWideRadius = baseDistance * (2.5 + intensity * 0.8);
      const orbitAngle = phase * 0.8;
      
      // Very wide, slow backwards orbit
      finalX = Math.cos(-orbitAngle) * extraWideRadius;
      finalZ = Math.sin(-orbitAngle) * extraWideRadius;
      finalY = (settings.cameraHeight || 10) + Math.sin(phase * 0.3) * (25 * intensity);
    }
    
    // Default look-at for backwards journey
    if (!lookAtX && !lookAtY && !lookAtZ) {
      lookAtX = 0;
      lookAtY = 0;
      lookAtZ = 0;
    }
  }
  
  camera.position.set(finalX, finalY, finalZ);
  
  if (controlsRef?.current) {
    controlsRef.current.target.set(lookAtX, lookAtY, lookAtZ);
  }
}

// Wave Pattern: Ultra-smooth wave movement without glitches
function updateWaveCamera(
  camera: THREE.Camera, 
  state: CameraState, 
  baseDistance: number, 
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>
) {
  const time = state.time;
  const amplitude = settings.patterns.wave.cameraWaveAmplitude || 1;
  
  // 90-second perfect loop - ultra smooth
  const cycleDuration = 90;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2; // Perfect 0 to 2π cycle
  
  // PERFECTLY SMOOTH: Single wave orbital movement
  // Start/End position: (baseDistance, cameraHeight, 0)
  
  // Ultra-smooth wave orbital - single frequency only
  const waveAngle = phase * 2; // 2 complete smooth wave orbits
  const radius = baseDistance; // Fixed radius for smoothness
  
  const x = Math.cos(waveAngle) * radius;
  const z = Math.sin(waveAngle) * radius;
  
  // Single smooth wave height - no competing frequencies
  const baseHeight = settings.cameraHeight || 10;
  const waveY = Math.sin(phase * 1.2) * (4 * amplitude); // Single wave motion
  
  const y = baseHeight + waveY;
  
  camera.position.set(x, y, z);
  
  // Fixed center look-at to avoid glitches
  if (controlsRef?.current) {
    controlsRef.current.target.set(0, 0, 0);
  }
}

// Spiral Pattern: Perfect loop with exact start/end positions
function updateSpiralCamera(
  camera: THREE.Camera, 
  state: CameraState, 
  baseDistance: number, 
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>
) {
  const time = state.time;
  const orbitSpeed = settings.patterns.spiral.cameraOrbitSpeed || 1;
  const orbitRadius = settings.patterns.spiral.cameraOrbitRadius || 20;
  const heightVariation = settings.patterns.spiral.cameraHeightVariation !== false;
  const direction = settings.patterns.spiral.cameraOrbitDirection === 'counterclockwise' ? -1 : 1;
  
  // 100-second perfect loop
  const cycleDuration = 100;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  const phase = cycleTime * Math.PI * 2; // Complete 0 to 2π cycle
  
  // PERFECT LOOP: Starting position: (orbitRadius, cameraHeight, 0)
  // Ending position: (orbitRadius, cameraHeight, 0) - EXACT SAME
  
  // Orbital movement - complete cycles only
  const orbitAngle = phase * 5 * orbitSpeed * direction; // 5 complete orbits
  
  // Smooth zoom in/out cycle - complete sine wave
  const zoomCycle = Math.sin(phase) * 0.3 + 0.7; // 0.4 to 1.0 range
  const currentRadius = orbitRadius * zoomCycle;
  
  // Perfect circular orbit
  const x = Math.cos(orbitAngle) * currentRadius;
  const z = Math.sin(orbitAngle) * currentRadius;
  
  // Height variation - complete cycles
  const baseHeight = settings.cameraHeight || 10;
  let y = baseHeight;
  
  if (heightVariation) {
    const heightWave = Math.sin(phase * 2) * 8 + Math.sin(phase * 3) * 3;
    y = baseHeight + heightWave;
  }
  
  camera.position.set(x, y, z);
  
  // Perfect loop look-at - returns to (0, 0, 0)
  if (controlsRef?.current) {
    const lookAtX = Math.sin(phase) * 2;
    const lookAtY = Math.cos(phase * 1.5) * 1.5;
    controlsRef.current.target.set(lookAtX, lookAtY, 0);
  }
}

// Grid Pattern: Perfect loop with exact start/end position
function updateGridCamera(
  camera: THREE.Camera, 
  state: CameraState, 
  baseDistance: number, 
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>
) {
  const time = state.time;
  
  // 480-second perfect loop (8 minutes) - comprehensive cinematic coverage
  const cycleDuration = 480;
  const cycleTime = (time % cycleDuration) / cycleDuration;
  
  const wallHeight = settings.wallHeight || 0;
  const photoCount = settings.photoCount || 50;
  const aspectRatio = settings.gridAspectRatio || 1.77778;
  
  // DYNAMIC GRID CALCULATIONS - adapts to any size
  const columns = Math.ceil(Math.sqrt(photoCount * aspectRatio));
  const rows = Math.ceil(photoCount / columns);
  const photoSize = settings.photoSize || 6.0;
  const spacing = settings.photoSpacing || 0;
  const actualSpacing = photoSize * (1 + spacing);
  
  const wallWidth = columns * actualSpacing;
  const wallTotalHeight = rows * actualSpacing;
  
  // DYNAMIC CAMERA DISTANCES - scale with wall size
  const wallDiagonal = Math.sqrt(wallWidth * wallWidth + wallTotalHeight * wallTotalHeight);
  const wallScale = Math.max(wallWidth, wallTotalHeight);
  
  const wideDistance = Math.max(wallDiagonal * 0.8, wallScale * 1.2, baseDistance * 1.5);
  const mediumDistance = Math.max(wallScale * 0.6, wallDiagonal * 0.4, baseDistance * 1.1);
  const closeDistance = Math.max(photoSize * 2.5, wallScale * 0.15, 8);
  const macroDistance = Math.max(photoSize * 1.2, wallScale * 0.08, 4);
  
  // DYNAMIC MOVEMENT RANGES
  const horizontalRange = wallWidth * 0.8;
  const verticalRange = wallTotalHeight * 0.4;
  const floatRange = Math.min(wallWidth, wallTotalHeight) * 0.15;
  
  // DYNAMIC HEIGHT LEVELS
  const bottomLevel = wallHeight + wallTotalHeight * 0.15;
  const middleLevel = wallHeight + wallTotalHeight * 0.5;
  const topLevel = wallHeight + wallTotalHeight * 0.85;
  
  // PERFECT LOOP: Define exact start/end position
  const startPosition = { x: 0, y: middleLevel, z: -wideDistance };
  const startLookAt = { x: 0, y: middleLevel, z: 0 };
  
  // ONE COMPLETE ORBITAL CYCLE (front and back)
  const masterPhase = cycleTime * Math.PI * 2; // 0 to 2π for complete orbit
  
  // Determine current orbital position
  const isTransitioning = (cycleTime > 0.48 && cycleTime < 0.52); // 4% transition zone
  const isBackSide = (cycleTime > 0.5);
  
  let finalX, finalY, finalZ;
  let lookAtX, lookAtY, lookAtZ;
  
  if (isTransitioning) {
    // SMOOTH TRANSITION BETWEEN SIDES (48-52% = 4% of total time)
    const transitionPhase = (cycleTime - 0.48) / 0.04; // 0 to 1
    const smoothTransition = 0.5 * (1 - Math.cos(transitionPhase * Math.PI));
    
    // Orbit from front (-Z) to back (+Z)
    const frontZ = -wideDistance;
    const backZ = wideDistance;
    finalZ = frontZ + (backZ - frontZ) * smoothTransition;
    
    // Slight horizontal movement during transition
    finalX = Math.sin(smoothTransition * Math.PI) * floatRange;
    
    // Arc over top during transition
    finalY = middleLevel + wallTotalHeight * 0.2 + Math.sin(smoothTransition * Math.PI) * (wallTotalHeight * 0.15);
    
    lookAtX = 0;
    lookAtY = middleLevel;
    lookAtZ = 0;
    
  } else {
    // MAIN SEQUENCE FOR EACH SIDE
    
    // Calculate local progress within current side (0 to 1)
    let sideProgress;
    if (cycleTime < 0.48) {
      // Front side (0% to 48%)
      sideProgress = cycleTime / 0.48;
    } else {
      // Back side (52% to 100%)
      sideProgress = (cycleTime - 0.52) / 0.48;
    }
    
    // Ensure we return to exact start position at end
    if (cycleTime > 0.98) {
      // Final 2% - force return to exact start position
      const returnPhase = (cycleTime - 0.98) / 0.02;
      const smoothReturn = 0.5 * (1 - Math.cos(returnPhase * Math.PI));
      
      finalX = startPosition.x;
      finalY = startPosition.y;
      finalZ = startPosition.z;
      
      lookAtX = startLookAt.x;
      lookAtY = startLookAt.y;
      lookAtZ = startLookAt.z;
      
    } else {
      // CINEMATIC SEQUENCE FOR CURRENT SIDE
      
      if (sideProgress < 0.08) {
        // 1. Opening Wide Shot
        const widePhase = sideProgress / 0.08;
        
        if (!isBackSide) {
          finalX = Math.sin(widePhase * Math.PI * 2) * floatRange;
          finalZ = -wideDistance;
        } else {
          finalX = Math.sin(widePhase * Math.PI * 2) * floatRange;
          finalZ = wideDistance;
        }
        finalY = middleLevel + Math.sin(widePhase * Math.PI * 3) * (wallTotalHeight * 0.1);
        
        lookAtX = Math.sin(widePhase * Math.PI) * (wallWidth * 0.1);
        lookAtY = middleLevel;
        lookAtZ = 0;
        
      } else if (sideProgress < 0.15) {
        // 2. Medium Shot Approach
        const approachPhase = (sideProgress - 0.08) / 0.07;
        const smoothApproach = 0.5 * (1 - Math.cos(approachPhase * Math.PI));
        
        const currentDistance = wideDistance + (mediumDistance - wideDistance) * smoothApproach;
        
        if (!isBackSide) {
          finalX = Math.sin(approachPhase * Math.PI) * (wallWidth * 0.2);
          finalZ = -currentDistance;
        } else {
          finalX = Math.sin(approachPhase * Math.PI) * (wallWidth * 0.2);
          finalZ = currentDistance;
        }
        finalY = middleLevel - (wallTotalHeight * 0.2 * smoothApproach);
        
        lookAtX = 0;
        lookAtY = middleLevel - (wallTotalHeight * 0.15 * smoothApproach);
        lookAtZ = 0;
        
      } else if (sideProgress < 0.35) {
        // 3. Bottom Row Detailed Scan
        const scanPhase = (sideProgress - 0.15) / 0.2;
        
        const zoomProgress = Math.min(scanPhase * 2, 1);
        const currentDistance = mediumDistance + (closeDistance - mediumDistance) * (0.5 * (1 - Math.cos(zoomProgress * Math.PI)));
        
        const horizontalProgress = scanPhase;
        const panRange = horizontalRange;
        const horizontalOffset = (horizontalProgress - 0.5) * panRange;
        
        if (!isBackSide) {
          finalX = horizontalOffset;
          finalZ = -currentDistance;
        } else {
          finalX = -horizontalOffset;
          finalZ = currentDistance;
        }
        
        finalY = bottomLevel + Math.sin(scanPhase * Math.PI * 6) * (photoSize * 0.4);
        
        lookAtX = finalX;
        lookAtY = bottomLevel + Math.sin(scanPhase * Math.PI * 4) * (photoSize * 0.3);
        lookAtZ = 0;
        
      } else if (sideProgress < 0.42) {
        // 4. Dramatic Tilt Up Transition
        const tiltPhase = (sideProgress - 0.35) / 0.07;
        const smoothTilt = 0.5 * (1 - Math.cos(tiltPhase * Math.PI));
        
        const currentDistance = closeDistance + (mediumDistance - closeDistance) * smoothTilt * 0.5;
        
        if (!isBackSide) {
          finalX = wallWidth * 0.3 * (1 - smoothTilt);
          finalZ = -currentDistance;
        } else {
          finalX = -wallWidth * 0.3 * (1 - smoothTilt);
          finalZ = currentDistance;
        }
        
        const startHeight = bottomLevel;
        const endHeight = topLevel;
        finalY = startHeight + (endHeight - startHeight) * smoothTilt;
        
        lookAtX = 0;
        lookAtY = wallHeight + wallTotalHeight * (0.2 + smoothTilt * 0.6);
        lookAtZ = 0;
        
      } else if (sideProgress < 0.62) {
        // 5. Top Section Close-ups
        const topPhase = (sideProgress - 0.42) / 0.2;
        
        const macroProgress = Math.sin(topPhase * Math.PI * 2) * 0.5 + 0.5;
        const currentDistance = macroDistance + (closeDistance - macroDistance) * macroProgress;
        
        const horizontalProgress = topPhase;
        const panRange = horizontalRange * 0.7;
        const horizontalOffset = (horizontalProgress - 0.5) * panRange;
        
        if (!isBackSide) {
          finalX = horizontalOffset;
          finalZ = -currentDistance;
        } else {
          finalX = -horizontalOffset;
          finalZ = currentDistance;
        }
        
        finalY = topLevel + Math.sin(topPhase * Math.PI * 8) * (photoSize * 0.5);
        
        lookAtX = finalX + Math.sin(topPhase * Math.PI * 3) * (photoSize * 0.6);
        lookAtY = topLevel + Math.sin(topPhase * Math.PI * 5) * (photoSize * 0.4);
        lookAtZ = 0;
        
      } else if (sideProgress < 0.78) {
        // 6. Middle Section Sweep
        const middlePhase = (sideProgress - 0.62) / 0.16;
        
        const currentDistance = closeDistance;
        
        const horizontalRange = wallWidth * 0.6;
        const verticalRange = wallTotalHeight * 0.4;
        
        const horizontalOffset = Math.sin(middlePhase * Math.PI * 2) * horizontalRange;
        const verticalOffset = Math.cos(middlePhase * Math.PI * 1.5) * verticalRange;
        
        if (!isBackSide) {
          finalX = horizontalOffset;
          finalZ = -currentDistance;
        } else {
          finalX = -horizontalOffset;
          finalZ = currentDistance;
        }
        
        finalY = middleLevel + verticalOffset;
        
        lookAtX = finalX + Math.sin(middlePhase * Math.PI * 4) * (photoSize * 0.4);
        lookAtY = finalY + Math.sin(middlePhase * Math.PI * 6) * (photoSize * 0.3);
        lookAtZ = 0;
        
      } else if (sideProgress < 0.88) {
        // 7. Full Wall Reveal Pull-Back
        const pullbackPhase = (sideProgress - 0.78) / 0.1;
        const smoothPullback = 0.5 * (1 - Math.cos(pullbackPhase * Math.PI));
        
        const currentDistance = closeDistance + (wideDistance - closeDistance) * smoothPullback;
        
        const startX = wallWidth * 0.3;
        const endX = 0;
        const currentX = startX + (endX - startX) * smoothPullback;
        
        if (!isBackSide) {
          finalX = currentX;
          finalZ = -currentDistance;
        } else {
          finalX = -currentX;
          finalZ = currentDistance;
        }
        
        const startY = topLevel;
        const endY = middleLevel + wallTotalHeight * 0.1;
        finalY = startY + (endY - startY) * smoothPullback;
        
        lookAtX = 0;
        lookAtY = middleLevel;
        lookAtZ = 0;
        
      } else {
        // 8. Final Wide Showcase
        const finalPhase = (sideProgress - 0.88) / 0.12;
        
        if (!isBackSide) {
          finalX = Math.sin(finalPhase * Math.PI * 3) * floatRange;
          finalZ = -wideDistance;
        } else {
          finalX = Math.sin(finalPhase * Math.PI * 3) * floatRange;
          finalZ = wideDistance;
        }
        
        finalY = middleLevel + wallTotalHeight * 0.1 + Math.sin(finalPhase * Math.PI * 2) * (wallTotalHeight * 0.05);
        
        lookAtX = Math.sin(finalPhase * Math.PI * 1.5) * (wallWidth * 0.05);
        lookAtY = middleLevel;
        lookAtZ = 0;
      }
    }
  }
  
  camera.position.set(finalX, finalY, finalZ);
  
  if (controlsRef?.current) {
    controlsRef.current.target.set(lookAtX, lookAtY, lookAtZ);
  }
}

// Default camera behavior (fallback)
function updateDefaultCamera(
  camera: THREE.Camera, 
  state: CameraState, 
  baseDistance: number, 
  settings: SceneSettings,
  controlsRef?: React.RefObject<any>
) {
  const time = state.time;
  const angle = time * 0.5;
  
  const x = Math.cos(angle) * baseDistance;
  const z = Math.sin(angle) * baseDistance;
  const y = settings.cameraHeight || 10;
  
  camera.position.set(x, y, z);
  
  if (controlsRef?.current) {
    controlsRef.current.target.set(0, settings.wallHeight || 0, 0);
  }
}

export default CameraMovementSystem;