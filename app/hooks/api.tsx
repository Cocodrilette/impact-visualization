import { useEffect, useState } from "react";
import { Minifarm } from "../types/minifarm";

export const useUnergyMetricsData = () => {
  const url = "https://cocodrilette-ableorangemarmoset.web.val.run/stats"

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};


export const useUnergyProjectsApi = () => {
  const url = "https://cocodrilette-ableorangemarmoset.web.val.run/minifarms"

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

export const fetchMinifarms = async (): Promise<Array<{
  name: string;
  color: string;
  treeCount: number;
  apiDataKey: string;
  scaleFactor: number;
}>> => {
  const url = "https://cocodrilette-ableorangemarmoset.web.val.run/minifarms";
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const jsonData = await response.json() as Minifarm[];
    
    // Transformar los datos para el formato requerido por las zonas
    return jsonData.map((minifarm: Minifarm, index: number) => ({
      name: minifarm.nombre_corto || minifarm.nombre_proyecto,
      // Generar un color aleatorio o usar uno basado en el índice
      color: getColorForIndex(index),
      // Usar arboles_salvados de las métricas o un valor predeterminado
      treeCount: minifarm.metrics?.arboles_salvados || 0,
      // Clave API específica para cada minifarm
      apiDataKey: `[${index}].metrics.arboles_salvados`,
      // Factor de escala para convertir datos de la API en árboles visibles
      scaleFactor: 1.0
    }));
  } catch (error) {
    console.error("Error fetching minifarms:", error);
    // Si hay un error, devolver un array vacío o algunos datos de demostración
    return [];
  }
};

// Función auxiliar para generar colores para las zonas
const getColorForIndex = (index: number) => {
  const colors = [
    "#4CAF50", // Verde
    "#2196F3", // Azul
    "#FFC107", // Amarillo
    "#E91E63", // Rosa
    "#9C27B0", // Morado
    "#FF5722", // Naranja
    "#607D8B", // Gris azulado
  ];
  
  return colors[index % colors.length];
};
