// Tipos compartidos del dominio. Los nombres de campo coinciden 1:1 con las
// columnas de Supabase (ver supabase/schema.sql) para evitar mapeos.

export const GRUPOS = [
  'Brújula mochilera',
  'Senderos del alma',
  'Destino 100% activo',
] as const;
export type GrupoOrigen = (typeof GRUPOS)[number];

export const METODOS_PAGO = ['Pago Móvil', 'Efectivo'] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const ESTADOS_PAGO = ['Pendiente', 'Abonado', 'Completo'] as const;
export type EstadoPago = (typeof ESTADOS_PAGO)[number];

// Sugerencias para el datalist de zona de recogida (el campo es texto libre).
export const ZONAS_SUGERIDAS = [
  'Santa Rosa',
  'El Cafetal',
  'Chacao',
  'Los Palos Grandes',
  'La California',
  'Petare',
] as const;

export interface Trip {
  id_viaje: string;
  destino: string;
  fecha_salida: string; // 'YYYY-MM-DD'
  puestos_totales: number;
  precio_por_persona: number; // precio del paquete por excursionista
}

export interface Passenger {
  id_viajero: string;
  id_viaje: string;
  nombre_completo: string;
  grupo_origen: GrupoOrigen;
  zona_recogida: string;
  metodo_pago: MetodoPago;
  estado_pago: EstadoPago;
  monto_abonado: number;
  monto_pendiente: number;
  created_at?: string;
}

// Lo que produce el Formulario Exprés antes de persistir (sin ids ni timestamp).
export type NuevoPasajero = Omit<
  Passenger,
  'id_viajero' | 'id_viaje' | 'created_at'
>;

export interface Gasto {
  id_gasto: string;
  id_viaje: string;
  concepto: string;
  monto: number; // siempre en euros, igual que el resto de montos de la app
  created_at?: string;
}

export type NuevoGasto = Omit<Gasto, 'id_gasto' | 'id_viaje' | 'created_at'>;

/** Destino de un viaje recién reiniciado (sin nombre todavía). */
export const DESTINO_SIN_DEFINIR = 'Nombre de destino';
