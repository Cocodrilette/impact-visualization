'use client';

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { useHouseStore } from '../store/houseStore';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface HouseProps {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
  id: number;
  isNew?: boolean;
  color?: string;
  roofColor?: string;
}

export default function House({ 
  position, 
  rotation = 0, 
  scale = 1, 
  id, 
  isNew = false,
  color = "#F5B041", // Color amarillo-naranja por defecto
  roofColor = "#E74C3C" // Color rojo por defecto para el techo
}: HouseProps) {
  const meshRef = useRef<THREE.Group>(null);
  const initialY = -5; // Posición inicial bajo tierra para la animación
  
  // Estado para la animación de aparición
  const { y, opacity, scaleY } = useSpring({
    from: { y: isNew ? initialY : 0, opacity: isNew ? 0 : 1, scaleY: isNew ? 0.01 : 1 },
    to: { y: 0, opacity: 1, scaleY: 1 },
    config: { mass: 1, tension: 120, friction: 14 },
    delay: isNew ? 100 * (id % 10) : 0, // Retraso escalonado para casas nuevas
  });

  // Marcar la casa como antigua después de la animación
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        useHouseStore.getState().markHousesAsOld();
      }, 1000); // Tiempo suficiente para completar la animación
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Pequeña animación de flotación continua
  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Movimiento suave de arriba a abajo
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() + id * 0.5) * 0.05;
      // Ligera rotación
      meshRef.current.rotation.y = rotation + Math.sin(clock.getElapsedTime() * 0.2 + id) * 0.03;
    }
  });

  return (
    <animated.group
      ref={meshRef}
      position-x={position[0]}
      position-y={y}
      position-z={position[2]}
      scale-x={scale}
      scale-y={scaleY}
      scale-z={scale}
      rotation-y={rotation}
    >
      {/* Base de la casa (cuerpo) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Techo */}
      <group position={[0, 1.8, 0]} >
        <mesh castShadow>
          <coneGeometry args={[1.7, 1.5, 4]} />
          <meshStandardMaterial color={roofColor} />
        </mesh>
      </group>

      {/* Chimenea */}
      <mesh castShadow position={[-0.7, 2, -0.5]}>
        <boxGeometry args={[0.4, 1, 0.4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>

      {/* Puerta */}
      <mesh castShadow position={[0, -0.3, 1.01]}>
        <boxGeometry args={[0.8, 1.4, 0.05]} />
        <meshStandardMaterial color="#4A6572" />
      </mesh>

      {/* Botón de la puerta */}
      <mesh castShadow position={[0.3, -0.3, 1.07]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Ventana frontal */}
      <mesh castShadow position={[0, 0.7, 1.01]}>
        <boxGeometry args={[0.8, 0.8, 0.05]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Ventanas laterales */}
      <mesh castShadow position={[1.01, 0.5, 0]}>
        <boxGeometry args={[0.05, 0.8, 0.8]} />
        <meshStandardMaterial color="#87CEEB" />
      </mesh>

      {/* Escalones de entrada */}
      <mesh castShadow receiveShadow position={[0, -1.1, 1.3]}>
        <boxGeometry args={[1, 0.2, 0.6]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, -0.9, 1.5]}>
        <boxGeometry args={[0.8, 0.2, 0.4]} />
        <meshStandardMaterial color="#A9A9A9" />
      </mesh>

      {/* Nombre/Número de la casa */}
      <Html 
        position={[-0.3, -0.3, 1.02]} 
        transform
        scale={0.2}
        style={{ 
          color: 'white', 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '2px 5px',
          borderRadius: '2px',
          pointerEvents: 'none' 
        }}
      >
        {id + 1}
      </Html>
    </animated.group>
  );
}