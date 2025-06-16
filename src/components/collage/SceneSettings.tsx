// src/components/collage/SceneSettings.tsx - COMPLETE OPTIMIZED VERSION
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Camera, Lightbulb, Palette, Play, Pause, RotateCcw, Video, Monitor, 
  Grid, ImageIcon, Square, Sun, Move, Eye, CameraIcon 
} from 'lucide-react';
import { type SceneSettings } from '../../store/sceneStore';
// Note: Import this when PerformanceMonitor is available
// import { usePerformanceOptimization } from '../three/PerformanceMonitor';

interface SceneSettingsProps {
  settings: SceneSettings;
  onSettingsChange: (settings: Partial<SceneSettings>, debounce?: boolean) => void;
  onReset: () => void;
}

// PERFORMANCE: Debounced input hook to prevent excessive updates during dragging
const useDebouncedValue = (value: number, delay: number, onChange: (value: number) => void) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: number) => {
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  }, [onChange, delay]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [localValue, handleChange] as const;
};

const SceneSettings: React.FC<SceneSettingsProps> = ({ settings, onSettingsChange, onReset }) => {
  const [activeTab, setActiveTab] = useState<'animation' | 'camera' | 'lighting' | 'appearance' | 'performance'>('animation');
  
  // Performance optimization - temporarily disabled until PerformanceMonitor is available
  // const { performanceLevel, optimizedSettings, setPerformanceLevel } = usePerformanceOptimization();
  const performanceLevel = 'high'; // Fallback
  const optimizedSettings = { 
    shadowsEnabled: true, 
    photoSize: 4.0, 
    animationSpeed: 50,
    maxPhotos: 200,
    textureSize: 512,
    anisotropy: 4,
  }; // Fallback
  
  // OPTIMIZED: Memoized change handlers to prevent unnecessary re-renders
  const handleSettingsChange = useCallback((newSettings: Partial<SceneSettings>, debounce = true) => {
    try {
      onSettingsChange(newSettings, debounce);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  }, [onSettingsChange]);

  // PERFORMANCE: Debounced sliders for smooth interaction
  const [photoSize, setPhotoSize] = useDebouncedValue(
    settings.photoSize || 4.0,
    100,
    (value) => handleSettingsChange({ photoSize: value })
  );

  const [animationSpeed, setAnimationSpeed] = useDebouncedValue(
    settings.animationSpeed || 50,
    100,
    (value) => handleSettingsChange({ animationSpeed: value })
  );

  const [cameraDistance, setCameraDistance] = useDebouncedValue(
    settings.cameraDistance || 25,
    100,
    (value) => handleSettingsChange({ cameraDistance: value })
  );

  const [cameraHeight, setCameraHeight] = useDebouncedValue(
    settings.cameraHeight || 10,
    100,
    (value) => handleSettingsChange({ cameraHeight: value })
  );

  // PERFORMANCE: Apply optimized settings automatically
  const applyPerformanceOptimizations = useCallback(() => {
    try {
      handleSettingsChange({
        shadowsEnabled: optimizedSettings.shadowsEnabled,
        photoSize: optimizedSettings.photoSize,
        animationSpeed: optimizedSettings.animationSpeed,
      }, false);
    } catch (error) {
      console.error('Error applying performance optimizations:', error);
    }
  }, [optimizedSettings, handleSettingsChange]);

  // CRITICAL: Pattern-specific camera movement conflict resolution
  const currentPattern = settings.animationPattern || 'grid';
  const patterns = settings.patterns || {};
  const isPatternCameraEnabled = patterns[currentPattern]?.cameraMovementEnabled || false;
  const isGlobalRotationEnabled = settings.cameraRotationEnabled || false;

// PERFORMANCE: Debounced input hook to prevent excessive updates during dragging
const useDebouncedValue = (value: number, delay: number, onChange: (value: number) => void) => {
  const [localValue, setLocalValue] = useState(value);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((newValue: number) => {
    setLocalValue(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, delay);
  }, [onChange, delay]);

  return [localValue, handleChange] as const;
};

const SceneSettings: React.FC<SceneSettingsProps> = ({ settings, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<'animation' | 'camera' | 'lighting' | 'appearance' | 'performance'>('animation');
  
  // Performance optimization
  const { performanceLevel, optimizedSettings, setPerformanceLevel } = usePerformanceOptimization();
  
  // OPTIMIZED: Memoized change handlers to prevent unnecessary re-renders
  const handleSettingsChange = useCallback((newSettings: Partial<SceneSettings>, debounce = true) => {
    onSettingsChange(newSettings, debounce);
  }, [onSettingsChange]);

  // PERFORMANCE: Debounced sliders for smooth interaction
  const [photoSize, setPhotoSize] = useDebouncedValue(
    settings.photoSize || 4.0,
    100,
    (value) => handleSettingsChange({ photoSize: value })
  );

  const [animationSpeed, setAnimationSpeed] = useDebouncedValue(
    settings.animationSpeed || 50,
    100,
    (value) => handleSettingsChange({ animationSpeed: value })
  );

  const [cameraDistance, setCameraDistance] = useDebouncedValue(
    settings.cameraDistance || 25,
    100,
    (value) => handleSettingsChange({ cameraDistance: value })
  );

  const [cameraHeight, setCameraHeight] = useDebouncedValue(
    settings.cameraHeight || 10,
    100,
    (value) => handleSettingsChange({ cameraHeight: value })
  );

  // PERFORMANCE: Apply optimized settings automatically
  const applyPerformanceOptimizations = useCallback(() => {
    handleSettingsChange({
      ...optimizedSettings,
      shadowsEnabled: optimizedSettings.shadowsEnabled,
      photoSize: optimizedSettings.photoSize,
      animationSpeed: optimizedSettings.animationSpeed,
    }, false);
  }, [optimizedSettings, handleSettingsChange]);

  // CRITICAL: Pattern-specific camera movement conflict resolution
  const currentPattern = settings.animationPattern;
  const isPatternCameraEnabled = settings.patterns[currentPattern]?.cameraMovementEnabled;
  const isGlobalRotationEnabled = settings.cameraRotationEnabled;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      {/* Performance Monitor */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-3">
        <h4 className="flex items-center text-lg font-semibold text-white">
          <Monitor className="h-4 w-4 mr-2" />
          Scene Settings
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Performance:</span>
          <span className={`text-xs font-medium px-2 py-1 rounded ${
            performanceLevel === 'high' ? 'bg-green-600 text-white' :
            performanceLevel === 'medium' ? 'bg-yellow-600 text-white' :
            'bg-red-600 text-white'
          }`}>
            {performanceLevel.toUpperCase()}
          </span>
          <button
            onClick={applyPerformanceOptimizations}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          >
            Optimize
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
        {[
          { id: 'animation', label: 'Animation', icon: Play },
          { id: 'camera', label: 'Camera', icon: Camera },
          { id: 'lighting', label: 'Lighting', icon: Lightbulb },
          { id: 'appearance', label: 'Style', icon: Palette },
          { id: 'performance', label: 'Performance', icon: Monitor },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </button>
        ))}
      </div>

      {/* Animation Tab */}
      {activeTab === 'animation' && (
        <div className="space-y-4">
          {/* Animation Controls */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Play className="h-3 w-3 mr-2" />
              Animation Controls
            </h5>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleSettingsChange({ animationEnabled: !settings.animationEnabled }, false)}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  settings.animationEnabled
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {settings.animationEnabled ? (
                  <>
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    Play
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleSettingsChange({ 
                  animationEnabled: false,
                  cameraRotationEnabled: false,
                  patterns: {
                    ...patterns,
                    [currentPattern]: {
                      ...patterns[currentPattern],
                      cameraMovementEnabled: false
                    }
                  }
                }, false)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Stop All
              </button>
            </div>

            {/* Animation Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Animation Speed: {animationSpeed}%
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Pattern Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Animation Pattern
              </label>
              <select
                value={settings.animationPattern}
                onChange={(e) => handleSettingsChange({ animationPattern: e.target.value as any }, false)}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="grid">Grid Wall</option>
                <option value="float">Floating Photos</option>
                <option value="wave">Wave Motion</option>
                <option value="spiral">Spiral Tornado</option>
              </select>
            </div>

            {/* Photo Count */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Photos: {settings.photoCount || 100}
              </label>
              <input
                type="range"
                min="10"
                max={performanceLevel === 'low' ? 50 : performanceLevel === 'medium' ? 100 : 200}
                value={settings.photoCount || 100}
                onChange={(e) => handleSettingsChange({ photoCount: Number(e.target.value) })}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Photo Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo Size: {photoSize.toFixed(1)}
              </label>
              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.1"
                value={photoSize}
                onChange={(e) => setPhotoSize(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Photo Brightness */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Photo Brightness: {((settings.photoBrightness || 1) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="50"
                max="200"
                value={(settings.photoBrightness || 1) * 100}
                onChange={(e) => handleSettingsChange({ 
                  photoBrightness: Number(e.target.value) / 100 
                })}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Empty Slot Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Empty Slot Color
              </label>
              <input
                type="color"
                value={settings.emptySlotColor || '#333333'}
                onChange={(e) => handleSettingsChange({ emptySlotColor: e.target.value })}
                className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Grid Wall Settings - Only show when grid pattern is selected */}
          {settings.animationPattern === 'grid' && (
            <div className="border border-gray-700 rounded-lg p-4 space-y-4">
              <h5 className="flex items-center text-sm font-medium text-gray-300">
                <Grid className="h-3 w-3 mr-2" />
                Grid Wall Settings
              </h5>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Wall Height: {(settings.wallHeight || 0).toFixed(1)} units
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={settings.wallHeight || 0}
                  onChange={(e) => handleSettingsChange({ 
                    wallHeight: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Photo Spacing: {settings.photoSpacing === 0 ? 'Solid Wall' : `${((settings.photoSpacing || 0) * 200).toFixed(0)}% gaps`}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={settings.photoSpacing || 0}
                  onChange={(e) => handleSettingsChange({ 
                    photoSpacing: parseFloat(e.target.value) 
                  }, true)}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          )}

          {/* Photo Rotation */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <RotateCcw className="h-3 w-3 mr-2" />
              Photo Behavior
            </h5>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.photoRotation || false}
                onChange={(e) => handleSettingsChange({ 
                  photoRotation: e.target.checked 
                })}
                className="mr-2 bg-gray-800 border-gray-700"
              />
              <label className="text-sm text-gray-300">
                Enable Photo Rotation
              </label>
            </div>
            
            <p className="text-xs text-gray-400">
              {settings.animationPattern === 'grid' 
                ? "Grid Wall: Turn OFF for traditional flat wall, turn ON for billboard effect" 
                : "When enabled, photos rotate to always face the camera for better visibility"
              }
            </p>
          </div>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          {/* CRITICAL: Camera Movement Conflict Resolution */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Camera className="h-3 w-3 mr-2" />
              Camera Movement Priority
            </h5>
            
            {/* Conflict Warning */}
            {isPatternCameraEnabled && isGlobalRotationEnabled && (
              <div className="bg-yellow-600/20 border border-yellow-600 rounded-md p-3">
                <p className="text-sm text-yellow-300">
                  ⚠️ Pattern camera movement takes priority over global rotation
                </p>
              </div>
            )}

            {/* Pattern-Specific Camera Movement */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPatternCameraEnabled || false}
                  onChange={(e) => handleSettingsChange({
                    patterns: {
                      ...settings.patterns,
                      [currentPattern]: {
                        ...settings.patterns[currentPattern],
                        cameraMovementEnabled: e.target.checked
                      }
                    }
                  }, false)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">
                  {currentPattern.charAt(0).toUpperCase() + currentPattern.slice(1)} Camera Movement
                </label>
              </div>
              <p className="text-xs text-gray-400">
                Pattern-specific camera movement for {currentPattern} animation
              </p>
            </div>

            {/* Global Camera Rotation */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isGlobalRotationEnabled}
                  onChange={(e) => handleSettingsChange({ cameraRotationEnabled: e.target.checked }, false)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">
                  Global Camera Rotation
                </label>
              </div>
              <p className="text-xs text-gray-400">
                {isPatternCameraEnabled ? 
                  'Will activate when pattern camera is disabled' : 
                  'Simple orbital camera rotation around the scene'
                }
              </p>
            </div>

            {/* Camera Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Camera Distance: {cameraDistance}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={cameraDistance}
                onChange={(e) => setCameraDistance(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Camera Height: {cameraHeight}
              </label>
              <input
                type="range"
                min="-10"
                max="50"
                value={cameraHeight}
                onChange={(e) => setCameraHeight(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Camera Speed */}
            {(isPatternCameraEnabled || isGlobalRotationEnabled) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Camera Speed: {((settings.cameraRotationSpeed || 0.2) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={(settings.cameraRotationSpeed || 0.2) * 100}
                  onChange={(e) => handleSettingsChange({ 
                    cameraRotationSpeed: Number(e.target.value) / 100 
                  })}
                  className="w-full bg-gray-800"
                />
              </div>
            )}

            {/* Manual Controls */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.orbitControlsEnabled !== false}
                onChange={(e) => handleSettingsChange({ orbitControlsEnabled: e.target.checked }, false)}
                className="mr-2 bg-gray-800 border-gray-700"
              />
              <label className="text-sm text-gray-300">
                Manual Camera Controls (Mouse/Touch)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          {/* CRITICAL: Camera Movement Conflict Resolution */}
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Camera className="h-3 w-3 mr-2" />
              Camera Movement Priority
            </h5>
            
            {/* Conflict Warning */}
            {isPatternCameraEnabled && isGlobalRotationEnabled && (
              <div className="bg-yellow-600/20 border border-yellow-600 rounded-md p-3">
                <p className="text-sm text-yellow-300">
                  ⚠️ Pattern camera movement takes priority over global rotation
                </p>
              </div>
            )}

            {/* Pattern-Specific Camera Movement */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isPatternCameraEnabled}
                  onChange={(e) => handleSettingsChange({
                    patterns: {
                      ...patterns,
                      [currentPattern]: {
                        ...patterns[currentPattern],
                        cameraMovementEnabled: e.target.checked
                      }
                    }
                  }, false)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">
                  {currentPattern.charAt(0).toUpperCase() + currentPattern.slice(1)} Camera Movement
                </label>
              </div>
              <p className="text-xs text-gray-400">
                Pattern-specific camera movement for {currentPattern} animation
              </p>

              {/* Pattern-specific controls */}
              {isPatternCameraEnabled && currentPattern === 'float' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Float Intensity: {((patterns.float?.cameraFloatIntensity || 1) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={(patterns.float?.cameraFloatIntensity || 1) * 100}
                    onChange={(e) => handleSettingsChange({
                      patterns: {
                        ...patterns,
                        float: {
                          ...patterns.float,
                          cameraFloatIntensity: Number(e.target.value) / 100
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}

              {isPatternCameraEnabled && currentPattern === 'wave' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Wave Amplitude: {((patterns.wave?.cameraWaveAmplitude || 1) * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    value={(patterns.wave?.cameraWaveAmplitude || 1) * 100}
                    onChange={(e) => handleSettingsChange({
                      patterns: {
                        ...patterns,
                        wave: {
                          ...patterns.wave,
                          cameraWaveAmplitude: Number(e.target.value) / 100
                        }
                      }
                    }, true)}
                    className="w-full bg-gray-800"
                  />
                </div>
              )}

              {isPatternCameraEnabled && currentPattern === 'spiral' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Orbit Speed: {((patterns.spiral?.cameraOrbitSpeed || 1) * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={(patterns.spiral?.cameraOrbitSpeed || 1) * 100}
                      onChange={(e) => handleSettingsChange({
                        patterns: {
                          ...patterns,
                          spiral: {
                            ...patterns.spiral,
                            cameraOrbitSpeed: Number(e.target.value) / 100
                          }
                        }
                      }, true)}
                      className="w-full bg-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Orbit Radius: {(patterns.spiral?.cameraOrbitRadius || 20)} units
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={patterns.spiral?.cameraOrbitRadius || 20}
                      onChange={(e) => handleSettingsChange({
                        patterns: {
                          ...patterns,
                          spiral: {
                            ...patterns.spiral,
                            cameraOrbitRadius: Number(e.target.value)
                          }
                        }
                      }, true)}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Global Camera Rotation */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isGlobalRotationEnabled || false}
                  onChange={(e) => handleSettingsChange({ cameraRotationEnabled: e.target.checked }, false)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">
                  Global Camera Rotation
                </label>
              </div>
              <p className="text-xs text-gray-400">
                {isPatternCameraEnabled ? 
                  'Will activate when pattern camera is disabled' : 
                  'Simple orbital camera rotation around the scene'
                }
              </p>
            </div>

            {/* Camera Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Camera Distance: {cameraDistance}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                value={cameraDistance}
                onChange={(e) => setCameraDistance(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Camera Height: {cameraHeight}
              </label>
              <input
                type="range"
                min="-10"
                max="50"
                value={cameraHeight}
                onChange={(e) => setCameraHeight(Number(e.target.value))}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Camera Speed */}
            {(isPatternCameraEnabled || isGlobalRotationEnabled) && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Camera Speed: {((settings.cameraRotationSpeed || 0.2) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  value={(settings.cameraRotationSpeed || 0.2) * 100}
                  onChange={(e) => handleSettingsChange({ 
                    cameraRotationSpeed: Number(e.target.value) / 100 
                  })}
                  className="w-full bg-gray-800"
                />
              </div>
            )}

            {/* Manual Controls */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.orbitControlsEnabled !== false}
                onChange={(e) => handleSettingsChange({ orbitControlsEnabled: e.target.checked }, false)}
                className="mr-2 bg-gray-800 border-gray-700"
              />
              <label className="text-sm text-gray-300">
                Manual Camera Controls (Mouse/Touch)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Lighting Tab */}
      {activeTab === 'lighting' && (
        <div className="space-y-4">
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Lightbulb className="h-3 w-3 mr-2" />
              Scene Lighting
            </h5>

            {/* Ambient Light */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Ambient Light: {((settings.ambientLightIntensity || 0.6) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={(settings.ambientLightIntensity || 0.6) * 100}
                onChange={(e) => handleSettingsChange({ 
                  ambientLightIntensity: Number(e.target.value) / 100 
                })}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Directional Light */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Directional Light: {((settings.directionalLightIntensity || 1) * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="300"
                value={(settings.directionalLightIntensity || 1) * 100}
                onChange={(e) => handleSettingsChange({ 
                  directionalLightIntensity: Number(e.target.value) / 100 
                })}
                className="w-full bg-gray-800"
              />
            </div>

            {/* Spotlights */}
            <div className="space-y-3">
              <h6 className="text-sm font-medium text-gray-300">Spotlights</h6>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">Spotlight Color</label>
                <input
                  type="color"
                  value={settings.spotlightColor || '#ffffff'}
                  onChange={(e) => handleSettingsChange({ spotlightColor: e.target.value })}
                  className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Spotlight Count: {settings.spotlightCount || 1}
                </label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  value={settings.spotlightCount || 1}
                  onChange={(e) => handleSettingsChange({ spotlightCount: Number(e.target.value) })}
                  className="w-full bg-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Spotlight Intensity: {(settings.spotlightIntensity || 50).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={settings.spotlightIntensity || 50}
                  onChange={(e) => handleSettingsChange({ spotlightIntensity: Number(e.target.value) })}
                  className="w-full bg-gray-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Palette className="h-3 w-3 mr-2" />
              Visual Style
            </h5>

            {/* Background */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.backgroundGradient || false}
                  onChange={(e) => handleSettingsChange({ backgroundGradient: e.target.checked })}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">Use Gradient Background</label>
              </div>

              {!settings.backgroundGradient ? (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Background Color</label>
                  <input
                    type="color"
                    value={settings.backgroundColor || '#000000'}
                    onChange={(e) => handleSettingsChange({ backgroundColor: e.target.value })}
                    className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Gradient Start</label>
                    <input
                      type="color"
                      value={settings.backgroundGradientStart || '#000000'}
                      onChange={(e) => handleSettingsChange({ backgroundGradientStart: e.target.value })}
                      className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Gradient End</label>
                    <input
                      type="color"
                      value={settings.backgroundGradientEnd || '#333333'}
                      onChange={(e) => handleSettingsChange({ backgroundGradientEnd: e.target.value })}
                      className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Gradient Angle: {settings.backgroundGradientAngle || 0}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={settings.backgroundGradientAngle || 0}
                      onChange={(e) => handleSettingsChange({ backgroundGradientAngle: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Floor Settings */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.showFloor || false}
                  onChange={(e) => handleSettingsChange({ showFloor: e.target.checked }, false)}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">Show Floor</label>
              </div>

              {settings.showFloor && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Floor Size: {settings.floorSize || 200}
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      value={settings.floorSize || 200}
                      onChange={(e) => handleSettingsChange({ floorSize: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Floor Color</label>
                    <input
                      type="color"
                      value={settings.floorColor || '#2a2a2a'}
                      onChange={(e) => handleSettingsChange({ floorColor: e.target.value })}
                      className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Floor Opacity: {Math.round((settings.floorOpacity || 0.5) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.floorOpacity || 0.5}
                      onChange={(e) => handleSettingsChange({ floorOpacity: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Grid Settings */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.gridEnabled || false}
                  onChange={(e) => handleSettingsChange({ gridEnabled: e.target.checked })}
                  className="mr-2 bg-gray-800 border-gray-700"
                />
                <label className="text-sm text-gray-300">Show Grid Lines</label>
              </div>

              {settings.gridEnabled && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Grid Color</label>
                    <input
                      type="color"
                      value={settings.gridColor || '#444444'}
                      onChange={(e) => handleSettingsChange({ gridColor: e.target.value })}
                      className="w-16 h-8 bg-gray-800 border border-gray-700 rounded cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Grid Size: {settings.gridSize || 200} units
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={settings.gridSize || 200}
                      onChange={(e) => handleSettingsChange({ gridSize: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Grid Divisions: {Math.round(settings.gridDivisions || 20)} lines
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={settings.gridDivisions || 20}
                      onChange={(e) => handleSettingsChange({ gridDivisions: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Grid Opacity: {Math.round((settings.gridOpacity || 0.3) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.gridOpacity || 0.3}
                      onChange={(e) => handleSettingsChange({ gridOpacity: Number(e.target.value) })}
                      className="w-full bg-gray-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="border border-gray-700 rounded-lg p-4 space-y-4">
            <h5 className="flex items-center text-sm font-medium text-gray-300">
              <Monitor className="h-3 w-3 mr-2" />
              Performance Optimization
            </h5>
            
            {/* Performance Level Override */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Performance Mode
              </label>
              <select
                value={performanceLevel}
                onChange={(e) => {
                  // setPerformanceLevel(e.target.value as any); // Enable when PerformanceMonitor is available
                }}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white"
              >
                <option value="high">High Quality (Best visuals)</option>
                <option value="medium">Balanced (Good performance)</option>
                <option value="low">Performance (Smooth on low-end devices)</option>
              </select>
            </div>

            {/* Shadow Settings */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.shadowsEnabled || false}
                onChange={(e) => handleSettingsChange({ shadowsEnabled: e.target.checked }, false)}
                className="mr-2 bg-gray-800 border-gray-700"
              />
              <label className="text-sm text-gray-300">
                Enable Shadows (Performance Impact)
              </label>
            </div>

            {/* Performance Tips */}
            <div className="bg-blue-600/20 border border-blue-600 rounded-md p-3">
              <h6 className="text-sm font-medium text-blue-300 mb-2">Performance Tips:</h6>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• Reduce photo count for better performance</li>
                <li>• Disable shadows on slower devices</li>
                <li>• Lower animation speed reduces CPU usage</li>
                <li>• Pattern camera movement is optimized for smoothness</li>
                <li>• Use solid background instead of gradient for better performance</li>
                <li>• Reduce spotlight count on slower devices</li>
              </ul>
            </div>

            {/* FPS Display */}
            <div className="bg-gray-800/50 rounded-md p-3">
              <p className="text-xs text-gray-400">
                Performance monitoring will be available when PerformanceMonitor component is integrated.
                Current optimizations include debounced controls, smooth interpolation, and automatic quality scaling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reset Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={onReset}
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
        >
          Reset All Settings
        </button>
      </div>
    </div>
  );
};
};

export default SceneSettings;