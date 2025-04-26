import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface TreePosition {
  id: number;
  x: number;
  z: number;
  rotation: number;
  isNew: boolean;
  gridRow: number; // Añadimos coordenadas de la cuadrícula para mejor organización
  gridCol: number;
}

interface TreeState {
  treeCount: number;
  trees: TreePosition[];
  updateInterval: number; // in milliseconds
  gridSize: number; // Spacing between trees
  autoIncrementEnabled: boolean; // Auto increment trees
  autoIncrementInterval: number; // milliseconds
  setTreeCount: (count: number) => void;
  setUpdateInterval: (interval: number) => void;
  updateTreePositions: () => void;
  toggleAutoIncrement: () => void;
  setAutoIncrementInterval: (interval: number) => void;
  incrementTreeCount: () => void;
  markTreesAsOld: () => void;
  setGridSize: (size: number) => void;
}

// Función optimizada para calcular posiciones en cuadrícula
const calculateGridPositions = (count: number, gridSize: number, existingTrees: TreePosition[] = []): TreePosition[] => {
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
        // Calcular posiciones centradas en el sistema de coordenadas 3D
        const x = (col - (gridSideLength - 1) / 2) * gridSize;
        const z = (row - (gridSideLength - 1) / 2) * gridSize;
        
        positions.push({
          id: nextId++,
          x,
          z,
          rotation: Math.random() * Math.PI * 2, // Rotación aleatoria fija
          isNew: true, // Marcar como nuevo para la animación
          gridRow: row, // Guardar coordenadas de la cuadrícula
          gridCol: col
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
    autoIncrementEnabled: false,
    autoIncrementInterval: 3000, // Incremento automático cada 3 segundos
    
    setTreeCount: (count: number) => {
      set({ treeCount: count });
      const existingTrees = get().trees;
      
      // Pasar árboles existentes para mantener sus posiciones
      const updatedTrees = calculateGridPositions(count, get().gridSize, existingTrees);
      set({ trees: updatedTrees });
    },
    
    setUpdateInterval: (interval: number) => {
      set({ updateInterval: interval });
    },
    
    updateTreePositions: () => {
      const { treeCount, gridSize, trees } = get();
      
      // Preservar posiciones y rotaciones de árboles existentes
      const updatedTrees = calculateGridPositions(treeCount, gridSize, trees);
      set({ trees: updatedTrees });
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
      const updatedTrees = calculateGridPositions(newCount, get().gridSize, existingTrees);
      set({ trees: updatedTrees });
    },
    
    // Marcar todos los árboles como viejos después de completar la animación
    markTreesAsOld: () => {
      set(state => ({
        trees: state.trees.map(tree => ({ ...tree, isNew: false }))
      }));
    },
    
    // Nueva función para ajustar el tamaño de la cuadrícula
    setGridSize: (size: number) => {
      set({ gridSize: size });
      // Reorganizar todos los árboles cuando se cambia el tamaño de la cuadrícula
      const { treeCount } = get();
      // Iniciar con un array vacío para recalcular todas las posiciones
      const updatedTrees = calculateGridPositions(treeCount, size, []);
      set({ trees: updatedTrees });
    },
  }))
);

// Inicializar posiciones de los árboles cuando se crea el store
useTreeStore.getState().updateTreePositions();