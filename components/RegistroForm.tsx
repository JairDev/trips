"use client";

import { useId, useState } from "react";
import { formatMonto } from "@/lib/format";
import {
  calcularPendiente,
  derivarEstadoPago,
  redondear2,
} from "@/lib/pagos";
import {
  GRUPOS,
  METODOS_PAGO,
  ZONAS_SUGERIDAS,
  type GrupoOrigen,
  type MetodoPago,
  type NuevoPasajero,
} from "@/lib/types";

interface Props {
  onSubmit: (nuevo: NuevoPasajero) => void | Promise<void>;
  precioPorPersona: number;
  disabled?: boolean;
}

const CAMPO =
  "w-full min-h-12 rounded-xl border border-zinc-300 bg-white px-3 text-base " +
  "outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 " +
  "disabled:opacity-50";

function Segmento<T extends string>({
  opciones,
  valor,
  onChange,
  disabled,
}: {
  opciones: readonly T[];
  valor: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-xl bg-zinc-100 p-1">
      {opciones.map((op) => (
        <button
          key={op}
          type="button"
          disabled={disabled}
          onClick={() => onChange(op)}
          className={`min-h-11 rounded-lg px-2 text-sm font-medium transition-colors ${
            valor === op ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
          }`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}

const ESTADO_ESTILO: Record<string, string> = {
  Pendiente: "bg-rose-100 text-rose-700",
  Abonado: "bg-amber-100 text-amber-700",
  Completo: "bg-emerald-100 text-emerald-700",
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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
        Registro exprés
      </h2>

      <fieldset disabled={disabled} className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Nombre completo
          </span>
          <input
            className={CAMPO}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ana Pérez"
            autoComplete="off"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Grupo responsable
            </span>
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
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Zona de recogida
            </span>
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
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Modalidad de pago
          </span>
          <Segmento opciones={METODOS_PAGO} valor={metodo} onChange={setMetodo} />
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Monto abonado
          </span>
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
        <div className="rounded-xl bg-zinc-50 p-3 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Paquete por persona</span>
            <span className="tabular-nums">
              {precioPorPersona > 0 ? formatMonto(precioPorPersona) : "—"}
            </span>
          </div>
          <div className="mt-1 flex justify-between text-zinc-600">
            <span>Abonado</span>
            <span className="tabular-nums text-emerald-700">
              {formatMonto(montoAbonado)}
            </span>
          </div>
          <div className="mt-1 flex justify-between font-medium text-zinc-800">
            <span>Pendiente por cancelar</span>
            <span className="tabular-nums text-rose-600">
              {formatMonto(montoPendiente)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-zinc-500">Estado</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_ESTILO[estadoPago]}`}
            >
              {estadoPago}
            </span>
          </div>
          {precioPorPersona === 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Define el precio del paquete arriba para calcular el pendiente.
            </p>
          )}
          {pagoDeMas && (
            <p className="mt-2 text-xs text-amber-700">
              El monto abonado supera el precio del paquete.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="min-h-13 w-full rounded-xl bg-teal-700 px-4 text-base font-semibold text-white shadow-sm active:bg-teal-800 disabled:opacity-50"
        >
          {disabled
            ? "Autobús completo"
            : enviando
              ? "Registrando…"
              : "Registrar pasajero"}
        </button>
      </fieldset>
    </form>
  );
}
