import React, { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import { useTreeStore } from '../store/treeStore';
import { Vector2, CubicBezierCurve3, Vector3, CurvePath } from 'three';

/**
 * Componente que renderiza los límites de las zonas como líneas redondeadas en 3D
 */
const ZoneBoundaries: React.FC = () => {
  const { zones } = useTreeStore();
  
  // Memoizar los puntos para cada zona para mejor rendimiento
  const zoneRoundedPoints = useMemo(() => {
    return zones.map(zone => {
      const { position, size } = zone;
      
      // Calcular las esquinas de la zona
      const halfWidth = size.width / 1.7;
      const halfDepth = size.depth / 1.7;
      
      // Definir los puntos de las esquinas (recorriendo en sentido horario)
      const corners = [
        new Vector3(position.x - halfWidth, 0.1, position.z - halfDepth), // Esquina inferior izquierda
        new Vector3(position.x + halfWidth, 0.1, position.z - halfDepth), // Esquina inferior derecha
        new Vector3(position.x + halfWidth, 0.1, position.z + halfDepth), // Esquina superior derecha
        new Vector3(position.x - halfWidth, 0.1, position.z + halfDepth)  // Esquina superior izquierda
      ];
      
      // Radio de las esquinas redondeadas (ajusta este valor según necesites)
      const cornerRadius = Math.min(halfWidth, halfDepth) * 0.3;
      
      // Puntos finales para dibujar la curva
      const points: Vector3[] = [];
      
      // Crear curvas para cada esquina
      for (let i = 0; i < corners.length; i++) {
        const current = corners[i];
        const next = corners[(i + 1) % corners.length];
        
        // Vector dirección desde la esquina actual hacia la siguiente
        const dirToNext = new Vector3().subVectors(next, current).normalize();
        // Vector dirección desde la esquina actual hacia la anterior
        const prevIndex = (i - 1 + corners.length) % corners.length;
        const prev = corners[prevIndex];
        const dirFromPrev = new Vector3().subVectors(current, prev).normalize();
        
        // Calcular puntos de control para la curva
        const p0 = new Vector3().copy(current).addScaledVector(dirFromPrev.clone().negate(), cornerRadius);
        const p3 = new Vector3().copy(current).addScaledVector(dirToNext, cornerRadius);
        const p1 = new Vector3().lerpVectors(p0, current, 0.5);
        const p2 = new Vector3().lerpVectors(p3, current, 0.5);
        
        // Añadir el punto inicial (excepto en la primera iteración, ya se añadió al final del ciclo anterior)
        if (i === 0) points.push(p0);
        
        // Crear una curva Bezier cúbica y añadir puntos a lo largo de ella
        const curve = new CubicBezierCurve3(p0, p1, p2, p3);
        const curvePoints = curve.getPoints(10); // Obtener 10 puntos a lo largo de la curva
        
        // Añadir puntos de la curva (saltando el primero porque ya está añadido)
        curvePoints.slice(1).forEach(point => {
          points.push(point);
        });
        
        // Añadir segmento recto hasta el inicio de la siguiente curva
        if (i < corners.length - 1) {
          const nextCorner = corners[(i + 1) % corners.length];
          const nextStart = new Vector3().copy(nextCorner).addScaledVector(
            new Vector3().subVectors(nextCorner, next).normalize(), 
            cornerRadius
          );
          points.push(nextStart);
        }
      }
      
      // Añadir el último punto para cerrar la forma
      points.push(points[0].clone());
      
      return {
        id: zone.id,
        points,
        zone
      };
    });
  }, [zones]);
  
  // Si no hay zonas, renderizar un grupo vacío
  if (zones.length === 0) return <group />;
  
  return (
    <>
      {zoneRoundedPoints.map(({ id, points, zone }) => {
        const { name, treesGenerated, treeCount, color, position } = zone;
        
        return (
          <group key={id}>
            {/* Línea delimitadora redondeada */}
            {/* <Line
              points={points}
              color={color || "white"}
              lineWidth={2}
              dashed={false}
            /> */}
            
            {/* Etiqueta de la zona con información */}
            <Html
              position={[position.x, 0.5, position.z]}
              center
              distanceFactor={60}
            >
              <div className="zone-label">
                <div className="zone-name" style={{ color: color || 'white' }}>{name}</div>
                {/* <div className="zone-stats">{treesGenerated}/{treeCount} árboles</div> */}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
};

export default ZoneBoundaries;