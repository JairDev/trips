"use client";

import { useMemo, useState } from "react";
import { formatMonto } from "@/lib/format";
import {
  ESTADOS_PAGO,
  GRUPOS,
  type EstadoPago,
  type GrupoOrigen,
  type Passenger,
} from "@/lib/types";
import { CARD } from "@/lib/ui";

interface Props {
  passengers: Passenger[];
  onEliminar: (idViajero: string) => void | Promise<void>;
}

type FiltroEstado = EstadoPago | "Todos";
type FiltroGrupo = GrupoOrigen | "Todos";

const ESTADO_TONO: Record<EstadoPago, string> = {
  Pendiente: "text-danger-hover",
  Abonado: "text-warning-active",
  Completo: "text-ink",
};

const FILTRO =
  "min-h-9 w-full rounded-sm border border-hairline bg-surface-soft px-2 " +
  "text-sm text-ink outline-none focus:border-ink focus:bg-canvas";

export default function PasajerosList({ passengers, onEliminar }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [filtroGrupo, setFiltroGrupo] = useState<FiltroGrupo>("Todos");
  const [eliminando, setEliminando] = useState<string | null>(null);

  async function pedirEliminar(p: Passenger) {
    if (eliminando) return;
    if (!window.confirm(`¿Eliminar a ${p.nombre_completo} de la lista?`)) return;
    setEliminando(p.id_viajero);
    try {
      await onEliminar(p.id_viajero);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "No se pudo eliminar el pasajero.",
      );
    } finally {
      setEliminando(null);
    }
  }

  const visibles = useMemo(
    () =>
      passengers.filter(
        (p) =>
          (filtroEstado === "Todos" || p.estado_pago === filtroEstado) &&
          (filtroGrupo === "Todos" || p.grupo_origen === filtroGrupo),
      ),
    [passengers, filtroEstado, filtroGrupo],
  );

  return (
    <section className={CARD}>
      <div className="flex items-baseline justify-between border-b border-hairline pb-2">
        <h2 className="text-base font-bold text-ink">Lista maestra</h2>
        <span className="text-sm text-mute tabular-nums">
          {visibles.length} de {passengers.length}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-mute">Estado de pago</span>
          <select
            className={FILTRO}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
          >
            <option value="Todos">Todos</option>
            {ESTADOS_PAGO.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm text-mute">Grupo</span>
          <select
            className={FILTRO}
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value as FiltroGrupo)}
          >
            <option value="Todos">Todos</option>
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="mt-3 divide-y divide-hairline border-t border-hairline">
        {visibles.length === 0 && (
          <li className="py-6 text-center text-sm text-stone">
            Sin pasajeros para este filtro.
          </li>
        )}
        {visibles.map((p) => (
          <li key={p.id_viajero} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-ink">{p.nombre_completo}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-sm text-mute">
                  <span>{p.grupo_origen}</span>
                  <span>·</span>
                  <span>{p.zona_recogida}</span>
                  <span>·</span>
                  <span>{p.metodo_pago}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={`text-sm font-medium ${ESTADO_TONO[p.estado_pago]}`}
                >
                  [ {p.estado_pago.toLowerCase()} ]
                </span>
                <button
                  type="button"
                  onClick={() => pedirEliminar(p)}
                  disabled={eliminando === p.id_viajero}
                  aria-label={`Eliminar a ${p.nombre_completo}`}
                  className="min-h-8 px-1 text-sm text-mute active:text-danger-hover disabled:text-ash"
                >
                  [x]
                </button>
              </div>
            </div>
            {(p.monto_abonado > 0 || p.monto_pendiente > 0) && (
              <div className="mt-1 flex gap-4 text-sm tabular-nums text-body">
                <span>Abonado {formatMonto(p.monto_abonado)}</span>
                {p.monto_pendiente > 0 && (
                  <span className="text-danger-hover">
                    Pendiente {formatMonto(p.monto_pendiente)}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
