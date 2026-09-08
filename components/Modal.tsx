"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Shell de modal: backdrop atenuado (sin sombra, estilo terminal), panel con
 * borde de tinta. Escape o click fuera cierra; bloquea el scroll de fondo.
 */
export default function Modal({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90dvh] w-full max-w-sm overflow-y-auto border border-ink bg-canvas p-5"
      >
        {children}
      </div>
    </div>
  );
}
