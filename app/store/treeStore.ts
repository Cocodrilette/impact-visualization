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
  randomOffset: { x: number; z: number }; // Offset para desorden controlado
}

interface ApiCache {
  lastFetched: number; // timestamp de la última petición exitosa
  data: any; // datos de la última respuesta
  expiresAt: number; // timestamp de expiración de la caché
}

interface TreeState {
  treeCount: number;
  trees: TreePosition[];
  updateInterval: number; // in milliseconds
  gridSize: number; // Spacing between trees
  randomnessFactor: number; // 0-1 factor para determinar cuánto desorden
  autoIncrementEnabled: boolean; // Auto increment trees
  autoIncrementInterval: number; // milliseconds
  
  // Nueva configuración para API
  apiUpdateEnabled: boolean; // Actualización desde API
  apiUpdateInterval: number; // Intervalo de actualización desde API
  apiUrl: string; // URL de la API
  apiTargetCount: number; // Cantidad objetivo de árboles según la API
  isIncrementalAnimationInProgress: boolean; // Indica si hay una animación incremental en progreso
  incrementalAnimationInterval: number; // Intervalo para la animación incremental
  
  // Control de caché y rate limiting
  apiCache: ApiCache | null;
  minTimeBetweenRequests: number; // tiempo mínimo entre peticiones en ms
  isRequestInProgress: boolean; // indica si hay una petición en curso
  
  updateTreePositions: () => void; // Función para actualizar posiciones de árboles
  setTreeCount: (count: number) => void;
  setUpdateInterval: (interval: number) => void;
  toggleAutoIncrement: () => void;
  setAutoIncrementInterval: (interval: number) => void;
  incrementTreeCount: () => void;
  markTreesAsOld: () => void;
  setGridSize: (size: number) => void;
  setRandomnessFactor: (factor: number) => void;
  
  // Nuevos métodos para API
  toggleApiUpdate: () => void;
  setApiUpdateInterval: (interval: number) => void;
  setApiUrl: (url: string) => void;
  updateTreesFromApi: () => Promise<void>;
  setApiTargetCount: (count: number) => void;
  startIncrementalAnimation: () => void;
  setIncrementalAnimationInterval: (interval: number) => void;
  setMinTimeBetweenRequests: (time: number) => void;
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

// Función optimizada para calcular posiciones en cuadrícula con desorden controlado
const calculateGridPositions = (
  count: number, 
  gridSize: number, 
  randomnessFactor: number,
  existingTrees: TreePosition[] = []
): TreePosition[] => {
  // Crear una copia del array existente
  const positions: TreePosition[] = [...existingTrees];
  
  // Número de árboles existentes
  const existingCount = existingTrees.length;
  
  // Número de nuevos árboles a crear
  const newTreeCount = count - existingCount;
  
  // Si estamos reduciendo árboles, simplemente devolver un subconjunto
  if (newTreeCount <= 0) {
    return positions.slice(0, count);
  }
  
  // Calcular dimensiones de la cuadrícula basadas en el total de árboles
  const gridSideLength = Math.ceil(Math.sqrt(count));
  
  // Crear un mapa de posiciones ocupadas para evitar duplicados
  const occupiedPositions = new Map();
  existingTrees.forEach(tree => {
    if (tree.gridRow !== undefined && tree.gridCol !== undefined) {
      occupiedPositions.set(`${tree.gridRow}-${tree.gridCol}`, true);
    }
  });
  
  // ID para los nuevos árboles
  let nextId = existingCount > 0 ? Math.max(...existingTrees.map(t => t.id)) + 1 : 0;
  
  // Contador para los nuevos árboles añadidos
  let newTreesAdded = 0;
  
  // Generar posiciones para los nuevos árboles
  for (let row = 0; row < gridSideLength && newTreesAdded < newTreeCount; row++) {
    for (let col = 0; col < gridSideLength && newTreesAdded < newTreeCount; col++) {
      // Verificar si esta posición ya está ocupada
      const posKey = `${row}-${col}`;
      if (!occupiedPositions.has(posKey)) {
        // Generar offset aleatorio para esta posición
        const randomOffset = generateRandomOffset(gridSize, randomnessFactor);
        
        // Generar una escala fija para este árbol
        const fixedScale = 0.8 + Math.random() * 0.4; // Entre 0.8 y 1.2
        
        // Generar una rotación fija para este árbol
        const fixedRotation = Math.random() * Math.PI * 2; // Entre 0 y 2π
        
        // Calcular posiciones centradas en el sistema de coordenadas 3D, con offset aleatorio
        const x = (col - (gridSideLength - 1) / 2) * gridSize + randomOffset.x;
        const z = (row - (gridSideLength - 1) / 2) * gridSize + randomOffset.z;
        
        positions.push({
          id: nextId++,
          x,
          z,
          rotation: fixedRotation,
          scale: fixedScale,
          isNew: true, // Marcar como nuevo para la animación
          gridRow: row, // Guardar coordenadas de la cuadrícula
          gridCol: col,
          randomOffset // Guardar el offset para mantenerlo consistente
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
    treeCount: 4, // Comenzar con pocos árboles
    trees: [],
    updateInterval: 5000, // Intervalo de actualización: 5 segundos
    gridSize: 5, // Espacio entre árboles
    randomnessFactor: 0.6, // Valor predeterminado: desorden moderado
    autoIncrementEnabled: false,
    autoIncrementInterval: 3000, // Incremento automático cada 3 segundos
    
    // Nueva configuración para API
    apiUpdateEnabled: false, // Actualización desde API desactivada por defecto
    apiUpdateInterval: 10000, // Intervalo de actualización desde API: 10 segundos
    apiUrl: '', // URL de la API vacía por defecto
    apiTargetCount: 0, // Cantidad objetivo de árboles según la API
    isIncrementalAnimationInProgress: false, // Indica si hay una animación incremental en progreso
    incrementalAnimationInterval: 1000, // Intervalo para la animación incremental
    
    // Control de caché y rate limiting
    apiCache: null,
    minTimeBetweenRequests: 60000, // 1 minuto por defecto
    isRequestInProgress: false,
    
    // Función para actualizar posiciones de árboles (ahora como parte del store)
    updateTreePositions: () => {
      // Esta función está desactivada pero la mantenemos por compatibilidad
      console.log("Tree position updates are now handled differently.");
    },
    
    setTreeCount: (count: number) => {
      set({ treeCount: count });
      const existingTrees = get().trees;
      
      // Pasar árboles existentes para mantener sus posiciones
      const updatedTrees = calculateGridPositions(
        count, 
        get().gridSize, 
        get().randomnessFactor,
        existingTrees
      );
      set({ trees: updatedTrees });
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
      // Incrementar en 1 sin límite superior
      const newCount = currentCount + 1;
      set({ treeCount: newCount });
      
      // Actualizar posiciones preservando árboles existentes
      const existingTrees = get().trees;
      const updatedTrees = calculateGridPositions(
        newCount, 
        get().gridSize, 
        get().randomnessFactor,
        existingTrees
      );
      set({ trees: updatedTrees });
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
      // Reorganizar todos los árboles cuando se cambia el tamaño de la cuadrícula
      const { treeCount, randomnessFactor } = get();
      // Iniciar con un array vacío para recalcular todas las posiciones
      const updatedTrees = calculateGridPositions(treeCount, size, randomnessFactor, []);
      set({ trees: updatedTrees });
    },
    
    // Ajustar el factor de aleatoriedad
    setRandomnessFactor: (factor: number) => {
      set({ randomnessFactor: factor });
      // Reorganizar todos los árboles cuando se cambia el factor de aleatoriedad
      const { treeCount, gridSize } = get();
      // Iniciar con un array vacío para recalcular todas las posiciones con el nuevo factor
      const updatedTrees = calculateGridPositions(treeCount, gridSize, factor, []);
      set({ trees: updatedTrees });
    },
    
    // Nuevos métodos para API
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
        console.log("API response:", data);
        
        // Verificar si el campo arboles_salvados existe en la respuesta
        if (data && data.arboles_salvados) {
          // Convertir el string a número
          const arbolesCount = Math.round(parseFloat(data.arboles_salvados));
          
          if (!isNaN(arbolesCount)) {
            // Calcular el número de árboles a mostrar (ajuste según necesidad)
            // Aquí dividimos por 10000 para tener un número manejable 
            const targetCount = Math.round(arbolesCount / 100);
            console.log(`API response: ${arbolesCount} trees, target count: ${targetCount}`);
            
            // Obtener el conteo actual de árboles
            const currentCount = get().treeCount;
            
            // Actualizar el conteo objetivo
            get().setApiTargetCount(targetCount);
            
            console.log(`API árboles: ${arbolesCount}, objetivo: ${targetCount}, actual: ${currentCount}`);
            
            if (targetCount > currentCount) {
              console.log(`Iniciando animación incremental para añadir ${targetCount - currentCount} árboles`);
              // Si es la primera carga de datos, mostrar uno por uno
              get().startIncrementalAnimation();
            } else if (targetCount < currentCount) {
              // Si hay menos árboles que antes (raro, pero posible), ajustar inmediatamente
              console.log(`Reduciendo árboles de ${currentCount} a ${targetCount}`);
              get().setTreeCount(targetCount);
            }
            // Si es igual, no hacemos nada
            
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
      const { apiTargetCount, treeCount, incrementalAnimationInterval } = get();
      if (apiTargetCount > treeCount) {
        set({ isIncrementalAnimationInProgress: true });
        const intervalId = setInterval(() => {
          const { treeCount, apiTargetCount } = get();
          if (treeCount < apiTargetCount) {
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
  }))
);

// Inicializar posiciones de los árboles cuando se crea el store
// Ya no necesitamos esta línea porque hemos definido la función en el store
// useTreeStore.getState().updateTreePositions = function() {}; // Desactivar la actualización automática

// Inicializar árboles
const initialTrees = calculateGridPositions(
  useTreeStore.getState().treeCount,
  useTreeStore.getState().gridSize,
  useTreeStore.getState().randomnessFactor,
  []
);

// Actualizar el store con los árboles iniciales
useTreeStore.setState({ trees: initialTrees });
