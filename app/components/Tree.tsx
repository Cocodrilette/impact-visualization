import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TreeProps {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  isNew?: boolean;
}

// Tree model based on the spherical foliage reference image
export const Tree: React.FC<TreeProps> = ({ position, rotation = 0, scale = 1, isNew = false }) => {
  const treeRef = useRef<THREE.Group>(null);
  const [growthProgress, setGrowthProgress] = useState(isNew ? 0 : 1);
  
  // Animation timing
  const animationDuration = 1.5; // seconds
  
  // Use frame to animate growth
  useFrame((state, delta) => {
    if (treeRef.current) {
      // Apply subtle swaying motion
      treeRef.current.rotation.y = rotation + Math.sin(state.clock.elapsedTime * 0.2) * 0.03;
      
      // Handle growth animation
      if (isNew && growthProgress < 1) {
        // Increment growth progress based on delta time and animation duration
        const increment = delta / animationDuration;
        setGrowthProgress(prev => Math.min(prev + increment, 1));
      }
    }
  });
  
  // Calculate current scale based on growth progress with easing
  const currentScale = scale * (isNew ? easeOutElastic(growthProgress) : 1);
  
  return (
    <group 
      ref={treeRef} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={currentScale}
    >
      {/* Tree trunk - slightly curvy */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.25, 0.3, 1.7, 8]} />
        <meshStandardMaterial color="#A0522D" roughness={0.7} />
      </mesh>

      {/* Main spherical foliage clusters */}
      {/* Center sphere - larger */}
      <mesh castShadow position={[0, 2.8, 0]}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshStandardMaterial color="#9ACD32" roughness={0.6} />
      </mesh>

      {/* Top sphere */}
      <mesh castShadow position={[0, 3.8, 0]}>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshStandardMaterial color="#8BC34A" roughness={0.6} />
      </mesh>

      {/* Bottom right sphere */}
      <mesh castShadow position={[1.0, 2.3, 0.3]}>
        <sphereGeometry args={[0.85, 16, 16]} />
        <meshStandardMaterial color="#8BC34A" roughness={0.6} />
      </mesh>

      {/* Bottom left sphere */}
      <mesh castShadow position={[-0.9, 2.2, 0.2]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#9ACD32" roughness={0.6} />
      </mesh>

      {/* Front sphere */}
      <mesh castShadow position={[0.3, 2.4, 1.0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#7CB342" roughness={0.6} />
      </mesh>

      {/* Back sphere */}
      <mesh castShadow position={[-0.2, 2.5, -0.9]}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshStandardMaterial color="#9ACD32" roughness={0.6} />
      </mesh>

      {/* Small accent spheres */}
      <mesh castShadow position={[0.8, 3.6, 0.5]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="#A4D03A" roughness={0.6} />
      </mesh>

      <mesh castShadow position={[-0.7, 3.4, -0.3]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#B2FF59" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Elastic easing function for a bouncy growth effect
function easeOutElastic(x: number): number {
  const c4 = (2 * Math.PI) / 3;
  
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export default Tree;