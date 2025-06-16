// src/components/three/patterns/PatternFactory.tsx - FIXED: Consistent pattern factory
import { type SceneSettings } from '../../../store/sceneStore';
import { BasePattern, type PatternState, type Position } from './BasePattern';
import { GridPattern } from './GridPattern';
import { FloatPattern } from './FloatPattern';
import { WavePattern } from './WavePattern';
import { SpiralPattern } from './SpiralPattern';

// Export types for external use
export type { Position, PatternState };
export { BasePattern };

// OPTIMIZED: Pattern factory with proper caching and reuse
export class PatternFactory {
  private static patternInstances = new Map<string, BasePattern>();
  
  // PERFORMANCE: Get or create pattern instance (cached) - matches existing usage
  static createPattern(patternType: string, settings: SceneSettings): BasePattern {
    const cacheKey = `${patternType}-${settings.photoCount}-${settings.floorSize}`;
    
    // Check if we have a cached instance
    let pattern = PatternFactory.patternInstances.get(cacheKey);
    
    if (!pattern) {
      // Create new pattern instance
      switch (patternType) {
        case 'grid':
          pattern = new GridPattern(settings);
          break;
        case 'float':
          pattern = new FloatPattern(settings);
          break;
        case 'wave':
          pattern = new WavePattern(settings);
          break;
        case 'spiral':
          pattern = new SpiralPattern(settings);
          break;
        default:
          console.warn(`Unknown pattern type: ${patternType}, falling back to grid`);
          pattern = new GridPattern(settings);
          break;
      }
      
      // Cache the instance
      PatternFactory.patternInstances.set(cacheKey, pattern);
      console.log(`🏭 FACTORY: Created new ${patternType} pattern instance`);
    } else {
      // Update existing pattern with new settings
      pattern.updateSettings(settings);
    }
    
    return pattern;
  }
  
  // BACKWARDS COMPATIBILITY: Also provide getPattern method
  static getPattern(settings: SceneSettings): BasePattern {
    const patternType = settings.animationPattern || 'grid';
    return PatternFactory.createPattern(patternType, settings);
  }
  
  // CLEANUP: Clear cached patterns (call when settings change dramatically)
  static clearCache() {
    PatternFactory.patternInstances.clear();
    console.log('🏭 FACTORY: Pattern cache cleared');
  }
  
  // UTILITY: Get available pattern types
  static getAvailablePatterns(): string[] {
    return ['grid', 'float', 'wave', 'spiral'];
  }
}