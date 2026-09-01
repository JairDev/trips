"use client";

import { useId, useState } from "react";
import {
  ESTADOS_PAGO,
  GRUPOS,
  METODOS_PAGO,
  ZONAS_SUGERIDAS,
  type EstadoPago,
  type GrupoOrigen,
  type MetodoPago,
  type NuevoPasajero,
} from "@/lib/types";

interface Props {
  onSubmit: (nuevo: NuevoPasajero) => void | Promise<void>;
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
            valor === op
              ? "bg-white text-teal-800 shadow-sm"
              : "text-zinc-600"
          }`}
        >
          {op}
        </button>
      ))}
    </div>
  );
}

export default function RegistroForm({ onSubmit, disabled = false }: Props) {
  const zonasListId = useId();
  const [nombre, setNombre] = useState("");
  const [grupo, setGrupo] = useState<GrupoOrigen>(GRUPOS[0]);
  const [zona, setZona] = useState("");
  const [metodo, setMetodo] = useState<MetodoPago>(METODOS_PAGO[0]);
  const [estado, setEstado] = useState<EstadoPago>("Pendiente");
  const [abonado, setAbonado] = useState("");
  const [pendiente, setPendiente] = useState("");
  const [error, setError] = useState<string | null>(null);

  const montoAbonadoBloqueado = estado === "Pendiente";
  const montoPendienteBloqueado = estado === "Completo";

  function cambiarEstado(nuevo: EstadoPago) {
    setEstado(nuevo);
    if (nuevo === "Pendiente") setAbonado("");
    if (nuevo === "Completo") setPendiente("");
  }

  function limpiar() {
    setNombre("");
    setAbonado("");
    setPendiente("");
    setEstado("Pendiente");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

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
      estado_pago: estado,
      monto_abonado: montoAbonadoBloqueado ? 0 : Number(abonado) || 0,
      monto_pendiente: montoPendienteBloqueado ? 0 : Number(pendiente) || 0,
    };

    await onSubmit(nuevo);
    limpiar();
    // Mantiene grupo, zona y método para registrar en serie más rápido.
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
          <Segmento
            opciones={METODOS_PAGO}
            valor={metodo}
            onChange={setMetodo}
          />
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-zinc-700">
            Estado de pago
          </span>
          <Segmento
            opciones={ESTADOS_PAGO}
            valor={estado}
            onChange={cambiarEstado}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              value={montoAbonadoBloqueado ? "0" : abonado}
              onChange={(e) => setAbonado(e.target.value)}
              disabled={montoAbonadoBloqueado}
              placeholder="0.00"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-zinc-700">
              Monto pendiente
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className={CAMPO}
              value={montoPendienteBloqueado ? "0" : pendiente}
              onChange={(e) => setPendiente(e.target.value)}
              disabled={montoPendienteBloqueado}
              placeholder="0.00"
            />
          </label>
        </div>

        {error && (
          <p className="text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="min-h-13 w-full rounded-xl bg-teal-700 px-4 text-base font-semibold text-white shadow-sm active:bg-teal-800 disabled:opacity-50"
        >
          {disabled ? "Autobús completo" : "Registrar pasajero"}
        </button>
      </fieldset>
    </form>
  );
}
