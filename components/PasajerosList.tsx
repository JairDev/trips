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

export default function PasajerosList({ passengers }: Props) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [filtroGrupo, setFiltroGrupo] = useState<FiltroGrupo>("Todos");

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

      <ul className="mt-3 space-y-2">
        {visibles.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-400">
            Sin pasajeros para este filtro.
          </li>
        )}
        {visibles.map((p) => (
          <li
            key={p.id_viajero}
            className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-zinc-900">{p.nombre_completo}</p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[p.estado_pago]}`}
              >
                {p.estado_pago}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
              <span>{p.grupo_origen}</span>
              <span>·</span>
              <span>{p.zona_recogida}</span>
              <span>·</span>
              <span>{p.metodo_pago}</span>
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
