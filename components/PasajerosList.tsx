"use client";

import { useMemo, useState } from "react";
import AbonoModal from "@/components/AbonoModal";
import { useFeedback } from "@/components/Feedback";
import { formatBs, formatEuro } from "@/lib/format";
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
  precioPorPersona: number;
  tasaEuro: number | null;
  onAbonar: (idViajero: string, nuevoMontoAbonadoEuro: number) => Promise<void>;
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

/**
 * El Pago Móvil se cobra en bolívares (así funciona en Venezuela), aunque
 * `monto_abonado` se guarda siempre en euros. Para ese método se muestran los
 * bolívares como cifra principal (el monto real que se transfirió) y el euro
 * como equivalente; para Efectivo es al revés.
 */
function AbonadoTexto({
  monto,
  metodoPago,
  tasaEuro,
}: {
  monto: number;
  metodoPago: Passenger["metodo_pago"];
  tasaEuro: number | null;
}) {
  if (metodoPago === "Pago Móvil" && tasaEuro) {
    return (
      <>
        {formatBs(monto * tasaEuro)}
        <span className="text-stone"> (≈ {formatEuro(monto)})</span>
      </>
    );
  }
  return (
    <>
      {formatEuro(monto)}
      {tasaEuro && (
        <span className="text-stone"> (≈ {formatBs(monto * tasaEuro)})</span>
      )}
    </>
  );
}

export default function PasajerosList({
  passengers,
  precioPorPersona,
  tasaEuro,
  onAbonar,
  onEliminar,
}: Props) {
  const { confirmar, toast } = useFeedback();
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [filtroGrupo, setFiltroGrupo] = useState<FiltroGrupo>("Todos");
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [abonando, setAbonando] = useState<Passenger | null>(null);

  // Mantiene el modal apuntando a la fila fresca (llega por Realtime al abonar).
  const abonandoActual = abonando
    ? (passengers.find((p) => p.id_viajero === abonando.id_viajero) ?? abonando)
    : null;

  async function pedirEliminar(p: Passenger) {
    if (eliminando) return;
    const ok = await confirmar({
      titulo: "Eliminar pasajero",
      mensaje: (
        <>
          Se quitará a <strong className="text-ink">{p.nombre_completo}</strong>{" "}
          de la lista.
        </>
      ),
      textoConfirmar: "Eliminar",
      peligroso: true,
    });
    if (!ok) return;

    setEliminando(p.id_viajero);
    try {
      await onEliminar(p.id_viajero);
    } catch (err) {
      toast(
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
        <h2 className="text-base font-bold text-ink">Lista de pasajeros</h2>
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
                  onClick={() => setAbonando(p)}
                  aria-label={`Registrar abono de ${p.nombre_completo}`}
                  className="min-h-8 px-1 text-sm text-accent active:text-accent-hover"
                >
                  [abonar]
                </button>
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
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums text-body">
                <span>
                  Abonado{" "}
                  <AbonadoTexto
                    monto={p.monto_abonado}
                    metodoPago={p.metodo_pago}
                    tasaEuro={tasaEuro}
                  />
                </span>
                {p.monto_pendiente > 0 && (
                  <span className="text-danger-hover">
                    Pendiente {formatEuro(p.monto_pendiente)}
                    {tasaEuro && (
                      <span className="text-stone">
                        {" "}
                        (≈ {formatBs(p.monto_pendiente * tasaEuro)})
                      </span>
                    )}
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {abonandoActual && (
        <AbonoModal
          passenger={abonandoActual}
          precioPorPersona={precioPorPersona}
          tasaEuro={tasaEuro}
          onCerrar={() => setAbonando(null)}
          onGuardar={(nuevo) => onAbonar(abonandoActual.id_viajero, nuevo)}
        />
      )}
    </section>
  );
}
