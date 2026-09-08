"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  destino: string;
  puestosTotales: number;
  registrados: number;
  onGuardarDestino: (nuevo: string) => Promise<void>;
  onExport?: () => void;
  exportDisabled?: boolean;
  onNuevoViaje?: () => void | Promise<void>;
}

const BTN_HEADER =
  "shrink-0 rounded-sm border border-hairline-strong px-4 py-2 text-sm " +
  "font-medium text-ink active:bg-surface-soft disabled:text-ash";

/**
 * Cabecera fija con el balance de cupos. Estilo terminal: lienzo crema, tinta,
 * regla hairline inferior. El color semántico (danger / warning) solo aparece
 * cuando el cupo se agota o está por agotarse.
 * Fórmula: disponibles = totales - registrados.
 */
export default function SeatCounterHeader({
  destino,
  puestosTotales,
  registrados,
  onGuardarDestino,
  onExport,
  exportDisabled = false,
  onNuevoViaje,
}: Props) {
  const [reiniciando, setReiniciando] = useState(false);

  async function reiniciar() {
    if (reiniciando || !onNuevoViaje) return;
    setReiniciando(true);
    try {
      await onNuevoViaje();
    } finally {
      setReiniciando(false);
    }
  }

  // --- Edición en el sitio del nombre del destino -------------------------
  const [editandoDestino, setEditandoDestino] = useState(false);
  const [textoDestino, setTextoDestino] = useState("");
  const [guardandoDestino, setGuardandoDestino] = useState(false);
  const [errorDestino, setErrorDestino] = useState<string | null>(null);
  const destinoRef = useRef<HTMLInputElement>(null);
  const cancelarDestinoRef = useRef(false);

  useEffect(() => {
    if (errorDestino && editandoDestino) destinoRef.current?.focus();
  }, [errorDestino, editandoDestino]);

  function abrirDestino() {
    setTextoDestino(destino);
    setErrorDestino(null);
    setEditandoDestino(true);
  }

  async function confirmarDestino() {
    if (guardandoDestino) return;
    const limpio = textoDestino.trim();

    if (limpio === "" || limpio === destino) {
      setEditandoDestino(false);
      setErrorDestino(null);
      return;
    }

    setGuardandoDestino(true);
    setErrorDestino(null);
    try {
      await onGuardarDestino(limpio);
      setEditandoDestino(false);
    } catch (err) {
      setErrorDestino(
        err instanceof Error ? err.message : "No se pudo guardar el destino.",
      );
    } finally {
      setGuardandoDestino(false);
    }
  }

  const sinConfigurar = puestosTotales <= 0; // viaje recién reiniciado
  const disponibles = puestosTotales - registrados;
  const lleno = !sinConfigurar && disponibles <= 0;
  const casiLleno = !lleno && !sinConfigurar && disponibles <= 4;
  const ocupacion = sinConfigurar
    ? 0
    : Math.min(100, Math.round((registrados / puestosTotales) * 100));

  const tonoNumero = lleno
    ? "text-danger"
    : casiLleno
      ? "text-warning-active"
      : "text-ink";
  const tonoBarra = lleno
    ? "bg-danger"
    : casiLleno
      ? "bg-warning-active"
      : "bg-ink";

  return (
    <header
      className="sticky top-0 z-30 border-b border-hairline bg-canvas"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-[84rem] px-4 pt-3 pb-3 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="min-w-0 text-base font-bold">
              {editandoDestino ? (
                <input
                  ref={destinoRef}
                  autoFocus
                  disabled={guardandoDestino}
                  maxLength={80}
                  value={textoDestino}
                  onChange={(e) => setTextoDestino(e.target.value)}
                  onFocus={(e) => e.currentTarget.select()}
                  onBlur={() => {
                    if (cancelarDestinoRef.current) {
                      cancelarDestinoRef.current = false;
                      setEditandoDestino(false);
                      setErrorDestino(null);
                    } else {
                      confirmarDestino();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      destinoRef.current?.blur();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelarDestinoRef.current = true;
                      destinoRef.current?.blur();
                    }
                  }}
                  className="w-[200px] max-w-full rounded-sm border border-ink bg-canvas px-1.5 text-base font-bold text-ink outline-none disabled:opacity-50"
                />
              ) : (
                <button
                  type="button"
                  onClick={abrirDestino}
                  aria-label="Editar destino"
                  className="flex min-w-0 max-w-full items-center gap-1.5 rounded-sm border border-transparent px-1.5 text-left active:bg-surface-soft"
                >
                  <span className="truncate text-ink">{destino}</span>
                  <span className="shrink-0 text-sm font-normal text-accent">
                    [✎]
                  </span>
                </button>
              )}
            </h1>
            {errorDestino && (
              <p className="px-1.5 text-sm text-danger-hover">
                [x] {errorDestino}
              </p>
            )}
          </div>

          <div className="leading-none">
            <span
              className={`text-4xl font-bold tabular-nums sm:text-5xl ${tonoNumero}`}
            >
              {Math.max(0, disponibles)}
            </span>
            <span className="ml-2 text-sm font-medium text-mute">
              {sinConfigurar
                ? "puestos sin definir"
                : lleno
                  ? "sin cupos"
                  : "puestos disponibles"}
            </span>
          </div>

          {(onExport || onNuevoViaje) && (
            <div className="hidden shrink-0 gap-2 lg:flex">
              {onNuevoViaje && (
                <button
                  type="button"
                  onClick={reiniciar}
                  disabled={reiniciando}
                  className={BTN_HEADER}
                >
                  nuevo viaje
                </button>
              )}
              {onExport && (
                <button
                  type="button"
                  onClick={onExport}
                  disabled={exportDisabled}
                  className={BTN_HEADER}
                >
                  [↓] exportar a excel
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-3 h-2 w-full border border-hairline bg-surface-soft sm:mt-2">
          <div
            className={`h-full ${tonoBarra} transition-[width]`}
            style={{ width: `${ocupacion}%` }}
          />
        </div>

        {lleno && (
          <p className="mt-2 text-sm font-medium text-danger">
            [x] Autobús completo. No se pueden registrar más pasajeros.
          </p>
        )}
        {sinConfigurar && (
          <p className="mt-2 text-sm text-mute">
            [!] Define el destino, los puestos y el precio para empezar a
            registrar.
          </p>
        )}
      </div>
    </header>
  );
}
