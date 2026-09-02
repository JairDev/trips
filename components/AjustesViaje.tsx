"use client";

import { useEffect, useRef, useState } from "react";
import { formatMonto } from "@/lib/format";
import { CARD, SECTION_TITLE } from "@/lib/ui";

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

/**
 * Fila etiqueta / valor. Al pulsar el valor, se convierte en un input en el
 * MISMO sitio (sin botones ni cambios de layout). Enter o salir del campo
 * confirma; Escape cancela.
 */
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
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelarRef = useRef(false);

  useEffect(() => {
    if (error && editando) inputRef.current?.focus();
  }, [error, editando]);

  function abrir() {
    setTexto(valor ? String(valor) : "");
    setError(null);
    setEditando(true);
  }

  function cancelar() {
    setEditando(false);
    setError(null);
  }

  async function confirmar() {
    if (guardando) return;

    let n = Number(texto.replace(",", "."));
    if (entero) n = Math.trunc(n);

    if (texto.trim() === "" || n === valor) {
      cancelar();
      return;
    }
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
          {ayuda && <p className="mt-0.5 text-sm text-stone">{ayuda}</p>}
        </div>

        {editando ? (
          <input
            ref={inputRef}
            type="number"
            inputMode={entero ? "numeric" : "decimal"}
            min={min}
            step={step}
            autoFocus
            disabled={guardando}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => {
              if (cancelarRef.current) {
                cancelarRef.current = false;
                cancelar();
              } else {
                confirmar();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                inputRef.current?.blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancelarRef.current = true;
                inputRef.current?.blur();
              }
            }}
            className="w-28 shrink-0 rounded-sm border border-ink bg-canvas px-2 py-0.5 text-right text-xl font-bold tabular-nums text-ink outline-none disabled:opacity-50"
          />
        ) : (
          <button
            type="button"
            onClick={abrir}
            aria-label={`Editar ${etiqueta.toLowerCase()}`}
            className="w-28 shrink-0 rounded-sm px-2 py-0.5 text-right text-xl font-bold tabular-nums text-ink underline decoration-hairline decoration-dashed underline-offset-4 active:bg-surface-soft"
          >
            {mostrar(valor)}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-right text-sm text-danger-hover">[x] {error}</p>
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
 * Ajustes del viaje (capacidad del bus y precio del paquete) editables en el
 * sitio. Al cambiar el precio, el backend recalcula el pendiente de todos los
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
          mostrar={(v) => (v > 0 ? formatMonto(v) : "definir")}
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
