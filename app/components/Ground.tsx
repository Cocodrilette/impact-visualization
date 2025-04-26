import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface GroundProps {
  size?: number;
}

export const Ground: React.FC<GroundProps> = ({ size = 1000 }) => {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial 
        color="#8EB520"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
};

export default Ground;