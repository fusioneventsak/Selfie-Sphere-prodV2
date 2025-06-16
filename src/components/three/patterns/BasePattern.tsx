// src/components/three/patterns/BasePattern.tsx - FIXED: Unified structure
import { type SceneSettings } from '../../../store/sceneStore';

export type Photo = {
  id: string;
  url: string;
  collage_id?: string;
};

export type Position = [number, number, number];

export interface PatternProps {
  photos: Photo[];
  settings: SceneSettings;
}

export interface PatternState {
  positions: Position[];
  rotations?: [number, number, number][];
}

// OPTIMIZED: Base pattern with performance improvements and consistent structure
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
    return `${this.settings.animationPattern}-${roundedTime}-${this.settings.photoCount}-${this.settings.animationSpeed}-${this.settings.floorSize}`;
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
    
    // Clean old cache entries
    if (this.positionCache.size > 100) {
      const oldestKey = this.positionCache.keys().next().value;
      this.positionCache.delete(oldestKey);
      this.cacheTimestamps.delete(oldestKey);
    }
    
    return state;
  }

  // ABSTRACT: Each pattern implements this method
  protected abstract generatePositionsInternal(time: number): PatternState;

  // UPDATE: Method to update settings without recreating the pattern
  updateSettings(newSettings: SceneSettings) {
    this.settings = newSettings;
    // Clear cache when settings change
    this.positionCache.clear();
    this.cacheTimestamps.clear();
  }
}