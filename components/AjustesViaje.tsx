"use client";

import { useEffect, useRef, useState } from "react";
import { formatBs, formatEuro } from "@/lib/format";
import { CARD, SECTION_TITLE } from "@/lib/ui";

// Mismo box para el valor mostrado y el input: idéntico alto -> al pasar a
// edición la UI no se mueve ni un píxel.
const CELDA =
  "w-28 shrink-0 rounded-sm border px-2 py-0.5 text-right text-xl font-bold " +
  "tabular-nums text-ink";

interface FilaProps {
  etiqueta: string;
  valor: number;
  mostrar: (v: number) => string;
  step: string;
  min: number;
  entero?: boolean;
  /** Línea secundaria (ej. "≈ Bs X"). Si se pasa, su espacio queda reservado
   *  siempre para que la fila no cambie de alto al editar. */
  secundario?: (v: number) => string | null;
  validar?: (n: number) => string | null;
  onGuardar: (n: number) => Promise<void>;
}

/**
 * Fila etiqueta / valor. Al pulsar el valor (o el lápiz) se convierte en un
 * input EN EL MISMO SITIO, sin ningún cambio visual en la fila. Enter o salir
 * del campo confirma; Escape cancela.
 */
function FilaEditable({
  etiqueta,
  valor,
  mostrar,
  step,
  min,
  entero = false,
  secundario,
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

  const valorSecundario = editando
    ? Number(texto.replace(",", ".")) || 0
    : valor;

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-medium text-body">{etiqueta}</p>

        <div className="shrink-0 text-right">
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
              className={`${CELDA} border-ink bg-canvas outline-none disabled:opacity-50`}
            />
          ) : (
            <button
              type="button"
              onClick={abrir}
              aria-label={`Editar ${etiqueta.toLowerCase()}`}
              className={`${CELDA} border-transparent active:bg-surface-soft`}
            >
              {mostrar(valor)}
              <span className="ml-1.5 font-normal text-accent">[✎]</span>
            </button>
          )}

          {secundario && (
            <p className="mr-2 mt-1 text-sm text-stone">
              {secundario(valorSecundario) ?? " "}
            </p>
          )}
        </div>
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
  tasaEuro: number | null;
  onGuardarPuestos: (nuevo: number) => Promise<void>;
  onGuardarPrecio: (nuevo: number) => Promise<void>;
}

/**
 * Ajustes del viaje (capacidad del bus y precio del paquete) editables en el
 * sitio. Al cambiar el precio, el backend recalcula el pendiente de todos los
 * pasajeros. El precio se muestra en euros con su equivalente en bolívares a
 * la tasa BCV del día.
 */
export default function AjustesViaje({
  puestosTotales,
  precioPorPersona,
  registrados,
  tasaEuro,
  onGuardarPuestos,
  onGuardarPrecio,
}: Props) {
  return (
    <section className={CARD}>
      <h2 className={SECTION_TITLE}>Ajustes del viaje</h2>

      <div className="mt-3 divide-y divide-hairline">
        <FilaEditable
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
        <FilaEditable
          etiqueta="Paquete por persona"
          valor={precioPorPersona}
          mostrar={(v) => formatEuro(v)}
          secundario={
            tasaEuro
              ? (v) => (v > 0 ? `≈ ${formatBs(v * tasaEuro)}` : null)
              : undefined
          }
          step="0.01"
          min={0}
          onGuardar={onGuardarPrecio}
        />
      </div>

      <p className="mt-3 border-t border-hairline pt-3 text-sm text-stone">
        {tasaEuro
          ? `Tasa BCV: ${formatBs(tasaEuro)} / €`
          : "[!] Tasa BCV no disponible; se muestra solo en euros."}
      </p>
    </section>
  );
}
