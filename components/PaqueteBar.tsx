"use client";

import { useState } from "react";
import { formatMonto } from "@/lib/format";

interface Props {
  precioPorPersona: number;
  recaudado: number;
  porCobrar: number;
  onGuardarPrecio: (nuevo: number) => Promise<void>;
}

/**
 * Precio del paquete por persona (editable en línea) + resumen de caja.
 * Al guardar un precio nuevo, el backend recalcula el pendiente de todos los
 * pasajeros del viaje.
 */
export default function PaqueteBar({
  precioPorPersona,
  recaudado,
  porCobrar,
  onGuardarPrecio,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(precioPorPersona || ""));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setValor(precioPorPersona ? String(precioPorPersona) : "");
    setError(null);
    setEditando(true);
  }

  async function guardar() {
    const nuevo = Number(valor);
    if (!Number.isFinite(nuevo) || nuevo < 0) {
      setError("Precio inválido.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardarPrecio(Math.round(nuevo * 100) / 100);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Paquete por persona
          </p>
          {editando ? (
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                autoFocus
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-28 min-h-11 rounded-lg border border-zinc-300 px-2 text-lg tabular-nums outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={guardar}
                disabled={guardando}
                className="min-h-11 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white active:bg-teal-800 disabled:opacity-50"
              >
                {guardando ? "…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="min-h-11 px-2 text-sm text-zinc-500"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={abrir}
              className="mt-1 flex items-baseline gap-2 text-left"
            >
              <span className="text-2xl font-bold tabular-nums text-zinc-900">
                {precioPorPersona > 0 ? formatMonto(precioPorPersona) : "sin definir"}
              </span>
              <span className="text-xs font-medium text-teal-700">editar</span>
            </button>
          )}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>

        <dl className="text-right text-sm">
          <div>
            <dt className="inline text-zinc-500">Recaudado </dt>
            <dd className="inline font-semibold tabular-nums text-emerald-700">
              {formatMonto(recaudado)}
            </dd>
          </div>
          <div>
            <dt className="inline text-zinc-500">Por cobrar </dt>
            <dd className="inline font-semibold tabular-nums text-rose-600">
              {formatMonto(porCobrar)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
