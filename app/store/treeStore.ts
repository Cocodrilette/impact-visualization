import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface TreePosition {
  id: number;
  x: number;
  z: number;
  rotation: number;
  isNew: boolean;
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
}

// Calculate grid positions for trees in a square layout
const calculateGridPositions = (count: number, gridSize: number, existingTrees: TreePosition[] = []): TreePosition[] => {
  const positions: TreePosition[] = [...existingTrees];
  
  // Keep existing trees at their positions
  const existingCount = existingTrees.length;
  
  // Only generate positions for new trees
  const newTreeCount = count - existingCount;
  
  if (newTreeCount <= 0) {
    return positions.slice(0, count); // Return subset if reducing trees
  }
  
  // Calculate grid dimensions based on total count
  const gridSideLength = Math.ceil(Math.sqrt(count));
  
  // Generate positions only for new trees
  let nextId = existingCount > 0 ? Math.max(...existingTrees.map(t => t.id)) + 1 : 0;
  
  for (let row = 0; row < gridSideLength; row++) {
    for (let col = 0; col < gridSideLength; col++) {
      const index = row * gridSideLength + col;
      
      if (index >= existingCount && index < count) {
        // Calculate centered grid positions
        const x = (col - (gridSideLength - 1) / 2) * gridSize;
        const z = (row - (gridSideLength - 1) / 2) * gridSize;
        
        positions.push({
          id: nextId++,
          x,
          z,
          rotation: Math.random() * Math.PI * 2, // Random rotation - stays fixed
          isNew: true // Mark as new for animation
        });
      }
    }
  }
  
  return positions;
};

export const useTreeStore = create<TreeState>()(
  subscribeWithSelector((set, get) => ({
    treeCount: 4, // Start with fewer trees
    trees: [],
    updateInterval: 5000, // Update interval: 5 seconds
    gridSize: 5, // Space between trees
    autoIncrementEnabled: false,
    autoIncrementInterval: 3000, // Auto increment every 3 seconds
    
    setTreeCount: (count: number) => {
      set({ treeCount: count });
      const existingTrees = get().trees;
      
      // Pass existing trees to maintain their positions
      const updatedTrees = calculateGridPositions(count, get().gridSize, existingTrees);
      set({ trees: updatedTrees });
    },
    
    setUpdateInterval: (interval: number) => {
      set({ updateInterval: interval });
    },
    
    updateTreePositions: () => {
      const { treeCount, gridSize, trees } = get();
      
      // Preserve existing tree positions and rotations
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
      // Increment by 1 with no upper limit
      const newCount = currentCount + 1;
      set({ treeCount: newCount });
      
      // Update positions while preserving existing trees
      const existingTrees = get().trees;
      const updatedTrees = calculateGridPositions(newCount, get().gridSize, existingTrees);
      set({ trees: updatedTrees });
    },
    
    // Mark all trees as old (no longer new) after animation completes
    markTreesAsOld: () => {
      set(state => ({
        trees: state.trees.map(tree => ({ ...tree, isNew: false }))
      }));
    },
  }))
);

// Initialize tree positions when the store is created
useTreeStore.getState().updateTreePositions();