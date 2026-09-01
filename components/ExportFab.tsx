"use client";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Botón flotante (FAB) para exportar a Excel.
 * La lógica de generación .xlsx llega en la Fase 3 (SheetJS en cliente).
 */
export default function ExportFab({ onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Exportar lista a Excel"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 active:bg-emerald-700 disabled:opacity-40"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6"
      >
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    </button>
  );
}
