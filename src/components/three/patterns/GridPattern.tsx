// src/components/three/patterns/GridPattern.tsx - FIXED: True edge-to-edge solid wall with proper inheritance
import { BasePattern, type PatternState, type Position } from './BasePattern';

export class GridPattern extends BasePattern {
  protected generatePositionsInternal(time: number): PatternState {
    const positions: Position[] = [];
    const rotations: [number, number, number][] = [];
    
    const totalPhotos = Math.min(this.settings.photoCount, 500);
    
    // Calculate grid dimensions with aspect ratio
    const aspectRatio = this.settings.gridAspectRatio || 1.0;
    const columns = Math.ceil(Math.sqrt(totalPhotos * aspectRatio));
    const rows = Math.ceil(totalPhotos / columns);
    
    const photoSize = this.settings.photoSize || 4.0;
    const spacingPercentage = this.settings.photoSpacing || 0; // 0 to 1 (0% to 100%)
    
    // FIXED: True edge-to-edge when spacing is 0, equal spacing when spacing > 0
    let horizontalSpacing, verticalSpacing;
    
    if (spacingPercentage === 0) {
      // SOLID WALL: Photos touch edge-to-edge with NO gaps or overlaps
      horizontalSpacing = photoSize * 0.562; // 56.2% = exact edge-to-edge for 16:9 photos
      verticalSpacing = photoSize;           // Full photo height = no vertical overlap
    } else {
      // SPACED WALL: Equal gaps between photos horizontally and vertically
      const gapSize = spacingPercentage * photoSize * 2; // Wide range: 0 to 200% of photo size
      
      // Apply IDENTICAL spacing calculation for both directions
      horizontalSpacing = photoSize + gapSize;  // photoSize + equal gap
      verticalSpacing = photoSize + gapSize;    // photoSize + equal gap (same calculation)
    }
    
    // Wall positioning
    const wallHeight = this.settings.wallHeight || 0;
    
    // Calculate total wall dimensions
    const totalWallWidth = (columns - 1) * horizontalSpacing;
    const totalWallHeight = (rows - 1) * verticalSpacing;
    
    // Animation settings
    const speed = this.settings.animationSpeed / 100;
    const animationTime = this.settings.animationEnabled ? time * speed : 0;
    
    // Generate positions for all photos
    for (let i = 0; i < totalPhotos; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Calculate base grid position (centered)
      let x = (col - (columns - 1) / 2) * horizontalSpacing;
      let y = wallHeight + (row - (rows - 1) / 2) * verticalSpacing;
      let z = 0;
      
      // ENHANCED: Grid-specific animation effects
      if (this.settings.animationEnabled) {
        // Option 1: Wave effect across the grid
        const wavePhase = animationTime * 2;
        const waveAmplitude = 2;
        const waveFrequency = 0.1;
        
        // Create wave based on position in grid
        const gridDistance = Math.sqrt(
          Math.pow(col - columns / 2, 2) + Math.pow(row - rows / 2, 2)
        );
        
        z += Math.sin(wavePhase + gridDistance * waveFrequency) * waveAmplitude;
        
        // Option 2: Subtle breathing effect
        const breathingAmplitude = 0.5;
        z += Math.sin(animationTime * 0.8 + i * 0.1) * breathingAmplitude;
        
        // Option 3: Random gentle movements
        const randomOffsetX = Math.sin(animationTime * 0.3 + i * 0.7) * 0.3;
        const randomOffsetY = Math.cos(animationTime * 0.4 + i * 0.9) * 0.3;
        
        x += randomOffsetX;
        y += randomOffsetY;
      }
      
      positions.push([x, y, z]);
      
      // Calculate rotations if photo rotation is enabled
      if (this.settings.photoRotation) {
        let rotationX = 0;
        let rotationY = 0;
        let rotationZ = 0;
        
        if (this.settings.animationEnabled) {
          // Gentle rotation animations
          rotationX = Math.sin(animationTime * 0.6 + i * 0.4) * 0.05;
          rotationY = Math.cos(animationTime * 0.5 + i * 0.6) * 0.03;
          rotationZ = Math.sin(animationTime * 0.7 + i * 0.8) * 0.02;
        }
        
        rotations.push([rotationX, rotationY, rotationZ]);
      } else {
        rotations.push([0, 0, 0]);
      }
    }

    return { positions, rotations };
  }
}