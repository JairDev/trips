"use client";

import { useEffect, useState } from "react";

interface Props {
  onExport: () => void;
  onNuevoViaje: () => void | Promise<void>;
  exportDisabled?: boolean;
}

/**
 * Botón flotante de acciones en móvil (en escritorio estas acciones están en
 * el header). Al pulsarlo despliega un pequeño menú: exportar y nuevo viaje.
 */
export default function AccionesFab({
  onExport,
  onNuevoViaje,
  exportDisabled = false,
}: Props) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  function ejecutar(fn: () => void | Promise<void>) {
    setAbierto(false);
    // Deja que el menú se cierre visualmente antes de abrir el confirm/descarga.
    setTimeout(() => fn(), 0);
  }

  const ITEM =
    "rounded-sm border border-hairline-strong bg-canvas px-4 py-2.5 text-sm " +
    "font-medium text-ink active:bg-surface-soft disabled:text-ash";

  return (
    <div className="lg:hidden">
      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-40 bg-ink/20"
        />
      )}

      <div
        className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-2"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {abierto && (
          <>
            <button
              type="button"
              className={ITEM}
              onClick={() => ejecutar(onNuevoViaje)}
            >
              nuevo viaje
            </button>
            <button
              type="button"
              className={ITEM}
              disabled={exportDisabled}
              onClick={() => ejecutar(onExport)}
            >
              [↓] exportar a excel
            </button>
          </>
        )}

        <button
          type="button"
          aria-expanded={abierto}
          aria-label="Acciones"
          onClick={() => setAbierto((v) => !v)}
          className="rounded-sm bg-ink px-4 py-3 text-sm font-medium text-canvas active:bg-ink-deep"
        >
          {abierto ? "[x] cerrar" : "[≡] acciones"}
        </button>
      </div>
    </div>
  );
}
