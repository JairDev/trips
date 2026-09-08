import type { EstadoPago } from "./types";

/** Redondea a `decimales` decimales evitando ruido de coma flotante. */
export function redondear(n: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round((n + Number.EPSILON) * factor) / factor;
}

/** Redondea a 2 decimales (montos "de calle": bolívares, euros tecleados). */
export function redondear2(n: number): number {
  return redondear(n, 2);
}

/**
 * Precisión de los montos convertidos Bs -> € que se guardan en la base.
 * A la tasa BCV (~950), cada céntimo de euro son ~9,5 Bs; con 2 decimales el
 * número en bolívares no vuelve exacto. Con 6 el error es < 0,001 Bs.
 */
export const DECIMALES_EUR = 6;

/**
 * Monto que le queda por cancelar al excursionista.
 * = precio del paquete − lo abonado. Nunca negativo (si pagó de más, es 0).
 * Si la diferencia es menor a un céntimo se considera saldado (tolerancia por
 * los redondeos de conversión de moneda).
 */
export function calcularPendiente(
  precioPorPersona: number,
  montoAbonado: number,
): number {
  const pendiente = precioPorPersona - montoAbonado;
  return redondear2(pendiente) <= 0 ? 0 : redondear(pendiente, DECIMALES_EUR);
}

/**
 * Estado de pago derivado de los montos (no lo elige el coordinador):
 *  - abonado 0            -> 'Pendiente'
 *  - abonado >= precio    -> 'Completo'  (con tolerancia de 1 céntimo)
 *  - abonado entre medias -> 'Abonado'
 */
export function derivarEstadoPago(
  precioPorPersona: number,
  montoAbonado: number,
): EstadoPago {
  if (montoAbonado <= 0) return "Pendiente";
  if (precioPorPersona > 0 && redondear2(montoAbonado) >= precioPorPersona) {
    return "Completo";
  }
  return "Abonado";
}
