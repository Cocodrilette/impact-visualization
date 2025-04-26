import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Componente para un sol como círculo con gradiente
export const CartoonSun = ({ position = [50, 40, -100], size = 20 }) => {
  const sunRef = useRef<THREE.Mesh>(null);
  
  // Crear un material con un gradiente radial
  const sunMaterial = useMemo(() => {
    // Crear un canvas para dibujar el gradiente
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Crear un gradiente radial
      const gradient = ctx.createRadialGradient(
        128, 128, 0,     // centro interior
        128, 128, 128    // centro exterior y radio
      );
      
      // Añadir paradas de color
      gradient.addColorStop(0, '#FFFF00');    // Centro amarillo brillante
      gradient.addColorStop(0.7, '#FFD700');  // Amarillo dorado
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)'); // Transparente en los bordes
      
      // Aplicar el gradiente
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Crear textura a partir del canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Crear material con la textura
    return new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);
  
  useFrame(({ clock }) => {
    if (sunRef.current) {
      // Pequeña oscilación para dar un efecto de pulsación
      const pulse = Math.sin(clock.getElapsedTime() * 0.2) * 0.05 + 1;
      sunRef.current.scale.set(pulse, pulse, 1);
    }
  });
  
  return (
    <mesh ref={sunRef} position={position as unknown as THREE.Vector3}>
      <planeGeometry args={[size * 2, size * 2]} />
      <primitive object={sunMaterial} attach="material" />
    </mesh>
  );
};

// Componente para una nube estilo cartoon
export const CartoonCloud = ({ position = [0, 0, 0] as [number, number, number], scale = 1, speed = 1, startOffset = 0 }) => {
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (cloudRef.current) {
      // Movimiento lento de lado a lado
      const time = clock.getElapsedTime() * 0.1 * speed + startOffset;
      cloudRef.current.position.x = position[0] + Math.sin(time) * 10;
      
      // Pequeño movimiento vertical
      cloudRef.current.position.y = position[1] + Math.sin(time * 0.7) * 2;
    }
  });
  
  return (
    <group ref={cloudRef} position={position} scale={scale}>
      {/* Parte principal de la nube */}
      <mesh castShadow>
        <sphereGeometry args={[5, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Bultos de la nube */}
      <mesh position={[4, 1, 0]} castShadow>
        <sphereGeometry args={[4, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[-4, 1, 0]} castShadow>
        <sphereGeometry args={[3.5, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[0, 1, 3]} castShadow>
        <sphereGeometry args={[4, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[-2, 3, 0]} castShadow>
        <sphereGeometry args={[3, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      <mesh position={[3, -1, 0]} castShadow>
        <sphereGeometry args={[3, 16, 12]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

// Componente que agrupa varias nubes en el cielo
export const CloudGroup = () => {
  // Crear más nubes con posiciones más bajas
  const clouds = [
    // Nubes originales pero con posiciones Y más bajas
    { position: [50, 40, -100] as [number, number, number], scale: 1.5, speed: 0.7, offset: 0 },
    { position: [-80, 35, -150] as [number, number, number], scale: 2, speed: 0.5, offset: 2.5 },
    { position: [0, 45, -120] as [number, number, number], scale: 1, speed: 0.9, offset: 5 },
    { position: [-40, 30, -90] as [number, number, number], scale: 1.2, speed: 0.6, offset: 1.7 },
    { position: [100, 25, -130] as [number, number, number], scale: 1.8, speed: 0.4, offset: 3.8 },
    
    // Nubes adicionales
    { position: [70, 20, -110] as [number, number, number], scale: 1.3, speed: 0.8, offset: 1.2 },
    { position: [-60, 28, -140] as [number, number, number], scale: 1.7, speed: 0.6, offset: 4.2 },
    { position: [20, 35, -160] as [number, number, number], scale: 1.4, speed: 0.55, offset: 2.8 },
    { position: [-30, 22, -125] as [number, number, number], scale: 1.1, speed: 0.75, offset: 3.3 },
    { position: [120, 32, -180] as [number, number, number], scale: 2.1, speed: 0.45, offset: 0.9 },
    
    // Algunas nubes más cercanas y bajas
    { position: [35, 18, -70] as [number, number, number], scale: 1.0, speed: 1.1, offset: 2.0 },
    { position: [-25, 15, -85] as [number, number, number], scale: 0.9, speed: 0.95, offset: 5.5 },
    { position: [10, 12, -60] as [number, number, number], scale: 0.8, speed: 1.2, offset: 1.5 },
  ];
  
  return (
    <group>
      {clouds.map((cloud, index) => (
        <CartoonCloud
          key={index}
          position={cloud.position}
          scale={cloud.scale}
          speed={cloud.speed}
          startOffset={cloud.offset}
        />
      ))}
    </group>
  );
};

// Componente principal que agrupa todos los elementos del cielo
export const SkyElements = () => {
  return (
    <group>
      <CartoonSun />
      <CloudGroup />
    </group>
  );
};