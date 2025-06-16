// src/components/three/patterns/PatternFactory.tsx - PERFORMANCE OPTIMIZED
import { type SceneSettings } from '../../../store/sceneStore';
import { GridPattern } from './GridPattern';
import { FloatPattern } from './FloatPattern';
import { WavePattern } from './WavePattern';
import { SpiralPattern } from './SpiralPattern';

export type Position = [number, number, number];

export interface PatternState {
  positions: Position[];
  rotations?: [number, number, number][];
}

// OPTIMIZED: Base pattern with performance improvements
export abstract class BasePattern {
  protected settings: SceneSettings;
  protected lastTime: number = 0;
  protected cachedState: PatternState | null = null;
  protected cacheTimeout: number = 0;
  
  // PERFORMANCE: Cache management
  private static readonly CACHE_DURATION = 16.67; // ~60fps cache invalidation
  private positionCache = new Map<string, PatternState>();
  private cacheTimestamps = new Map<string, number>();

  constructor(settings: SceneSettings) {
    this.settings = settings;
  }

  // CRITICAL: Cache key generation for position stability
  protected getCacheKey(time: number): string {
    // Round time to reduce cache fragmentation while maintaining smoothness
    const roundedTime = Math.floor(time * 60) / 60; // 60fps granularity
    return `${this.settings.animationPattern}-${roundedTime}-${this.settings.photoCount}-${this.settings.animationSpeed}`;
  }

  // PERFORMANCE: Cached position generation
  generatePositions(time: number): PatternState {
    const now = performance.now();
    const cacheKey = this.getCacheKey(time);
    
    // Check cache first
    const cached = this.positionCache.get(cacheKey);
    const cacheTime = this.cacheTimestamps.get(cacheKey);
    
    if (cached && cacheTime && (now - cacheTime) < BasePattern.CACHE_DURATION) {
      return cached;
    }
    
    // Generate new positions
    const state = this.generatePositionsInternal(time);
    
    // Cache the result
    this.positionCache.set(cacheKey, state);
    this.cacheTimestamps.set(cacheKey, now);
    
    // Clean old cache entries (memory management)
    if (this.positionCache.size > 100) {
      this.cleanCache(now);
    }
    
    return state;
  }

  // Clean expired cache entries
  private cleanCache(now: number) {
    for (const [key, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > BasePattern.CACHE_DURATION * 10) {
        this.positionCache.delete(key);
        this.cacheTimestamps.delete(key);
      }
    }
  }

  // Abstract method to be implemented by concrete patterns
  protected abstract generatePositionsInternal(time: number): PatternState;

  // Update settings and clear cache if necessary
  updateSettings(newSettings: SceneSettings) {
    const settingsChanged = 
      this.settings.photoCount !== newSettings.photoCount ||
      this.settings.animationSpeed !== newSettings.animationSpeed ||
      this.settings.animationPattern !== newSettings.animationPattern;
    
    if (settingsChanged) {
      this.positionCache.clear();
      this.cacheTimestamps.clear();
    }
    
    this.settings = newSettings;
  }
}

// OPTIMIZED: Pattern factory with caching and error handling
export class PatternFactory {
  private static patternInstances = new Map<string, BasePattern>();
  
  // PERFORMANCE: Reuse pattern instances when possible
  static createPattern(patternType: string, settings: SceneSettings): BasePattern {
    const cacheKey = `${patternType}-${settings.photoCount}`;
    
    // Try to reuse existing instance
    const existing = this.patternInstances.get(cacheKey);
    if (existing) {
      existing.updateSettings(settings);
      return existing;
    }
    
    // Create new instance
    let pattern: BasePattern;
    
    try {
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
      }
    } catch (error) {
      console.error(`Error creating pattern ${patternType}:`, error);
      pattern = new GridPattern(settings); // Safe fallback
    }
    
    // Cache the instance
    this.patternInstances.set(cacheKey, pattern);
    
    // Clean cache if it gets too large
    if (this.patternInstances.size > 20) {
      this.patternInstances.clear(); // Simple cleanup strategy
    }
    
    return pattern;
  }
  
  // Clear all cached instances (useful for memory management)
  static clearCache() {
    this.patternInstances.clear();
  }
}