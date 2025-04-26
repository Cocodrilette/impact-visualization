'use client';

import dynamic from 'next/dynamic';
import { ItemToRender } from '../components/Scene3D';

// Importamos el componente Scene3D de forma dinámica con SSR desactivado
// ya que Three.js necesita acceso al objeto window que solo existe en el navegador
const Scene3DWithNoSSR = dynamic(() => import('../components/Scene3D'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between min-h-screen p-4">
      <div className="w-full h-screen">
        <h1 className="text-2xl font-bold mb-4 text-center">Visualización de Árboles 3D</h1>
        <div className="w-full h-[calc(100vh-8rem)] rounded-lg overflow-hidden border-2 border-gray-200">
          <Scene3DWithNoSSR itemToRender={ItemToRender.HOUSE} />
        </div>
      </div>
    </main>
  );
}
