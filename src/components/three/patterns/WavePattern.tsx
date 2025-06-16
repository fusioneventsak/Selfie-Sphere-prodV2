// src/components/three/patterns/WavePattern.tsx - FIXED: Proper wave pattern with inheritance
import { BasePattern, type PatternState, type Position } from './BasePattern';

export class WavePattern extends BasePattern {
  protected generatePositionsInternal(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];
    const spacing = this.settings.photoSize * (1 + this.settings.photoSpacing);
    const totalPhotos = Math.min(this.settings.photoCount, 500);
    
    // Calculate grid dimensions based on total photos
    const columns = Math.ceil(Math.sqrt(totalPhotos));
    const rows = Math.ceil(totalPhotos / columns);
    
    const speed = this.settings.animationSpeed / 50;
    const wavePhase = time * speed * 2;
    
    // Generate positions for all photos
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Calculate base grid position
      let x = (col - columns / 2) * spacing;
      let z = (row - rows / 2) * spacing;
      
      // Calculate wave height based on distance from center
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const amplitude = 15;
      const frequency = 0.3;
      
      let y = this.settings.wallHeight;
      
      if (this.settings.animationEnabled) {
        // Primary wave effect
        y += Math.sin(distanceFromCenter * frequency - wavePhase) * amplitude;
        
        // Add some vertical offset based on distance for depth
        y += Math.sin(wavePhase * 0.5) * (distanceFromCenter * 0.1);
        
        // Secondary ripple effect
        const secondaryWave = Math.sin(distanceFromCenter * frequency * 2 - wavePhase * 1.5) * amplitude * 0.3;
        y += secondaryWave;
        
        // Gentle horizontal movement
        const horizontalAmplitude = 1.5;
        x += Math.sin(wavePhase * 0.8 + distanceFromCenter * 0.2) * horizontalAmplitude;
        z += Math.cos(wavePhase * 0.6 + distanceFromCenter * 0.15) * horizontalAmplitude;
      }
      
      positions.push([x, y, z]);

      // Calculate rotations if photo rotation is enabled
      if (this.settings.photoRotation) {
        const angle = Math.atan2(x, z);
        let rotationX = 0;
        let rotationY = angle;
        let rotationZ = 0;
        
        if (this.settings.animationEnabled) {
          rotationX = Math.sin(wavePhase * 0.5 + distanceFromCenter * 0.1) * 0.1;
          rotationZ = Math.cos(wavePhase * 0.5 + distanceFromCenter * 0.1) * 0.1;
          
          // Add wave-influenced rotation
          const waveInfluence = Math.sin(distanceFromCenter * frequency - wavePhase) * 0.05;
          rotationY += waveInfluence;
        }
        
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}