"use client";

import { useId, useState } from "react";
import Segmento from "@/components/Segmento";
import { formatBs, formatEuro } from "@/lib/format";
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
  tasaEuro: number | null;
  disabled?: boolean;
}

const LABEL = "mb-1 block text-sm font-medium text-body";

export default function RegistroForm({
  onSubmit,
  precioPorPersona,
  tasaEuro,
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

  // El Pago Móvil es una transferencia en bolívares (así funciona en
  // Venezuela); el Efectivo se registra directamente en euros. El precio del
  // paquete y todos los montos guardados están siempre en euros, así que el
  // monto en Pago Móvil hay que convertirlo Bs -> € antes de compararlo o
  // guardarlo.
  const esPagoMovil = metodo === "Pago Móvil";
  const abonadoIngresado = redondear2(Math.max(0, Number(abonado) || 0));
  const sinTasaParaConvertir = esPagoMovil && abonadoIngresado > 0 && !tasaEuro;
  const montoAbonado =
    esPagoMovil && tasaEuro
      ? redondear2(abonadoIngresado / tasaEuro)
      : esPagoMovil
        ? 0 // sin tasa no se puede convertir; se bloquea el envío más abajo
        : abonadoIngresado;
  const montoPendiente = calcularPendiente(precioPorPersona, montoAbonado);
  const estadoPago = derivarEstadoPago(precioPorPersona, montoAbonado);

  function limpiar() {
    setNombre("");
    setAbonado("");
    setError(null);
  }

  function cambiarMetodo(nuevo: MetodoPago) {
    setMetodo(nuevo);
    // El monto ya escrito quedaría en la moneda equivocada al cambiar de
    // modalidad; se limpia para evitar registrar el número mal interpretado.
    setAbonado("");
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
    if (sinTasaParaConvertir) {
      setError(
        "No se pudo obtener la tasa BCV para convertir bolívares a euros. Intenta de nuevo en unos minutos.",
      );
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
          <Segmento opciones={METODOS_PAGO} valor={metodo} onChange={cambiarMetodo} />
        </div>

        <label className="block">
          <span className={LABEL}>
            Monto abonado {esPagoMovil ? "(Bs)" : "(€)"}
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
              {esPagoMovil ? "Bs" : "€"}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className={`${CAMPO} ${esPagoMovil ? "pl-9" : "pl-7"}`}
              value={abonado}
              onChange={(e) => setAbonado(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {esPagoMovil ? (
            tasaEuro ? (
              abonadoIngresado > 0 && (
                <p className="mt-1 text-sm text-stone">
                  ≈ {formatEuro(montoAbonado)}
                </p>
              )
            ) : (
              <p className="mt-1 text-sm text-warning-active">
                [!] Tasa BCV no disponible; no se puede convertir a euros.
              </p>
            )
          ) : (
            tasaEuro &&
            montoAbonado > 0 && (
              <p className="mt-1 text-sm text-stone">
                ≈ {formatBs(montoAbonado * tasaEuro)}
              </p>
            )
          )}
        </label>

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
