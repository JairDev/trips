import type { Passenger } from './types';

export interface ZonaConteo {
  zona: string;
  total: number;
  pasajeros: Passenger[];
}

/**
 * Función pura: agrupa a los pasajeros por `zona_recogida` y cuenta cada grupo.
 * Se usa tanto en el "Panel de Control de Zonas" (Fase 1) como en la
 * exportación logística (Fase 3).
 *
 * Ordena por cantidad descendente y, a igualdad, alfabéticamente.
 */
export function agruparPorZona(passengers: Passenger[]): ZonaConteo[] {
  const mapa = new Map<string, Passenger[]>();

  for (const p of passengers) {
    const zona = p.zona_recogida?.trim() || 'Sin zona';
    const lista = mapa.get(zona);
    if (lista) {
      lista.push(p);
    } else {
      mapa.set(zona, [p]);
    }
  }

  return Array.from(mapa, ([zona, pasajeros]) => ({
    zona,
    total: pasajeros.length,
    pasajeros,
  })).sort((a, b) => b.total - a.total || a.zona.localeCompare(b.zona, 'es'));
}
