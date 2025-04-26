export interface ProjectFile {
  nomfile_img: string;
}

export interface Caracterizacion {
  id_caracterizacion: number;
  department: string;
  ciudad: string;
  latitud: number | null;
  longitud: number | null;
}

export interface Metrics {
  energia_total: number;
  co2_ahorrado: number;
  arboles_salvados: number;
}

export interface Minifarm {
  nombre_topico: string;
  nombre_proyecto: string;
  nombre_corto: string;
  estado_proyecto: string;
  estado_financiacion: number;
  estimated_irr: number;
  estimated_profit_rate: number;
  estimated_profit_rate_min: number | null;
  estimated_profit_rate_max: number | null;
  num_paneles: number;
  num_total_acciones: number;
  costo_accion: number;
  potencia_instalada_kwp: number;
  fecha_lanzamiento: string;
  fecha_entrada_operacion: string;
  fecha_inicio_instalacion: string;
  fecha_inicio_rentabilidad: string | null;
  fecha_legalizacion: string | null;
  project_type: number;
  produccion_especifica: number;
  porc_avance_financiacion: number;
  metrics: Metrics;
  project_file: ProjectFile[];
  rentabilidad: number;
  id_caracterizacion: Caracterizacion;
}