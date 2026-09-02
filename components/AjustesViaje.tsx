"use client";

import { useState } from "react";
import { formatMonto } from "@/lib/format";
import { BTN_PRIMARY, CAMPO, CARD, SECTION_TITLE } from "@/lib/ui";

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
          <p className="text-sm font-medium text-body">{etiqueta}</p>
          {ayuda && !editando && (
            <p className="mt-0.5 text-sm text-stone">{ayuda}</p>
          )}
        </div>
        {!editando && (
          <div className="flex shrink-0 items-baseline gap-3">
            <span className="text-xl font-bold tabular-nums text-ink">
              {mostrar(valor)}
            </span>
            <button
              type="button"
              onClick={abrir}
              className="text-sm text-accent underline underline-offset-2 active:text-accent-hover"
            >
              [editar]
            </button>
          </div>
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
              className={`${CAMPO} flex-1 tabular-nums`}
              placeholder="0"
            />
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className={`${BTN_PRIMARY} shrink-0 px-3.5`}
            >
              {guardando ? "..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cerrar}
              className="min-h-11 shrink-0 px-2 text-sm text-mute active:text-ink"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="mt-1.5 text-sm text-danger-hover">{error}</p>}
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
    <section className={CARD}>
      <h2 className={SECTION_TITLE}>Ajustes del viaje</h2>

      <div className="mt-3 divide-y divide-hairline">
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
        <div className="rounded-sm border border-hairline bg-surface-soft px-3 py-2.5">
          <dt className="text-sm text-mute">Recaudado</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">
            {formatMonto(recaudado)}
          </dd>
        </div>
        <div className="rounded-sm border border-hairline bg-surface-soft px-3 py-2.5">
          <dt className="text-sm text-mute">Por cobrar</dt>
          <dd className="text-lg font-bold tabular-nums text-danger-hover">
            {formatMonto(porCobrar)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
