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

interface Props {
  passengers: Passenger[];
  onEliminar: (idViajero: string) => void | Promise<void>;
}

type FiltroEstado = EstadoPago | "Todos";
type FiltroGrupo = GrupoOrigen | "Todos";

const ESTADO_ESTILO: Record<EstadoPago, string> = {
  Pendiente: "bg-rose-100 text-rose-700",
  Abonado: "bg-amber-100 text-amber-700",
  Completo: "bg-emerald-100 text-emerald-700",
};

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition-colors ${
        activo
          ? "border-teal-700 bg-teal-700 text-white"
          : "border-zinc-300 bg-white text-zinc-600"
      }`}
    >
      {children}
    </button>
  );
}

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
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Lista maestra
        </h2>
        <span className="text-xs text-zinc-400 tabular-nums">
          {visibles.length} de {passengers.length}
        </span>
      </div>

      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip
          activo={filtroEstado === "Todos"}
          onClick={() => setFiltroEstado("Todos")}
        >
          Todos
        </Chip>
        {ESTADOS_PAGO.map((e) => (
          <Chip
            key={e}
            activo={filtroEstado === e}
            onClick={() => setFiltroEstado(e)}
          >
            {e}
          </Chip>
        ))}
      </div>

      <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Chip
          activo={filtroGrupo === "Todos"}
          onClick={() => setFiltroGrupo("Todos")}
        >
          Todos los grupos
        </Chip>
        {GRUPOS.map((g) => (
          <Chip
            key={g}
            activo={filtroGrupo === g}
            onClick={() => setFiltroGrupo(g)}
          >
            {g}
          </Chip>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visibles.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-400 sm:col-span-2">
            Sin pasajeros para este filtro.
          </li>
        )}
        {visibles.map((p) => (
          <li
            key={p.id_viajero}
            className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-zinc-900">{p.nombre_completo}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                  <span>{p.grupo_origen}</span>
                  <span>·</span>
                  <span>{p.zona_recogida}</span>
                  <span>·</span>
                  <span>{p.metodo_pago}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[p.estado_pago]}`}
                >
                  {p.estado_pago}
                </span>
                <button
                  type="button"
                  onClick={() => pedirEliminar(p)}
                  disabled={eliminando === p.id_viajero}
                  aria-label={`Eliminar a ${p.nombre_completo}`}
                  className="flex size-9 items-center justify-center rounded-lg text-zinc-400 active:bg-zinc-200 disabled:opacity-40"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="size-5"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            </div>
            {(p.monto_abonado > 0 || p.monto_pendiente > 0) && (
              <div className="mt-1.5 flex gap-4 text-xs tabular-nums">
                <span className="text-emerald-700">
                  Abonado {formatMonto(p.monto_abonado)}
                </span>
                {p.monto_pendiente > 0 && (
                  <span className="text-rose-600">
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
