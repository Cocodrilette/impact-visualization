import { useEffect } from 'react';
import { useTreeStore } from '../store/treeStore';

interface ApiTreeUpdaterProps {
  apiUrl: string;
  updateInterval?: number; // en milisegundos
  enabled?: boolean;
  incrementalAnimationInterval?: number; // intervalo para la animación incremental
  minTimeBetweenRequests?: number; // tiempo mínimo entre peticiones en ms
}

/**
 * Componente para actualizar automáticamente el contador de árboles desde una API
 * con animación incremental para mostrar los nuevos árboles uno por uno
 * 
 * @param apiUrl URL de la API que devuelve el contador de árboles
 * @param updateInterval Intervalo de actualización desde la API en milisegundos (por defecto: 60000ms - 1 minuto)
 * @param enabled Si las actualizaciones automáticas están activadas (por defecto: true)
 * @param incrementalAnimationInterval Intervalo para la animación incremental en milisegundos (por defecto: 800ms)
 * @param minTimeBetweenRequests Tiempo mínimo entre peticiones en ms (por defecto: 60000ms - 1 minuto)
 */
export const ApiTreeUpdater: React.FC<ApiTreeUpdaterProps> = ({
  apiUrl,
  updateInterval = 60000, // Por defecto, actualizar cada minuto
  enabled = true,
  incrementalAnimationInterval = 800, // Por defecto, añadir un árbol cada 800ms
  minTimeBetweenRequests = 60000, // Por defecto, mínimo 1 minuto entre peticiones
}) => {
  const { 
    setApiUrl, 
    setApiUpdateInterval, 
    updateTreesFromApi,
    setIncrementalAnimationInterval,
    setMinTimeBetweenRequests: setMinRequestTime,
  } = useTreeStore();

  // Configurar la URL y los intervalos
  useEffect(() => {
    setApiUrl(apiUrl);
    setApiUpdateInterval(updateInterval);
    setIncrementalAnimationInterval(incrementalAnimationInterval);
    setMinRequestTime(minTimeBetweenRequests);
  }, [
    apiUrl, 
    updateInterval, 
    incrementalAnimationInterval,
    minTimeBetweenRequests,
    setApiUrl, 
    setApiUpdateInterval,
    setIncrementalAnimationInterval,
    setMinRequestTime
  ]);

  // Configurar el intervalo para actualizar desde la API
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const fetchData = async () => {
      if (enabled) {
        await updateTreesFromApi();
      }
    };

    // Realizar una actualización inicial
    fetchData();
    
    if (enabled) {
      // Usar un intervalo más largo para reducir la frecuencia de peticiones
      intervalId = setInterval(fetchData, updateInterval);
    }

    // Limpiar el intervalo cuando el componente se desmonte
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, updateInterval, updateTreesFromApi]);

  // Este componente no renderiza nada
  return null;
};