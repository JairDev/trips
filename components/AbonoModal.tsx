"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import Segmento from "@/components/Segmento";
import {
  formatBs,
  formatEuro,
  formatMontoMascara,
  parseMontoMascara,
} from "@/lib/format";
import {
  calcularPendiente,
  DECIMALES_EUR,
  derivarEstadoPago,
  redondear,
  redondear2,
} from "@/lib/pagos";
import type { Passenger } from "@/lib/types";
import { BTN_PRIMARY, CAMPO } from "@/lib/ui";

interface Props {
  passenger: Passenger;
  precioPorPersona: number;
  tasaEuro: number | null;
  onCerrar: () => void;
  onGuardar: (nuevoMontoAbonadoEuro: number) => Promise<void>;
}

type Modo = "Sumar un pago" | "Corregir monto";
type Moneda = "€" | "Bs";

const ESTADO_TONO: Record<string, string> = {
  Pendiente: "text-danger-hover",
  Abonado: "text-warning-active",
  Completo: "text-ink",
};

export default function AbonoModal({
  passenger,
  precioPorPersona,
  tasaEuro,
  onCerrar,
  onGuardar,
}: Props) {
  const [modo, setModo] = useState<Modo>("Sumar un pago");
  const [moneda, setMoneda] = useState<Moneda>(
    passenger.metodo_pago === "Pago Móvil" ? "Bs" : "€",
  );
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const esBs = moneda === "Bs";
  const ingresado = esBs
    ? parseMontoMascara(monto)
    : redondear2(Math.max(0, Number(monto) || 0));
  const sinTasa = esBs && ingresado > 0 && !tasaEuro;
  const ingresadoEuro = esBs
    ? tasaEuro
      ? redondear(ingresado / tasaEuro, DECIMALES_EUR)
      : 0
    : ingresado;

  const nuevoAbonado =
    modo === "Sumar un pago"
      ? redondear(passenger.monto_abonado + ingresadoEuro, DECIMALES_EUR)
      : ingresadoEuro;
  const nuevoPendiente = calcularPendiente(precioPorPersona, nuevoAbonado);
  const nuevoEstado = derivarEstadoPago(precioPorPersona, nuevoAbonado);

  function cambiarMoneda(m: Moneda) {
    setMoneda(m);
    setMonto("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (guardando) return;

    if (sinTasa) {
      setError("No se pudo obtener la tasa BCV para convertir bolívares.");
      return;
    }
    if (modo === "Sumar un pago" && ingresadoEuro <= 0) {
      setError("Indica cuánto abonó (mayor a 0).");
      return;
    }
    // "Corregir monto": se permite 0 (p. ej. para corregir un abono erróneo).
    if (nuevoAbonado === passenger.monto_abonado) {
      onCerrar();
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await onGuardar(nuevoAbonado);
      onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const bs = (eur: number) => (tasaEuro ? ` (${formatBs(eur * tasaEuro)})` : "");

  return (
    <Modal onClose={onCerrar}>
      <form onSubmit={handleSubmit}>
        <p className="text-base font-bold text-ink">
          Abono de {passenger.nombre_completo}
        </p>
        <p className="mt-1 text-sm text-mute">
          Abonado {formatEuro(passenger.monto_abonado)} · Pendiente{" "}
          <span className="text-danger-hover">
            {formatEuro(passenger.monto_pendiente)}
          </span>
        </p>

        <div className="mt-4 space-y-3">
          <Segmento
            opciones={["Sumar un pago", "Corregir monto"] as const}
            valor={modo}
            onChange={setModo}
          />

          <div>
            <span className="mb-1 block text-sm font-medium text-body">
              {modo === "Sumar un pago"
                ? "¿Cuánto abonó ahora?"
                : "Total abonado correcto"}
            </span>
            <div className="flex gap-2">
              <div className="w-24 shrink-0">
                <Segmento
                  opciones={["Bs", "€"] as const}
                  valor={moneda}
                  onChange={cambiarMoneda}
                />
              </div>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
                  {moneda}
                </span>
                <input
                  type={esBs ? "text" : "number"}
                  inputMode={esBs ? "numeric" : "decimal"}
                  autoFocus
                  min={0}
                  step="0.01"
                  className={`${CAMPO} ${esBs ? "pl-9" : "pl-7"}`}
                  value={monto}
                  onChange={(e) =>
                    setMonto(
                      esBs
                        ? formatMontoMascara(e.target.value)
                        : e.target.value,
                    )
                  }
                  placeholder={esBs ? "0,00" : "0.00"}
                />
              </div>
            </div>
            {/* Línea de conversión siempre presente para que no salte el layout. */}
            <p
              className={`mt-1 text-sm ${
                esBs && !tasaEuro ? "text-warning-active" : "text-stone"
              }`}
            >
              {esBs
                ? tasaEuro
                  ? `≈ ${formatEuro(ingresadoEuro)}`
                  : "[!] Tasa BCV no disponible."
                : tasaEuro
                  ? `≈ ${formatBs(ingresado * tasaEuro)}`
                  : " "}
            </p>
          </div>

          <div className="rounded-sm border border-hairline bg-surface-soft p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-mute">Nuevo abonado</span>
              <span className="tabular-nums text-ink">
                {formatEuro(nuevoAbonado)}
                <span className="text-stone">{bs(nuevoAbonado)}</span>
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-mute">Nuevo pendiente</span>
              <span className="tabular-nums text-danger-hover">
                {formatEuro(nuevoPendiente)}
                <span className="text-stone">{bs(nuevoPendiente)}</span>
              </span>
            </div>
            <div className="mt-1.5 text-right">
              <span className={`text-sm font-medium ${ESTADO_TONO[nuevoEstado]}`}>
                [ {nuevoEstado.toLowerCase()} ]
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium text-danger-hover" role="alert">
              [x] {error}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-11 rounded-sm px-4 text-sm font-medium text-mute active:text-ink"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className={`${BTN_PRIMARY} px-5`}
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
