"use client";

interface Props {
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Acción de exportar en móvil. Estilo terminal: rectángulo de 4px, relleno
 * tinta, sin sombra. En escritorio la exporta el botón del header.
 */
export default function ExportFab({ onClick, disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-4 right-4 z-40 rounded-sm bg-ink px-4 py-3 text-sm font-medium text-canvas active:bg-ink-deep disabled:bg-surface-card disabled:text-ash lg:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      [↓] exportar
    </button>
  );
}
