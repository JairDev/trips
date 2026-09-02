"use client";

import { useId, useState } from "react";
import { formatMonto } from "@/lib/format";
import { calcularPendiente, derivarEstadoPago, redondear2 } from "@/lib/pagos";
import {
  GRUPOS,
  METODOS_PAGO,
  ZONAS_SUGERIDAS,
  type GrupoOrigen,
  type MetodoPago,
  type NuevoPasajero,
} from "@/lib/types";
import { BTN_PRIMARY, CAMPO, CARD, SECTION_TITLE } from "@/lib/ui";

interface Props {
  onSubmit: (nuevo: NuevoPasajero) => void | Promise<void>;
  precioPorPersona: number;
  disabled?: boolean;
}

const LABEL = "mb-1 block text-sm font-medium text-body";

/** Tira de pestañas: sin relleno, activa = tinta con subrayado de 2px. */
function Segmento<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: readonly T[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border-b border-hairline">
      {opciones.map((op) => (
        <button
          key={op}
          type="button"
          onClick={() => onChange(op)}
          className={`min-h-11 flex-1 px-2 text-sm font-medium ${
            valor === op
              ? "-mb-px border-b-2 border-ash text-ink"
              : "text-mute"
          }`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}

/** Estado como token entre corchetes; el color solo marca lo que requiere acción. */
const ESTADO_TONO: Record<string, string> = {
  Pendiente: "text-danger-hover",
  Abonado: "text-warning-active",
  Completo: "text-ink",
};

export default function RegistroForm({
  onSubmit,
  precioPorPersona,
  disabled = false,
}: Props) {
  const zonasListId = useId();
  const [nombre, setNombre] = useState("");
  const [grupo, setGrupo] = useState<GrupoOrigen>(GRUPOS[0]);
  const [zona, setZona] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>(METODOS_PAGO[0]);
  const [abonado, setAbonado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Cálculo automático a partir del precio del paquete.
  const montoAbonado = redondear2(Math.max(0, Number(abonado) || 0));
  const montoPendiente = calcularPendiente(precioPorPersona, montoAbonado);
  const estadoPago = derivarEstadoPago(precioPorPersona, montoAbonado);
  const pagoDeMas = montoAbonado > precioPorPersona && precioPorPersona > 0;

  function limpiar() {
    setNombre("");
    setAbonado("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled || enviando) return;

    if (!nombre.trim()) {
      setError("El nombre completo es obligatorio.");
      return;
    }
    if (!zona.trim()) {
      setError("Indica la zona de recogida.");
      return;
    }

    const nuevo: NuevoPasajero = {
      nombre_completo: nombre.trim(),
      grupo_origen: grupo,
      zona_recogida: zona.trim(),
      metodo_pago: metodo,
      estado_pago: estadoPago,
      monto_abonado: montoAbonado,
      monto_pendiente: montoPendiente,
    };

    setEnviando(true);
    setError(null);
    try {
      await onSubmit(nuevo);
      limpiar();
      // Mantiene grupo, zona y método para registrar en serie más rápido.
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={CARD}>
      <h2 className={SECTION_TITLE}>Registrar pasajero</h2>

      <fieldset disabled={disabled} className="mt-3 space-y-3.5">
        <label className="block">
          <span className={LABEL}>Nombre completo</span>
          <input
            className={CAMPO}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ana Pérez"
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className={LABEL}>Grupo responsable</span>
          <select
            className={CAMPO}
            value={grupo}
            onChange={(e) => setGrupo(e.target.value as GrupoOrigen)}
          >
            {GRUPOS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>Zona de recogida</span>
          <input
            className={CAMPO}
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            list={zonasListId}
            placeholder="Ej. Santa Rosa"
            autoComplete="off"
          />
          <datalist id={zonasListId}>
            {ZONAS_SUGERIDAS.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </label>

        <div>
          <span className={LABEL}>Modalidad de pago</span>
          <Segmento opciones={METODOS_PAGO} valor={metodo} onChange={setMetodo} />
        </div>

        <label className="block">
          <span className={LABEL}>Monto abonado</span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            className={CAMPO}
            value={abonado}
            onChange={(e) => setAbonado(e.target.value)}
            placeholder="0.00"
          />
        </label>

        {/* Resumen calculado automáticamente */}
        <div className="rounded-sm border border-hairline bg-surface-soft p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-mute">Resumen de pago</span>
            <span
              className={`text-sm font-medium ${ESTADO_TONO[estadoPago]}`}
            >
              [ {estadoPago.toLowerCase()} ]
            </span>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-mute">Pendiente por cancelar</p>
              <p className="text-2xl font-bold tabular-nums text-danger-hover">
                {formatMonto(montoPendiente)}
              </p>
            </div>
            <dl className="text-right text-sm text-mute">
              <div className="flex justify-between gap-3">
                <dt>Paquete</dt>
                <dd className="tabular-nums text-body">
                  {precioPorPersona > 0 ? formatMonto(precioPorPersona) : "—"}
                </dd>
              </div>
              <div className="mt-0.5 flex justify-between gap-3">
                <dt>Abonado</dt>
                <dd className="tabular-nums text-body">
                  {formatMonto(montoAbonado)}
                </dd>
              </div>
            </dl>
          </div>

          {precioPorPersona === 0 && (
            <p className="mt-2.5 text-sm text-warning-active">
              [!] Define el precio del paquete en “Ajustes del viaje”.
            </p>
          )}
          {pagoDeMas && (
            <p className="mt-2.5 text-sm text-warning-active">
              [!] El monto abonado supera el precio del paquete.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-danger-hover" role="alert">
            [x] {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className={`${BTN_PRIMARY} w-full`}
        >
          {disabled
            ? "Autobús completo"
            : enviando
              ? "Registrando..."
              : "Registrar"}
        </button>
      </fieldset>
    </form>
  );
}
