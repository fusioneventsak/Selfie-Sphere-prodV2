// src/components/three/patterns/FloatPattern.tsx - OPTIMIZED: Ultra-Smooth Float Movement
import { BasePattern, type PatternState, type Position } from './BasePattern';

interface BasePosition {
  x: number;
  z: number;
  phaseOffset: number;
}

export class FloatPattern extends BasePattern {
  private basePositions: BasePosition[] = [];
  private lastFloorSize: number = 0;
  private lastPhotoCount: number = 0;

  // CRITICAL: Generate base positions only when needed to prevent stuttering
  private generateDynamicBasePositions(totalPhotos: number, floorSize: number): BasePosition[] {
    // Only regenerate if floor size or photo count changed significantly
    if (Math.abs(floorSize - this.lastFloorSize) < 1 && totalPhotos === this.lastPhotoCount && this.basePositions.length > 0) {
      return this.basePositions;
    }

    this.lastFloorSize = floorSize;
    this.lastPhotoCount = totalPhotos;

    const positions: BasePosition[] = [];
    const halfSize = floorSize / 2;
    
    // PERFORMANCE: Use consistent seeded random for stable positions
    const seededRandom = (seed: number): number => {
      const x = Math.sin(seed * 12.9898) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < totalPhotos; i++) {
      // Generate consistent random position for each photo index
      const seed1 = i * 0.1234567;
      const seed2 = i * 0.9876543;
      const seed3 = i * 0.4567891;
      
      // Distribute photos across the floor area
      const x = (seededRandom(seed1) - 0.5) * floorSize;
      const z = (seededRandom(seed2) - 0.5) * floorSize;
      
      // Phase offset for staggered rising animation - ensures smooth distribution
      const phaseOffset = seededRandom(seed3);
      
      positions.push({ x, z, phaseOffset });
    }

    this.basePositions = positions;
    return positions;
  }

  protected generatePositionsInternal(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];
    
    const totalPhotos = Math.min(this.settings.photoCount, 500);
    const floorSize = this.settings.floorSize || 200;
    
    // Get stable base positions
    const basePositions = this.generateDynamicBasePositions(totalPhotos, floorSize);
    
    // OPTIMIZED: Animation parameters for ultra-smooth movement
    const riseSpeed = 6; // Slightly slower for smoother appearance
    const maxHeight = 200; // Reduced from 300 for better performance
    const startHeight = -30; // Starting depth
    const cycleHeight = maxHeight - startHeight;
    
    const speed = this.settings.animationSpeed / 100;
    const animationTime = time * speed;
    
    // PERFORMANCE: Precompute common values
    const driftSpeed = 0.25;
    const driftStrength = Math.max(1.0, floorSize * 0.008);
    const bobSpeed = 1.8;
    const bobStrength = 0.3;
    
    for (let i = 0; i < totalPhotos; i++) {
      const basePos = basePositions[i];
      if (!basePos) continue;
      
      let y: number;
      
      if (this.settings.animationEnabled) {
        // SMOOTH: Calculate Y position with proper wrapping
        const totalDistance = (animationTime * riseSpeed) + (basePos.phaseOffset * cycleHeight);
        const positionInCycle = totalDistance % cycleHeight;
        
        // Smooth transition at wrap-around point
        y = startHeight + positionInCycle;
        
        // SUBTLE: Very gentle bobbing motion
        y += Math.sin(animationTime * bobSpeed + i * 0.3) * bobStrength;
      } else {
        // Static distribution when animation disabled
        y = startHeight + (basePos.phaseOffset * cycleHeight);
      }
      
      // SMOOTH: Horizontal position with gentle drift
      let x = basePos.x;
      let z = basePos.z;
      
      if (this.settings.animationEnabled) {
        // ULTRA-SMOOTH: Gentle horizontal drift - optimized calculations
        const time1 = animationTime * driftSpeed + i * 0.5;
        const time2 = animationTime * driftSpeed * 0.8 + i * 0.7;
        
        x += Math.sin(time1) * driftStrength;
        z += Math.cos(time2) * driftStrength;
      }
      
      positions.push([x, y, z]);
      
      // OPTIMIZED: Rotation calculation
      if (this.settings.photoRotation) {
        // Face towards center with subtle wobble
        const rotationY = Math.atan2(-x, -z);
        
        let wobbleX = 0;
        let wobbleZ = 0;
        
        if (this.settings.animationEnabled) {
          // PERFORMANCE: Simpler wobble calculation
          const wobbleTime1 = animationTime * 0.4 + i * 0.2;
          const wobbleTime2 = animationTime * 0.3 + i * 0.4;
          
          wobbleX = Math.sin(wobbleTime1) * 0.02;
          wobbleZ = Math.cos(wobbleTime2) * 0.02;
        }
        
        rotations.push([wobbleX, rotationY, wobbleZ]);
      } else {
        // SMOOTH: No rotation but still gentle floating orientation
        let floatRotationX = 0;
        let floatRotationZ = 0;
        
        if (this.settings.animationEnabled) {
          const floatTime1 = animationTime * 0.2 + i * 0.1;
          const floatTime2 = animationTime * 0.15 + i * 0.3;
          
          floatRotationX = Math.sin(floatTime1) * 0.01;
          floatRotationZ = Math.cos(floatTime2) * 0.01;
        }
        
        rotations.push([floatRotationX, 0, floatRotationZ]);
      }
    }

    return { positions, rotations };
  }

  // PERFORMANCE: Update settings with smart cache invalidation
  updateSettings(newSettings: any) {
    const significantChange = 
      this.settings.floorSize !== newSettings.floorSize ||
      this.settings.photoCount !== newSettings.photoCount;
    
    if (significantChange) {
      // Force regeneration of base positions
      this.basePositions = [];
      this.lastFloorSize = 0;
      this.lastPhotoCount = 0;
    }
    
    super.updateSettings(newSettings);
  }
}