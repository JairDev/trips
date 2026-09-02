"use client";

import { useState } from "react";
import { formatMonto } from "@/lib/format";

interface CampoProps {
  etiqueta: string;
  valor: number;
  mostrar: (v: number) => string;
  step: string;
  min: number;
  entero?: boolean;
  validar?: (n: number) => string | null;
  onGuardar: (n: number) => Promise<void>;
}

function CampoEditableNumero({
  etiqueta,
  valor,
  mostrar,
  step,
  min,
  entero = false,
  validar,
  onGuardar,
}: CampoProps) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(String(valor || ""));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setTexto(valor ? String(valor) : "");
    setError(null);
    setEditando(true);
  }

  async function guardar() {
    let n = Number(texto);
    if (entero) n = Math.trunc(n);
    if (!Number.isFinite(n) || n < min) {
      setError("Valor inválido.");
      return;
    }
    const msg = validar?.(n) ?? null;
    if (msg) {
      setError(msg);
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await onGuardar(entero ? n : Math.round(n * 100) / 100);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {etiqueta}
      </p>
      {editando ? (
        <div className="mt-1 flex items-center gap-2">
          <input
            type="number"
            inputMode={entero ? "numeric" : "decimal"}
            min={min}
            step={step}
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-24 min-h-11 rounded-lg border border-zinc-300 px-2 text-lg tabular-nums outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            placeholder="0"
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
            {mostrar(valor)}
          </span>
          <span className="text-xs font-medium text-teal-700">editar</span>
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface Props {
  puestosTotales: number;
  precioPorPersona: number;
  registrados: number;
  recaudado: number;
  porCobrar: number;
  onGuardarPuestos: (nuevo: number) => Promise<void>;
  onGuardarPrecio: (nuevo: number) => Promise<void>;
}

/**
 * Ajustes del viaje editables en línea (capacidad del bus y precio del paquete)
 * + resumen de caja. Al cambiar el precio, el backend recalcula el pendiente de
 * todos los pasajeros.
 */
export default function AjustesViaje({
  puestosTotales,
  precioPorPersona,
  registrados,
  recaudado,
  porCobrar,
  onGuardarPuestos,
  onGuardarPrecio,
}: Props) {
  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <CampoEditableNumero
          etiqueta="Puestos del bus"
          valor={puestosTotales}
          mostrar={(v) => String(v)}
          step="1"
          min={1}
          entero
          validar={(n) =>
            n < registrados
              ? `Ya hay ${registrados} pasajeros registrados.`
              : null
          }
          onGuardar={onGuardarPuestos}
        />
        <CampoEditableNumero
          etiqueta="Paquete / persona"
          valor={precioPorPersona}
          mostrar={(v) => (v > 0 ? formatMonto(v) : "sin definir")}
          step="0.01"
          min={0}
          onGuardar={onGuardarPrecio}
        />
      </div>

      <dl className="flex justify-between border-t border-zinc-100 pt-3 text-sm">
        <div>
          <dt className="text-zinc-500">Recaudado</dt>
          <dd className="font-semibold tabular-nums text-emerald-700">
            {formatMonto(recaudado)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-zinc-500">Por cobrar</dt>
          <dd className="font-semibold tabular-nums text-rose-600">
            {formatMonto(porCobrar)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
