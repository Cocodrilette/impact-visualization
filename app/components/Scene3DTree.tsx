import React, { useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { useTreeStore } from "../store/treeStore";
import Tree from "./Tree";
import Ground from "./Ground";
import { SkyElements } from "./SkyElements";
import { useUnergyMetricsData, useUnergyProjectsApi, fetchMinifarms } from "../hooks/api";
import { ApiTreeUpdater } from "./ApiTreeUpdater";
import ZoneBoundaries from "./ZoneBoundaries";
import ZoneControls from "./ZoneControls";
import { Zone } from "../store/treeStore";

// Componente para inicializar las zonas de árboles
const ZoneInitializer = () => {
  const { addZone, zones } = useTreeStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (zones.length === 0 && !isLoading) {
      // Marcar como cargando para evitar múltiples llamadas
      setIsLoading(true);
      
      const initializeZones = async () => {
        try {
          const minifarms = await fetchMinifarms();
          console.log("Minifarms data:", minifarms);
          
          if (minifarms.length === 0) {
            console.warn("No minifarms found, using default zones");
            // Usar valores por defecto si no hay minifarms
            createDefaultZones();
            return;
          }
          
          // Calcular el layout para las zonas
          const minifarmCount = minifarms.length;
          const zoneSpacing = 40; // Distancia entre zonas
          
          // Calcular dimensiones de la cuadrícula para las zonas
          const gridSize = Math.ceil(Math.sqrt(minifarmCount));
          let row = 0;
          let col = 0;
          
          minifarms.forEach((minifarm, index) => {
            // Calcular posición en la cuadrícula
            col = index % gridSize;
            row = Math.floor(index / gridSize);
            
            const x = (col - Math.floor(gridSize / 2)) * zoneSpacing;
            const z = (row - Math.floor(gridSize / 2)) * zoneSpacing;
            
            // Calcular tamaño de zona en función del número de árboles
            const baseSize = 20;
            const sizeMultiplier = 1;
            const width = baseSize + (minifarm.treeCount / 1000) * sizeMultiplier;
            const depth = baseSize + (minifarm.treeCount / 1000) * sizeMultiplier;
            
            // Crear la zona con datos de la minifarm
            addZone({
              name: minifarm.name,
              color: minifarm.color,
              position: { x, z },
              size: { width, depth },
              treeCount: minifarm.treeCount,
            });
          });
          
        } catch (error) {
          console.error("Error initializing zones:", error);
          // Si hay un error, crear zonas por defecto
          createDefaultZones();
        } finally {
          setIsLoading(false);
        }
      };
      
      initializeZones();
    }
  }, [addZone, zones.length, isLoading]);
  
  // Función para crear zonas predeterminadas si la API falla
  const createDefaultZones = () => {
    // Zona 1
    addZone({
      name: "Zona 1",
      color: "#4CAF50",
      position: { x: -40, z: 0 },
      size: { width: 30, depth: 30 },
      treeCount: 15,
    });
    
    // Zona 2
    addZone({
      name: "Zona 2",
      color: "#2196F3",
      position: { x: 0, z: -40 },
      size: { width: 25, depth: 25 },
      treeCount: 12,
    });
    
    // Zona 3
    addZone({
      name: "Zona 3",
      color: "#FFC107",
      position: { x: 40, z: 0 },
      size: { width: 35, depth: 30 },
      treeCount: 20,
    });
    
    // Zona 4
    addZone({
      name: "Zona 4",
      color: "#E91E63",
      position: { x: 0, z: 40 },
      size: { width: 28, depth: 28 },
      treeCount: 18,
    });
  };
  
  return null;
};

const TreesGroup = () => {
  const { trees, markTreesAsOld } = useTreeStore();
  const [labeledTree, setLabeledTree] = useState<number | null>(null);

  // Ya no necesitamos actualizar posiciones periódicamente, solo gestionar árboles nuevos
  useEffect(() => {
    const hasNewTree = trees.some((tree) => tree.isNew);

    if (hasNewTree) {
      // Wait for animation to complete before marking trees as old
      const timeout = setTimeout(() => {
        markTreesAsOld();
      }, 2000); // Animation duration + buffer

      return () => clearTimeout(timeout);
    }
  }, [trees, markTreesAsOld]);

  // Efecto para mostrar la etiqueta en un árbol aleatorio cada cierto tiempo
  useEffect(() => {
    const showRandomLabelInterval = setInterval(() => {
      if (trees.length > 0) {
        // Elegir un árbol aleatorio para mostrar su etiqueta
        const randomIndex = Math.floor(Math.random() * trees.length);
        setLabeledTree(trees[randomIndex].id);

        // Ocultar la etiqueta después de unos segundos
        setTimeout(() => {
          setLabeledTree(null);
        }, 5000);
      }
    }, 15000); // Cada 15 segundos muestra una etiqueta

    return () => clearInterval(showRandomLabelInterval);
  }, [trees]);

  return (
    <>
      {trees.map((tree) => {
        // Determinar variante del árbol basado en el ID
        // Para árboles existentes, usar ID para garantizar consistencia
        // Usando módulo para distribuir uniformemente entre las variantes
        const treeVariant = tree.id % 2 === 0 ? "spherical" : "lowpoly";

        // Generar una etiqueta informativa para el árbol
        const treeLabel = `CO2: -${(tree.id + 1) * 25}kg`;

        return (
          <Tree
            key={tree.id}
            position={[tree.x, 0, tree.z]}
            rotation={tree.rotation}
            scale={tree.scale || 1} // Usar la escala guardada en el árbol o 1 por defecto
            isNew={tree.isNew}
            variant={treeVariant}
            label={treeLabel}
            showLabel={tree.id === labeledTree}
          />
        );
      })}
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
    const distance = Math.max(20, gridSideLength * gridSize * 0.7);
    const height = Math.max(15, gridSideLength * 2);

    // Position the camera based on the grid size
    camera.position.set(0, height, distance);
    camera.lookAt(0, 0, 0);
  }, [camera, trees, treeCount, gridSize]);

  return null;
};

// Auto-increment handler component
const AutoIncrementHandler = () => {
  const { autoIncrementEnabled, autoIncrementInterval, incrementTreeCount } =
    useTreeStore();

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
    zones,
    setTreeCount,
    updateInterval,
    setUpdateInterval,
    autoIncrementEnabled,
    toggleAutoIncrement,
    autoIncrementInterval,
    setAutoIncrementInterval,
    gridSize,
    setGridSize,
    randomnessFactor,
    setRandomnessFactor,
    savedTreeCount,
  } = useTreeStore();
  const { data } = useUnergyMetricsData();
  console.log(data);

  return (
    <div className="h-full w-full relative">
      {/* Controls UI */}
      {/* <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-black/80 p-4 rounded-lg shadow max-h-[calc(100vh-8rem)] overflow-y-auto">
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
            <span className="text-xs text-gray-500">
              Controla la separación entre árboles en la cuadrícula
            </span>
          </div>

          <div>
            <label className="block mb-1">
              Randomness: {Math.round(randomnessFactor * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={randomnessFactor * 100}
              onChange={(e) =>
                setRandomnessFactor(parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
            <span className="text-xs text-gray-500">
              Desorden en la colocación de los árboles
            </span>
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
                Growth Speed: {(60000 / autoIncrementInterval).toFixed(1)}{" "}
                trees/min
              </label>
              <input
                type="range"
                min="500"
                max="10000"
                step="500"
                value={autoIncrementInterval}
                onChange={(e) =>
                  setAutoIncrementInterval(parseInt(e.target.value))
                }
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block mb-1">
              Update Interval: {updateInterval / 1000}s
            </label>
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
      </div> */}

      {/* Stats Panel */}
      <div className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-black/80 p-4 rounded-lg shadow">
        <h3 className="text-base font-medium">
          Árboles Salvados: {savedTreeCount}
        </h3>
        <ul className="space-y-1 text-xs">
          <li>Árboles generados: {treeCount}</li>
          <li>Zonas: {zones.length}</li>
        </ul>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows>
        <CameraSetup />
        <AutoIncrementHandler />
        <ZoneInitializer /> {/* Inicializar las zonas */}
        <OrbitControls enableDamping dampingFactor={0.05} />
        <color attach="background" args={["#87CEEB"]} />{" "}
        {/* Sky blue background */}
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
        <ApiTreeUpdater
          updateInterval={60000} // Comprobar actualizaciones cada minuto
          minTimeBetweenRequests={60000} // Mínimo 5 minutos entre peticiones reales
          incrementalAnimationInterval={100} // Velocidad de aparición de nuevos árboles
          enabled={true}
        />
        <TreesGroup />
        <ZoneBoundaries /> {/* Renderizar los límites de las zonas */}
        {/* <FixedText savedTress={savedTrees}/> */}
        {/* Add a grid helper for reference */}
        {/* Fog for distance effect */}
        <fog attach="fog" args={["#87CEEB", 30, 250]} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
