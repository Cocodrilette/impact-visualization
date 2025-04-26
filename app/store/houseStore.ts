import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface HousePosition {
  id: number;
  x: number;
  z: number;
  rotation: number;
  scale: number;
  isNew: boolean;
  gridRow: number;
  gridCol: number;
  randomOffset: { x: number; z: number };
  color: string;
  roofColor: string;
}

interface HouseState {
  houseCount: number;
  houses: HousePosition[];
  updateInterval: number; // in milliseconds
  gridSize: number; // Spacing between houses
  randomnessFactor: number; // 0-1 factor para determinar cuánto desorden
  autoIncrementEnabled: boolean; // Auto increment houses
  autoIncrementInterval: number; // milliseconds
  updateHousePositions: () => void;
  setHouseCount: (count: number) => void;
  setUpdateInterval: (interval: number) => void;
  toggleAutoIncrement: () => void;
  setAutoIncrementInterval: (interval: number) => void;
  incrementHouseCount: () => void;
  markHousesAsOld: () => void;
  setGridSize: (size: number) => void;
  setRandomnessFactor: (factor: number) => void;
}

// Colores predefinidos para las casas
const houseColors = ["#F5B041", "#F4D03F", "#F1C40F", "#E67E22", "#F39C12"];
const roofColors = ["#E74C3C", "#C0392B", "#922B21", "#7B241C", "#641E16"];

// Función para generar un offset aleatorio basado en el factor de aleatoriedad y tamaño de cuadrícula
const generateRandomOffset = (gridSize: number, randomnessFactor: number) => {
  // El offset máximo será un porcentaje del tamaño de celda de la cuadrícula
  const maxOffset = gridSize * 0.4 * randomnessFactor;
  return {
    x: (Math.random() * 2 - 1) * maxOffset,
    z: (Math.random() * 2 - 1) * maxOffset
  };
};

// Función para calcular posiciones en cuadrícula para las casas
const calculateGridPositions = (
  count: number, 
  gridSize: number, 
  randomnessFactor: number,
  existingHouses: HousePosition[] = []
): HousePosition[] => {
  // Crear una copia del array existente
  const positions: HousePosition[] = [...existingHouses];
  
  // Número de casas existentes
  const existingCount = existingHouses.length;
  
  // Número de nuevas casas a crear
  const newHouseCount = count - existingCount;
  
  // Si estamos reduciendo casas, simplemente devolver un subconjunto
  if (newHouseCount <= 0) {
    return positions.slice(0, count);
  }
  
  // Calcular dimensiones de la cuadrícula basadas en el total de casas
  const gridSideLength = Math.ceil(Math.sqrt(count));
  
  // Crear un mapa de posiciones ocupadas para evitar duplicados
  const occupiedPositions = new Map();
  existingHouses.forEach(house => {
    if (house.gridRow !== undefined && house.gridCol !== undefined) {
      occupiedPositions.set(`${house.gridRow}-${house.gridCol}`, true);
    }
  });
  
  // ID para las nuevas casas
  let nextId = existingCount > 0 ? Math.max(...existingHouses.map(h => h.id)) + 1 : 0;
  
  // Contador para las nuevas casas añadidas
  let newHousesAdded = 0;
  
  // Generar posiciones para las nuevas casas
  for (let row = 0; row < gridSideLength && newHousesAdded < newHouseCount; row++) {
    for (let col = 0; col < gridSideLength && newHousesAdded < newHouseCount; col++) {
      // Verificar si esta posición ya está ocupada
      const posKey = `${row}-${col}`;
      if (!occupiedPositions.has(posKey)) {
        // Generar offset aleatorio para esta posición
        const randomOffset = generateRandomOffset(gridSize, randomnessFactor);
        
        // Generar una escala aleatoria para esta casa
        const fixedScale = 0.8 + Math.random() * 0.4; // Entre 0.8 y 1.2
        
        // Generar una rotación aleatoria para esta casa
        const fixedRotation = Math.random() * Math.PI * 2; // Entre 0 y 2π
        
        // Calcular posiciones centradas en el sistema de coordenadas 3D, con offset aleatorio
        const x = (col - (gridSideLength - 1) / 2) * gridSize + randomOffset.x;
        const z = (row - (gridSideLength - 1) / 2) * gridSize + randomOffset.z;
        
        // Seleccionar colores aleatorios de las paletas
        const color = houseColors[Math.floor(Math.random() * houseColors.length)];
        const roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
        
        positions.push({
          id: nextId++,
          x,
          z,
          rotation: fixedRotation,
          scale: fixedScale,
          isNew: true, // Marcar como nueva para la animación
          gridRow: row,
          gridCol: col,
          randomOffset,
          color,
          roofColor
        });
        
        // Marcar esta posición como ocupada
        occupiedPositions.set(posKey, true);
        newHousesAdded++;
      }
    }
  }
  
  return positions;
};

export const useHouseStore = create<HouseState>()(
  subscribeWithSelector((set, get) => ({
    houseCount: 4, // Comenzar con pocas casas
    houses: [],
    updateInterval: 5000,
    gridSize: 8, // Espacio entre casas (un poco mayor que los árboles)
    randomnessFactor: 0.5,
    autoIncrementEnabled: false,
    autoIncrementInterval: 3000,
    
    updateHousePositions: () => {
      console.log("House position updates are now handled differently.");
    },
    
    setHouseCount: (count: number) => {
      set({ houseCount: count });
      const existingHouses = get().houses;
      
      // Pasar casas existentes para mantener sus posiciones
      const updatedHouses = calculateGridPositions(
        count, 
        get().gridSize, 
        get().randomnessFactor,
        existingHouses
      );
      set({ houses: updatedHouses });
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
    
    incrementHouseCount: () => {
      const currentCount = get().houseCount;
      const newCount = currentCount + 1;
      set({ houseCount: newCount });
      
      // Actualizar posiciones preservando casas existentes
      const existingHouses = get().houses;
      const updatedHouses = calculateGridPositions(
        newCount, 
        get().gridSize, 
        get().randomnessFactor,
        existingHouses
      );
      set({ houses: updatedHouses });
    },
    
    markHousesAsOld: () => {
      set(state => ({
        houses: state.houses.map(house => ({ ...house, isNew: false }))
      }));
    },
    
    setGridSize: (size: number) => {
      set({ gridSize: size });
      // Reorganizar todas las casas cuando se cambia el tamaño de la cuadrícula
      const { houseCount, randomnessFactor } = get();
      const updatedHouses = calculateGridPositions(houseCount, size, randomnessFactor, []);
      set({ houses: updatedHouses });
    },
    
    setRandomnessFactor: (factor: number) => {
      set({ randomnessFactor: factor });
      // Reorganizar todas las casas cuando se cambia el factor de aleatoriedad
      const { houseCount, gridSize } = get();
      const updatedHouses = calculateGridPositions(houseCount, gridSize, factor, []);
      set({ houses: updatedHouses });
    },
  }))
);

// Inicializar casas
const initialHouses = calculateGridPositions(
  useHouseStore.getState().houseCount,
  useHouseStore.getState().gridSize,
  useHouseStore.getState().randomnessFactor,
  []
);

// Actualizar el store con las casas iniciales
useHouseStore.setState({ houses: initialHouses });