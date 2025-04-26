import React, { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useTreeStore } from '../store/treeStore';
import { useHouseStore } from '../store/houseStore';
import House from './House';
import Ground from './Ground';
import { SkyElements } from './SkyElements';

const HousesGroup = () => {
  const { houses, updateInterval, updateHousePositions, markHousesAsOld } = useHouseStore();
  
  // Ya no necesitamos actualizar posiciones periódicamente, solo gestionar árboles nuevos
  useEffect(() => {
    const hasNewTree = houses.some(tree => tree.isNew);
    
    if (hasNewTree) {
      // Wait for animation to complete before marking trees as old
      const timeout = setTimeout(() => {
        markHousesAsOld();
      }, 2000); // Animation duration + buffer
      
      return () => clearTimeout(timeout);
    }
  }, [houses, markHousesAsOld]);
  
  return (
    <>
      {houses.map((house) => (
        <House
          key={house.id}
          id={house.id}
          position={[house.x, 0, house.z]}
          rotation={house.rotation}
          scale={house.scale || 1} // Usar la escala guardada en el árbol o 1 por defecto
          isNew={house.isNew}
          color={house.color}
          roofColor={house.roofColor}
        />
      ))}
    </>
  );
}

// Camera control and setup with auto-adjustment based on tree count
const CameraSetup = () => {
  const { camera } = useThree();
  const { houses, houseCount, gridSize } = useHouseStore();
  
  useEffect(() => {
    // Calculate camera position based on tree grid size
    const gridSideLength = Math.ceil(Math.sqrt(houseCount));
    
    // Calculate required distance to view all trees
    // The higher the tree count, the further away the camera needs to be
    const distance = Math.max(20, gridSideLength * gridSize * 0.7);
    const height = Math.max(15, gridSideLength * 2);
    
    // Position the camera based on the grid size
    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0);
  }, [camera, houses, houseCount, gridSize]);
  
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
    houseCount, 
    setHouseCount, 
    updateInterval, 
    setUpdateInterval,
    autoIncrementEnabled,
    toggleAutoIncrement,
    autoIncrementInterval,
    setAutoIncrementInterval,
    gridSize,
    setGridSize,
    randomnessFactor,
    setRandomnessFactor
  } = useHouseStore();

  return (
    <div className="h-full w-full relative">
      {/* Controls UI */}
      <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 p-4 rounded-lg shadow max-h-[calc(100vh-8rem)] overflow-y-auto">
        <h2 className="text-lg font-bold mb-2">Controls</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">House Count: {houseCount}</label>
            <input
              type="range"
              min="1"
              max="500"
              value={houseCount}
              onChange={(e) => setHouseCount(parseInt(e.target.value))}
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
            <span className="text-xs text-gray-500">Controla la separación entre casas en la cuadrícula</span>
          </div>
          
          <div>
            <label className="block mb-1">Randomness: {Math.round(randomnessFactor * 100)}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={randomnessFactor * 100}
              onChange={(e) => setRandomnessFactor(parseInt(e.target.value) / 100)}
              className="w-full"
            />
            <span className="text-xs text-gray-500">Desorden en la colocación de las casas</span>
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
          <li>Árboles: {houseCount}</li>
          <li>Dimensión: {Math.ceil(Math.sqrt(houseCount))}x{Math.ceil(Math.sqrt(houseCount))}</li>
          <li>Separación: {gridSize} unidades</li>
          <li>Aleatoriedad: {Math.round(randomnessFactor * 100)}%</li>
        </ul>
      </div>
      
      {/* 3D Canvas */}
      <Canvas shadows>
        <CameraSetup />
        <AutoIncrementHandler />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <color attach="background" args={['#87CEEB']} /> {/* Sky blue background */}
        
        {/* Sky Elements */}
        <SkyElements />
        
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
        <HousesGroup />
        
        {/* Add a grid helper for reference */}
        
        {/* Fog for distance effect */}
        <fog attach="fog" args={['#87CEEB', 30, 250]} />
      </Canvas>
    </div>
  );
};

export default Scene3D;