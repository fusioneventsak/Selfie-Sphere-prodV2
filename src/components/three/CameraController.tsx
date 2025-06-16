// src/components/three/CameraController.tsx - Updated with dynamic movement patterns
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { type SceneSettings } from '../../store/sceneStore';
import CameraMovementSystem from './CameraMovementSystem';

interface CameraControllerProps {
  settings: SceneSettings;
}

const CameraController: React.FC<CameraControllerProps> = ({ settings }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>();
  const manualControlDetected = useRef(false);
  const lastUserInteraction = useRef(0);
  const cameraMovementEnabled = useRef(true);

  // Camera movement is enabled when:
  // 1. Camera is enabled in settings
  // 2. Auto rotation is enabled
  // 3. User hasn't manually interacted recently (within 5 seconds)
  const shouldUseAutomaticMovement = settings.cameraEnabled && 
                                   settings.cameraRotationEnabled && 
                                   cameraMovementEnabled.current;

  // Detect user interaction with orbit controls
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      manualControlDetected.current = true;
      lastUserInteraction.current = Date.now();
      cameraMovementEnabled.current = false;
    };

    const handleEnd = () => {
      // Re-enable automatic movement after 5 seconds of no interaction
      setTimeout(() => {
        if (Date.now() - lastUserInteraction.current >= 5000) {
          cameraMovementEnabled.current = true;
          manualControlDetected.current = false;
        }
      }, 5000);
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  // Reset camera movement when settings change
  useEffect(() => {
    if (settings.cameraRotationEnabled) {
      cameraMovementEnabled.current = true;
      manualControlDetected.current = false;
    }
  }, [settings.cameraRotationEnabled, settings.animationPattern]);

  return (
    <>
      {/* Dynamic Camera Movement System */}
      <CameraMovementSystem 
        settings={settings}
        enabled={shouldUseAutomaticMovement}
      />

      {/* Orbit Controls for Manual Control */}
      <OrbitControls
        ref={controlsRef}
        camera={camera}
        domElement={gl.domElement}
        enabled={settings.cameraEnabled}
        enableDamping={true}
        dampingFactor={0.05}
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        autoRotate={false} // We handle auto-rotation with our custom system
        autoRotateSpeed={0}
        minDistance={5}
        maxDistance={200}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        target={[0, settings.wallHeight || 0, 0]}
      />

      {/* Camera Configuration */}
      <PerspectiveCamera
        makeDefault
        position={[0, settings.cameraHeight || 10, settings.cameraDistance || 25]}
        fov={75}
        near={0.1}
        far={1000}
      />
    </>
  );
};

export default CameraController;