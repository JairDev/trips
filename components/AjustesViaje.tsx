"use client";

import { useState } from "react";
import { formatMonto } from "@/lib/format";

function IconoLapiz({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

interface FilaProps {
  etiqueta: string;
  valor: number;
  mostrar: (v: number) => string;
  step: string;
  min: number;
  entero?: boolean;
  ayuda?: string;
  validar?: (n: number) => string | null;
  onGuardar: (n: number) => Promise<void>;
}

function FilaEditable({
  etiqueta,
  valor,
  mostrar,
  step,
  min,
  entero = false,
  ayuda,
  validar,
  onGuardar,
}: FilaProps) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function abrir() {
    setTexto(valor ? String(valor) : "");
    setError(null);
    setEditando(true);
  }

  function cerrar() {
    setEditando(false);
    setError(null);
  }

  async function guardar() {
    let n = Number(texto.replace(",", "."));
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
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-600">{etiqueta}</p>
          {ayuda && !editando && (
            <p className="mt-0.5 text-xs text-zinc-400">{ayuda}</p>
          )}
        </div>
        {!editando && (
          <button
            type="button"
            onClick={abrir}
            aria-label={`Editar ${etiqueta.toLowerCase()}`}
            className="-mr-2 flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 active:bg-zinc-100"
          >
            <span className="text-xl font-bold tabular-nums text-zinc-900">
              {mostrar(valor)}
            </span>
            <IconoLapiz className="size-4 text-teal-700" />
          </button>
        )}
      </div>

      {editando && (
        <div className="mt-2.5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode={entero ? "numeric" : "decimal"}
              min={min}
              step={step}
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  guardar();
                } else if (e.key === "Escape") {
                  cerrar();
                }
              }}
              className="min-h-11 w-full flex-1 rounded-lg border border-zinc-300 px-3 text-base tabular-nums outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              placeholder="0"
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="min-h-11 shrink-0 rounded-lg bg-teal-700 px-3.5 text-sm font-semibold text-white active:bg-teal-800 disabled:opacity-50"
            >
              {guardando ? "…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cerrar}
              className="min-h-11 shrink-0 rounded-lg px-2 text-sm text-zinc-500 active:bg-zinc-100"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      )}
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
 * Ajustes del viaje (capacidad del bus y precio del paquete) editables en línea,
 * cada uno en su propia fila a lo ancho completo para que el editor no se
 * solape. Al cambiar el precio, el backend recalcula el pendiente de todos los
 * pasajeros.
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
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Ajustes del viaje
      </h2>

      <div className="mt-3 divide-y divide-zinc-100">
        <FilaEditable
          etiqueta="Puestos del bus"
          ayuda="Capacidad de la unidad"
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
        <FilaEditable
          etiqueta="Paquete por persona"
          ayuda="De aquí sale el monto pendiente"
          valor={precioPorPersona}
          mostrar={(v) => (v > 0 ? formatMonto(v) : "sin definir")}
          step="0.01"
          min={0}
          onGuardar={onGuardarPrecio}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-emerald-50 px-3 py-2.5">
          <dt className="text-xs font-medium text-emerald-700">Recaudado</dt>
          <dd className="text-lg font-bold tabular-nums text-emerald-800">
            {formatMonto(recaudado)}
          </dd>
        </div>
        <div className="rounded-xl bg-rose-50 px-3 py-2.5">
          <dt className="text-xs font-medium text-rose-700">Por cobrar</dt>
          <dd className="text-lg font-bold tabular-nums text-rose-800">
            {formatMonto(porCobrar)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
