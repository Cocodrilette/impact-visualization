import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTreeStore } from '../store/treeStore';
import Tree from './Tree';
import Ground from './Ground';

const TreesGroup = () => {
  const { trees, updateInterval, updateTreePositions, markTreesAsOld } = useTreeStore();
  
  // Set up interval to update tree rotations (not positions)
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateTreePositions();
    }, updateInterval);
    
    return () => clearInterval(intervalId);
  }, [updateInterval, updateTreePositions]);
  
  // Mark trees as old after animation completes
  useEffect(() => {
    const hasNewTree = trees.some(tree => tree.isNew);
    
    if (hasNewTree) {
      // Wait for animation to complete before marking trees as old
      const timeout = setTimeout(() => {
        markTreesAsOld();
      }, 2000); // Animation duration + buffer
      
      return () => clearTimeout(timeout);
    }
  }, [trees, markTreesAsOld]);
  
  return (
    <>
      {trees.map((tree) => (
        <Tree 
          key={tree.id} 
          position={[tree.x, 0, tree.z]} 
          rotation={tree.rotation} 
          scale={0.8 + Math.random() * 0.4} 
          isNew={tree.isNew}
        />
      ))}
    </>
  );
};

// Camera control and setup with auto-adjustment based on tree count
const CameraSetup = () => {
  const { camera } = useThree();
  const { trees, treeCount, gridSize } = useTreeStore();
  
  useEffect(() => {
    // Calculate camera position based on tree grid size
    const gridSideLength = Math.ceil(Math.sqrt(treeCount));
    
    // Calculate required distance to view all trees
    // The higher the tree count, the further away the camera needs to be
    const distance = Math.max(20, gridSideLength * gridSize * 0.8);
    const height = Math.max(15, gridSideLength * 2.5);
    
    // Position the camera based on the grid size
    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0);
  }, [camera, trees, treeCount, gridSize]);
  
  return null;
};

// Auto-increment handler component
const AutoIncrementHandler = () => {
  const { autoIncrementEnabled, autoIncrementInterval, incrementTreeCount } = useTreeStore();
  
  useEffect(() => {
    if (!autoIncrementEnabled) return;
    
    const intervalId = setInterval(() => {
      incrementTreeCount();
    }, autoIncrementInterval);
    
    return () => clearInterval(intervalId);
  }, [autoIncrementEnabled, autoIncrementInterval, incrementTreeCount]);
  
  return null;
};

// Main Scene component
export const Scene3D = () => {
  const { 
    treeCount, 
    setTreeCount, 
    updateInterval, 
    setUpdateInterval,
    autoIncrementEnabled,
    toggleAutoIncrement,
    autoIncrementInterval,
    setAutoIncrementInterval,
    gridSize,
    setGridSize
  } = useTreeStore();

  return (
    <div className="h-full w-full relative">
      {/* Controls UI */}
      <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 p-4 rounded-lg shadow max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Controls</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Tree Count: {treeCount}</label>
            <input
              type="range"
              min="1"
              max="500"
              value={treeCount}
              onChange={(e) => setTreeCount(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block mb-1">Grid Spacing: {gridSize}</label>
            <input
              type="range"
              min="3"
              max="20"
              value={gridSize}
              onChange={(e) => setGridSize(parseInt(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-gray-500">Controla la separación entre árboles en la cuadrícula</span>
          </div>
          
          <div>
            <label className="block mb-1">Auto Increment Trees</label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoIncrementEnabled}
                onChange={toggleAutoIncrement}
                className="h-4 w-4"
              />
              <span>{autoIncrementEnabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>
          
          {autoIncrementEnabled && (
            <div>
              <label className="block mb-1">
                Growth Speed: {(60000 / autoIncrementInterval).toFixed(1)} trees/min
              </label>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={autoIncrementInterval}
                onChange={(e) => setAutoIncrementInterval(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
          
          <div>
            <label className="block mb-1">Update Interval: {updateInterval / 1000}s</label>
            <input
              type="range"
              min="1000"
              max="10000"
              step="500"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* Stats Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-black/80 p-4 rounded-lg shadow">
        <h3 className="text-base font-medium mb-2">Estadísticas</h3>
        <ul className="space-y-1 text-sm">
          <li>Árboles: {treeCount}</li>
          <li>Dimensión: {Math.ceil(Math.sqrt(treeCount))}x{Math.ceil(Math.sqrt(treeCount))}</li>
          <li>Separación: {gridSize} unidades</li>
        </ul>
      </div>
      
      {/* 3D Canvas */}
      <Canvas shadows>
        <CameraSetup />
        <AutoIncrementHandler />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <color attach="background" args={['#87CEEB']} /> {/* Sky blue background */}
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <hemisphereLight intensity={0.5} groundColor="#382b1d" />
        <directionalLight
          position={[50, 50, 25]}
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={100}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={50}
          shadow-camera-bottom={-50}
        />
        
        {/* Scene Elements */}
        <Ground size={1000} /> {/* Larger ground to accommodate more trees */}
        <TreesGroup />
        
        {/* Fog for distance effect */}
        <fog attach="fog" args={['#87CEEB', 30, 250]} />
      </Canvas>
    </div>
  );
};

export default Scene3D;