import React from 'react';
import { Line, Html } from '@react-three/drei';
import { useTreeStore } from '../store/treeStore';

/**
 * Componente que renderiza los límites de las zonas como líneas blancas en 3D
 */
const ZoneBoundaries: React.FC = () => {
  const { zones } = useTreeStore();
  
  // Si no hay zonas, no renderizar nada
  if (zones.length === 0) return null;
  
  return (
    <>
      {zones.map(zone => {
        const { id, position, size, name, treesGenerated, treeCount, color } = zone;
        
        // Calcular las esquinas de la zona
        const halfWidth = size.width / 2;
        const halfDepth = size.depth / 2;
        
        // Definir los puntos de las esquinas (recorriendo en sentido horario, empezando por la esquina inferior izquierda)
        const cornerPoints = [
          [position.x - halfWidth, 0.1, position.z - halfDepth], // Esquina inferior izquierda
          [position.x + halfWidth, 0.1, position.z - halfDepth], // Esquina inferior derecha
          [position.x + halfWidth, 0.1, position.z + halfDepth], // Esquina superior derecha
          [position.x - halfWidth, 0.1, position.z + halfDepth], // Esquina superior izquierda
          [position.x - halfWidth, 0.1, position.z - halfDepth]  // Cerrar el polígono volviendo a la primera esquina
        ];
        
        return (
          <group key={id}>
            {/* Línea delimitadora */}
            <Line
              points={cornerPoints}
              color="white"
              lineWidth={1.5}
              dashed={false}
            />
            
            {/* Etiqueta de la zona con información */}
            <Html
              position={[position.x, 0.5, position.z]}
              center
              distanceFactor={40}
            >
              <div className="zone-label">
                <div className="zone-name" style={{ color: color || 'white' }}>{name}</div>
                <div className="zone-stats">{treesGenerated}/{treeCount} árboles</div>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
};

export default ZoneBoundaries;