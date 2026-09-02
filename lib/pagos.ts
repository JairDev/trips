import type { EstadoPago } from "./types";

/** Redondea a 2 decimales evitando ruido de coma flotante. */
export function redondear2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Monto que le queda por cancelar al excursionista.
 * = precio del paquete − lo abonado. Nunca negativo (si pagó de más, es 0).
 */
export function calcularPendiente(
  precioPorPersona: number,
  montoAbonado: number,
): number {
  return redondear2(Math.max(0, precioPorPersona - montoAbonado));
}

/**
 * Estado de pago derivado de los montos (no lo elige el coordinador):
 *  - abonado 0            -> 'Pendiente'
 *  - abonado >= precio    -> 'Completo'
 *  - abonado entre medias -> 'Abonado'
 */
export function derivarEstadoPago(
  precioPorPersona: number,
  montoAbonado: number,
): EstadoPago {
  if (montoAbonado <= 0) return "Pendiente";
  if (precioPorPersona > 0 && montoAbonado >= precioPorPersona) return "Completo";
  return "Abonado";
}
