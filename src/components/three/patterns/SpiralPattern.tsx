// src/components/three/patterns/SpiralPattern.tsx - FIXED: Complete spiral pattern with proper inheritance
import { BasePattern, type PatternState, type Position } from './BasePattern';

export class SpiralPattern extends BasePattern {
  protected generatePositionsInternal(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];

    const totalPhotos = Math.min(this.settings.photoCount, 500);
    const speed = this.settings.animationSpeed / 50;
    const animationTime = time * speed * 2;
    
    // Tornado parameters
    const baseRadius = 3; // Narrow radius at ground level (bottom of funnel)
    const topRadius = 30; // Wide radius at top (top of funnel)
    const maxHeight = 40; // Height of the spiral
    const rotationSpeed = 0.8; // Speed of rotation
    const orbitalChance = 0.2; // 20% chance for a photo to be on an outer orbit
    
    // Distribution parameters
    const verticalBias = 0.7; // Bias towards bottom for density
    
    for (let i = 0; i < totalPhotos; i++) {
      // Generate random but consistent values for each photo
      const randomSeed1 = Math.sin(i * 0.73) * 0.5 + 0.5;
      const randomSeed2 = Math.cos(i * 1.37) * 0.5 + 0.5;
      const randomSeed3 = Math.sin(i * 2.11) * 0.5 + 0.5;
      
      // Determine if this photo is on the main funnel or an outer orbit
      const isOrbital = randomSeed1 < orbitalChance;
      
      // Height distribution - biased towards bottom for density
      let normalizedHeight = Math.pow(randomSeed2, verticalBias);
      const y = this.settings.wallHeight + normalizedHeight * maxHeight;
      
      // Calculate radius at this height (funnel shape)
      const funnelRadius = baseRadius + (topRadius - baseRadius) * normalizedHeight;
      
      let radius: number;
      let angleOffset: number;
      let verticalWobble: number = 0;
      
      if (isOrbital) {
        // Orbital photos - farther out with elliptical paths
        radius = funnelRadius * (1.5 + randomSeed3 * 0.8); // 1.5x to 2.3x funnel radius
        angleOffset = randomSeed3 * Math.PI * 2; // Random starting angle
        
        // Add vertical oscillation for orbital photos
        if (this.settings.animationEnabled) {
          verticalWobble = Math.sin(animationTime * 2 + i) * 3;
        }
      } else {
        // Main funnel photos
        // Add some variation within the funnel
        const radiusVariation = 0.8 + randomSeed3 * 0.4; // 0.8 to 1.2
        radius = funnelRadius * radiusVariation;
        angleOffset = 0;
      }
      
      // Calculate angle with height-based rotation speed
      // Photos at the bottom rotate slower, creating a realistic vortex effect
      const heightSpeedFactor = 0.3 + normalizedHeight * 0.7; // Slower at bottom
      let angle = angleOffset;
      
      if (this.settings.animationEnabled) {
        angle += animationTime * rotationSpeed * heightSpeedFactor;
      }
      
      // Calculate final position
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const finalY = y + verticalWobble;
      
      positions.push([x, finalY, z]);
      
      // Calculate rotation
      if (this.settings.photoRotation) {
        // Photos face the direction they're moving (tangent to the spiral)
        const tangentAngle = angle + Math.PI / 2;
        
        let rotationX = 0;
        let rotationY = tangentAngle;
        let rotationZ = 0;
        
        if (this.settings.animationEnabled) {
          // Add some dynamic rotation based on movement
          rotationX = Math.sin(animationTime + i * 0.5) * 0.1;
          rotationZ = Math.cos(animationTime * 0.8 + i * 0.3) * 0.05;
          
          // Tilt based on spiral position
          const tilt = normalizedHeight * 0.2; // More tilt at higher positions
          rotationX += tilt;
        }
        
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}