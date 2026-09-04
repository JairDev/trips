"use client";

import { useState } from "react";
import Segmento from "@/components/Segmento";
import { formatBs, formatEuro } from "@/lib/format";
import { redondear2 } from "@/lib/pagos";
import type { Gasto, NuevoGasto } from "@/lib/types";
import { BTN_PRIMARY, CAMPO, CARD, SECTION_TITLE } from "@/lib/ui";

interface Props {
  gastos: Gasto[];
  tasaEuro: number | null;
  onAgregar: (nuevo: NuevoGasto) => Promise<void>;
  onEliminar: (idGasto: string) => Promise<void>;
}

type Moneda = "€" | "Bs";

/**
 * Gastos operativos del viaje (transporte, snacks, peajes...). Igual que el
 * abono de un pasajero, se puede cargar en euros o en bolívares; internamente
 * siempre se guarda en euros para poder sumarlo con el resto de los montos.
 */
export default function GastosOperativos({
  gastos,
  tasaEuro,
  onAgregar,
  onEliminar,
}: Props) {
  const [concepto, setConcepto] = useState("");
  const [moneda, setMoneda] = useState<Moneda>("Bs");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const esBs = moneda === "Bs";
  const montoIngresado = redondear2(Math.max(0, Number(monto) || 0));
  const sinTasaParaConvertir = esBs && montoIngresado > 0 && !tasaEuro;
  const montoEuro =
    esBs && tasaEuro ? redondear2(montoIngresado / tasaEuro) : !esBs ? montoIngresado : 0;

  function cambiarMoneda(nueva: Moneda) {
    setMoneda(nueva);
    // El monto ya escrito quedaría en la moneda equivocada.
    setMonto("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!concepto.trim()) {
      setError("Indica el concepto del gasto.");
      return;
    }
    if (montoIngresado <= 0) {
      setError("Indica un monto mayor a 0.");
      return;
    }
    if (sinTasaParaConvertir) {
      setError(
        "No se pudo obtener la tasa BCV para convertir bolívares a euros. Intenta de nuevo en unos minutos.",
      );
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      await onAgregar({ concepto: concepto.trim(), monto: montoEuro });
      setConcepto("");
      setMonto("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar el gasto.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleEliminar(g: Gasto) {
    if (eliminando) return;
    if (!window.confirm(`¿Eliminar el gasto "${g.concepto}"?`)) return;
    setEliminando(g.id_gasto);
    try {
      await onEliminar(g.id_gasto);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "No se pudo eliminar el gasto.");
    } finally {
      setEliminando(null);
    }
  }

  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);

  return (
    <section className={CARD}>
      <h2 className={SECTION_TITLE}>Gastos operativos</h2>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-body">Concepto</span>
          <input
            className={CAMPO}
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Transporte, snacks, peaje"
            autoComplete="off"
          />
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-body">Moneda</span>
          <Segmento
            opciones={["Bs", "€"] as const}
            valor={moneda}
            onChange={cambiarMoneda}
          />
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-body">Monto</span>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body">
              {moneda}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              className={`${CAMPO} ${esBs ? "pl-9" : "pl-7"}`}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {esBs &&
            (tasaEuro ? (
              montoIngresado > 0 && (
                <p className="mt-1 text-sm text-stone">≈ {formatEuro(montoEuro)}</p>
              )
            ) : (
              <p className="mt-1 text-sm text-warning-active">
                [!] Tasa BCV no disponible; no se puede convertir a euros.
              </p>
            ))}
        </label>

        {error && (
          <p className="text-sm font-medium text-danger-hover" role="alert">
            [x] {error}
          </p>
        )}

        <button type="submit" disabled={enviando} className={`${BTN_PRIMARY} w-full`}>
          {enviando ? "Agregando..." : "Agregar gasto"}
        </button>
      </form>

      <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
        {gastos.length === 0 && (
          <li className="py-6 text-center text-sm text-stone">
            Sin gastos registrados.
          </li>
        )}
        {gastos.map((g) => (
          <li key={g.id_gasto} className="flex items-center justify-between gap-2 py-3">
            <span className="min-w-0 truncate text-body">{g.concepto}</span>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-ink">
                {tasaEuro ? formatBs(g.monto * tasaEuro) : formatEuro(g.monto)}
                {tasaEuro && (
                  <span className="text-stone"> (≈ {formatEuro(g.monto)})</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => handleEliminar(g)}
                disabled={eliminando === g.id_gasto}
                aria-label={`Eliminar gasto ${g.concepto}`}
                className="min-h-8 px-1 text-sm text-mute active:text-danger-hover disabled:text-ash"
              >
                [x]
              </button>
            </div>
          </li>
        ))}
      </ul>

      {gastos.length > 0 && (
        <p className="mt-3 border-t border-hairline pt-3 text-right text-sm text-mute">
          Total gastos:{" "}
          <span className="font-bold tabular-nums text-ink">
            {tasaEuro ? formatBs(totalGastos * tasaEuro) : formatEuro(totalGastos)}
          </span>
          {tasaEuro && <span className="text-stone"> (≈ {formatEuro(totalGastos)})</span>}
        </p>
      )}
    </section>
  );
}
