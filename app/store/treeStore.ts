import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface TreePosition {
  id: number;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  isNew: boolean;
  gridRow: number;
  gridCol: number;
  randomOffset: { x: number; z: number };
  zoneId: number; // ID de la zona a la que pertenece el árbol
}

interface Zone {
  id: number;
  name: string;
  color?: string;
  position: { x: number; z: number }; // Posición central de la zona
  size: { width: number; depth: number }; // Ancho y profundidad de la zona
  treeCount: number; // Número de árboles en la zona
  treesGenerated: number; // Número de árboles ya generados en la zona
}

interface ApiCache {
  lastFetched: number; // timestamp de la última petición exitosa
  data: any; // datos de la última respuesta
  expiresAt: number; // timestamp de expiración de la caché
}

interface TreeState {
  treeCount: number;
  trees: TreePosition[];
  zones: Zone[];
  updateInterval: number;
  gridSize: number;
  randomnessFactor: number;
  autoIncrementEnabled: boolean;
  autoIncrementInterval: number;
  
  // API configuration
  apiUpdateEnabled: boolean;
  apiUpdateInterval: number;
  apiUrl: string;
  apiTargetCount: number;
  isIncrementalAnimationInProgress: boolean;
  incrementalAnimationInterval: number;
  
  // Cache and rate limiting
  apiCache: ApiCache | null;
  minTimeBetweenRequests: number;
  isRequestInProgress: boolean;
  
  // Tree methods
  updateTreePositions: () => void;
  setTreeCount: (count: number) => void;
  setUpdateInterval: (interval: number) => void;
  toggleAutoIncrement: () => void;
  setAutoIncrementInterval: (interval: number) => void;
  incrementTreeCount: () => void;
  markTreesAsOld: () => void;
  setGridSize: (size: number) => void;
  setRandomnessFactor: (factor: number) => void;
  
  // API methods
  toggleApiUpdate: () => void;
  setApiUpdateInterval: (interval: number) => void;
  setApiUrl: (url: string) => void;
  updateTreesFromApi: () => Promise<void>;
  setApiTargetCount: (count: number) => void;
  startIncrementalAnimation: () => void;
  setIncrementalAnimationInterval: (interval: number) => void;
  setMinTimeBetweenRequests: (time: number) => void;
  
  // Zone methods
  addZone: (zone: Omit<Zone, 'id' | 'treesGenerated'>) => Zone;
  removeZone: (zoneId: number) => void;
  updateZone: (zone: Partial<Zone> & { id: number }) => void;
  incrementTreesInZone: (zoneId: number) => void;
  getTreesInZone: (zoneId: number) => TreePosition[];
  setTreeCountForZone: (zoneId: number, count: number) => void;
}

// Función para generar un offset aleatorio basado en el factor de aleatoriedad y tamaño de cuadrícula
const generateRandomOffset = (gridSize: number, randomnessFactor: number) => {
  // El offset máximo será un porcentaje del tamaño de celda de la cuadrícula
  const maxOffset = gridSize * 0.4 * randomnessFactor;
  return {
    x: (Math.random() * 2 - 1) * maxOffset,
    z: (Math.random() * 2 - 1) * maxOffset
  };
};

// Función para calcular posiciones en cuadrícula dentro de una zona específica
const calculateGridPositionsForZone = (
  count: number,
  gridSize: number,
  randomnessFactor: number,
  zone: Zone,
  existingTrees: TreePosition[] = [],
  zoneId: number
): TreePosition[] => {
  // Crear una copia del array existente
  const positions: TreePosition[] = [...existingTrees];
  
  // Número de árboles existentes en la zona
  const existingZoneTrees = existingTrees.filter(tree => tree.zoneId === zoneId);
  const existingCount = existingZoneTrees.length;
  
  // Número de nuevos árboles a crear
  const newTreeCount = count - existingCount;
  
  // Si estamos reduciendo árboles, simplemente devolver un subconjunto
  if (newTreeCount <= 0) {
    return positions.filter(tree => tree.zoneId !== zoneId).concat(existingZoneTrees.slice(0, count));
  }
  
  // Calcular dimensiones de la cuadrícula basadas en la proporción de la zona
  const aspectRatio = zone.size.width / zone.size.depth;
  let gridCols = Math.ceil(Math.sqrt(count * aspectRatio));
  let gridRows = Math.ceil(count / gridCols);
  
  // Asegurarse de que la cuadrícula cabe dentro de la zona
  const cellSizeX = zone.size.width / gridCols;
  const cellSizeZ = zone.size.depth / gridRows;
  
  // Crear un mapa de posiciones ocupadas para evitar duplicados
  const occupiedPositions = new Map();
  existingZoneTrees.forEach(tree => {
    if (tree.gridRow !== undefined && tree.gridCol !== undefined) {
      occupiedPositions.set(`${tree.gridRow}-${tree.gridCol}`, true);
    }
  });
  
  // ID para los nuevos árboles
  let nextId = positions.length > 0 ? Math.max(...positions.map(t => t.id)) + 1 : 0;
  
  // Contador para los nuevos árboles añadidos
  let newTreesAdded = 0;
  
  // Generar posiciones para los nuevos árboles dentro de la zona
  for (let row = 0; row < gridRows && newTreesAdded < newTreeCount; row++) {
    for (let col = 0; col < gridCols && newTreesAdded < newTreeCount; col++) {
      // Verificar si esta posición ya está ocupada
      const posKey = `${row}-${col}`;
      if (!occupiedPositions.has(posKey)) {
        // Generar offset aleatorio para esta posición
        const randomOffset = generateRandomOffset(gridSize, randomnessFactor);
        
        // Generar una escala fija para este árbol
        const fixedScale = 0.8 + Math.random() * 0.4; // Entre 0.8 y 1.2
        
        // Generar una rotación fija para este árbol
        const fixedRotation = Math.random() * Math.PI * 2; // Entre 0 y 2π
        
        // Calcular posiciones dentro de la zona, con offset aleatorio
        const x = zone.position.x - zone.size.width / 2 + cellSizeX * (col + 0.5) + randomOffset.x;
        const z = zone.position.z - zone.size.depth / 2 + cellSizeZ * (row + 0.5) + randomOffset.z;
        
        positions.push({
          id: nextId++,
          x,
          z,
          rotation: fixedRotation,
          scale: fixedScale,
          isNew: true,
          gridRow: row,
          gridCol: col,
          randomOffset,
          zoneId
        });
        
        // Marcar esta posición como ocupada
        occupiedPositions.set(posKey, true);
        newTreesAdded++;
      }
    }
  }
  
  return positions;
};

export const useTreeStore = create<TreeState>()(
  subscribeWithSelector((set, get) => ({
    treeCount: 0,
    trees: [],
    zones: [],
    updateInterval: 5000,
    gridSize: 5,
    randomnessFactor: 0.6,
    autoIncrementEnabled: false,
    autoIncrementInterval: 3000,
    
    // API configuration
    apiUpdateEnabled: false,
    apiUpdateInterval: 10000,
    apiUrl: process.env.NEXT_PUBLIC_UNERGY_METRICS_API || "",
    apiTargetCount: 0,
    isIncrementalAnimationInProgress: false,
    incrementalAnimationInterval: 1000,
    
    // Cache and rate limiting
    apiCache: null,
    minTimeBetweenRequests: 60000,
    isRequestInProgress: false,
    
    // Función para actualizar posiciones de árboles
    updateTreePositions: () => {
      console.log("Tree position updates are now handled differently.");
    },
    
    setTreeCount: (count: number) => {
      set({ treeCount: count });
    },
    
    setUpdateInterval: (interval: number) => {
      set({ updateInterval: interval });
    },
    
    toggleAutoIncrement: () => {
      set(state => ({ autoIncrementEnabled: !state.autoIncrementEnabled }));
    },
    
    setAutoIncrementInterval: (interval: number) => {
      set({ autoIncrementInterval: interval });
    },
    
    incrementTreeCount: () => {
      const currentCount = get().treeCount;
      const newCount = currentCount + 1;
      set({ treeCount: newCount });
      
      // Si hay zonas, incrementar un árbol en una zona aleatoria
      const { zones } = get();
      if (zones.length > 0) {
        const availableZones = zones.filter(zone => zone.treesGenerated < zone.treeCount);
        if (availableZones.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableZones.length);
          const targetZone = availableZones[randomIndex];
          get().incrementTreesInZone(targetZone.id);
        }
      }
    },
    
    // Marcar todos los árboles como viejos después de completar la animación
    markTreesAsOld: () => {
      set(state => ({
        trees: state.trees.map(tree => ({ ...tree, isNew: false }))
      }));
    },
    
    // Ajustar el tamaño de la cuadrícula
    setGridSize: (size: number) => {
      set({ gridSize: size });
    },
    
    // Ajustar el factor de aleatoriedad
    setRandomnessFactor: (factor: number) => {
      set({ randomnessFactor: factor });
    },
    
    // API methods
    toggleApiUpdate: () => {
      set(state => ({ apiUpdateEnabled: !state.apiUpdateEnabled }));
    },
    
    setApiUpdateInterval: (interval: number) => {
      set({ apiUpdateInterval: interval });
    },
    
    setApiUrl: (url: string) => {
      set({ apiUrl: url });
    },
    
    updateTreesFromApi: async () => {
      const { apiUrl, isIncrementalAnimationInProgress, apiCache, minTimeBetweenRequests, isRequestInProgress } = get();
      
      // No hacer nada si una animación incremental ya está en progreso
      if (isIncrementalAnimationInProgress) {
        console.log("Incremental animation in progress, skipping API update");
        return;
      }
      
      if (!apiUrl) {
        console.error("API URL is not set.");
        return;
      }
      
      // Verificar si hay una petición en curso
      if (isRequestInProgress) {
        console.log("Request already in progress, skipping API update");
        return;
      }
      
      // Verificar si la caché es válida
      const now = Date.now();
      if (apiCache && apiCache.expiresAt > now) {
        console.log("Using cached data");
        get().setApiTargetCount(apiCache.data.arboles_salvados);
        return;
      }
      
      // Verificar si se ha respetado el tiempo mínimo entre peticiones
      if (apiCache && now - apiCache.lastFetched < minTimeBetweenRequests) {
        console.log("Too soon since last request, skipping API update");
        return;
      }
      
      set({ isRequestInProgress: true });
      
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Verificar si el campo arboles_salvados existe en la respuesta
        if (data && data.arboles_salvados) {
          // Convertir el string a número
          const arbolesCount = Math.round(parseFloat(data.arboles_salvados));
          
          if (!isNaN(arbolesCount)) {
            // Calcular el número de árboles a mostrar (ajuste según necesidad)
            // Aquí dividimos por 1000 para tener un número manejable 
            const targetCount = Math.round(arbolesCount / 1000);
            
            // Obtener el conteo actual de árboles
            const currentCount = get().trees.length;
            
            // Actualizar el conteo objetivo
            get().setApiTargetCount(targetCount);
            
            console.log(`API árboles: ${arbolesCount}, objetivo: ${targetCount}, actual: ${currentCount}`);
            
            // Si hay zonas, distribuir los árboles entre las zonas existentes
            const { zones } = get();
            if (zones.length > 0) {
              const treesToAdd = targetCount - currentCount;
              if (treesToAdd > 0) {
                // Distribuir proporcionalmente entre las zonas
                const treesPerZone = Math.floor(treesToAdd / zones.length);
                const remainder = treesToAdd % zones.length;
                
                zones.forEach((zone, index) => {
                  const zoneAdd = treesPerZone + (index < remainder ? 1 : 0);
                  if (zoneAdd > 0) {
                    get().updateZone({
                      id: zone.id,
                      treeCount: zone.treeCount + zoneAdd
                    });
                  }
                });
              }
            } else if (targetCount > currentCount) {
              console.log(`Iniciando animación incremental para añadir ${targetCount - currentCount} árboles`);
              // Si es la primera carga de datos, mostrar uno por uno
              get().startIncrementalAnimation();
            } else if (targetCount < currentCount) {
              // Si hay menos árboles que antes (raro, pero posible), ajustar inmediatamente
              console.log(`Reduciendo árboles de ${currentCount} a ${targetCount}`);
              set({ trees: get().trees.slice(0, targetCount) });
            }
            
            // Actualizar la caché
            set({
              apiCache: {
                lastFetched: now,
                data,
                expiresAt: now + minTimeBetweenRequests
              }
            });
          }
        } else {
          console.warn("Response format not recognized: missing 'arboles_salvados' field");
        }
      } catch (error) {
        console.error("Failed to update trees from API:", error);
      } finally {
        set({ isRequestInProgress: false });
      }
    },
    
    setApiTargetCount: (count: number) => {
      set({ apiTargetCount: count });
    },
    
    startIncrementalAnimation: () => {
      const { apiTargetCount, trees, incrementalAnimationInterval } = get();
      const currentCount = trees.length;
      
      if (apiTargetCount > currentCount) {
        set({ isIncrementalAnimationInProgress: true });
        
        const intervalId = setInterval(() => {
          const { trees, apiTargetCount } = get();
          if (trees.length < apiTargetCount) {
            get().incrementTreeCount();
          } else {
            clearInterval(intervalId);
            set({ isIncrementalAnimationInProgress: false });
          }
        }, incrementalAnimationInterval);
      }
    },
    
    setIncrementalAnimationInterval: (interval: number) => {
      set({ incrementalAnimationInterval: interval });
    },
    
    setMinTimeBetweenRequests: (time: number) => {
      set({ minTimeBetweenRequests: time });
    },
    
    // Zone methods
    addZone: (zone) => {
      const { zones } = get();
      const newZone: Zone = {
        ...zone,
        id: zones.length > 0 ? Math.max(...zones.map(z => z.id)) + 1 : 1,
        treesGenerated: 0
      };
      
      set({ zones: [...zones, newZone] });
      return newZone;
    },
    
    removeZone: (zoneId) => {
      const { zones, trees } = get();
      // Eliminar la zona
      const updatedZones = zones.filter(zone => zone.id !== zoneId);
      // Eliminar los árboles de la zona
      const updatedTrees = trees.filter(tree => tree.zoneId !== zoneId);
      
      set({ 
        zones: updatedZones,
        trees: updatedTrees
      });
    },
    
    updateZone: (zoneUpdate) => {
      const { zones } = get();
      const updatedZones = zones.map(zone => 
        zone.id === zoneUpdate.id ? { ...zone, ...zoneUpdate } : zone
      );
      
      set({ zones: updatedZones });
      
      // Si el número de árboles se actualizó, regenerar árboles
      const updatedZone = updatedZones.find(z => z.id === zoneUpdate.id);
      if (updatedZone && 'treeCount' in zoneUpdate) {
        const targetCount = zoneUpdate.treeCount as number;
        
        // Iniciar generación incremental si se están añadiendo árboles
        if (targetCount > updatedZone.treesGenerated) {
          const intervalId = setInterval(() => {
            const { zones } = get();
            const currentZone = zones.find(z => z.id === zoneUpdate.id);
            if (currentZone && currentZone.treesGenerated < targetCount) {
              get().incrementTreesInZone(zoneUpdate.id);
            } else {
              clearInterval(intervalId);
            }
          }, get().incrementalAnimationInterval);
        } else if (targetCount < updatedZone.treesGenerated) {
          // Reducir árboles inmediatamente
          get().setTreeCountForZone(zoneUpdate.id, targetCount);
        }
      }
    },
    
    incrementTreesInZone: (zoneId) => {
      const { zones, trees, gridSize, randomnessFactor } = get();
      const zone = zones.find(z => z.id === zoneId);
      
      if (!zone) return;
      
      if (zone.treesGenerated < zone.treeCount) {
        // Añadir un nuevo árbol a la zona
        const updatedTrees = calculateGridPositionsForZone(
          zone.treesGenerated + 1,
          gridSize,
          randomnessFactor,
          zone,
          trees,
          zoneId
        );
        
        // Actualizar el contador de árboles generados en la zona
        const updatedZones = zones.map(z => 
          z.id === zoneId ? { ...z, treesGenerated: z.treesGenerated + 1 } : z
        );
        
        set({ 
          trees: updatedTrees,
          zones: updatedZones,
          treeCount: updatedTrees.length
        });
      }
    },
    
    getTreesInZone: (zoneId) => {
      return get().trees.filter(tree => tree.zoneId === zoneId);
    },
    
    setTreeCountForZone: (zoneId, count) => {
      const { zones, trees, gridSize, randomnessFactor } = get();
      const zone = zones.find(z => z.id === zoneId);
      
      if (!zone) return;
      
      // Eliminar los árboles existentes de esta zona
      let updatedTrees = trees.filter(tree => tree.zoneId !== zoneId);
      
      if (count > 0) {
        // Generar nuevos árboles para la zona
        updatedTrees = calculateGridPositionsForZone(
          count,
          gridSize,
          randomnessFactor,
          zone,
          updatedTrees,
          zoneId
        );
      }
      
      // Actualizar la zona con el nuevo conteo
      const updatedZones = zones.map(z => 
        z.id === zoneId ? { ...z, treeCount: count, treesGenerated: count } : z
      );
      
      set({ 
        trees: updatedTrees, 
        zones: updatedZones,
        treeCount: updatedTrees.length
      });
    }
  }))
);
