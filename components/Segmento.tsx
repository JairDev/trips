"use client";

interface Props<T extends string> {
  opciones: readonly T[];
  valor: T;
  onChange: (v: T) => void;
  etiquetas?: Partial<Record<T, string>>;
}

/**
 * Tira de pestañas reutilizable (button-tab / button-tab-active del sistema
 * de diseño): sin relleno, la activa lleva subrayado de 2px. Se usa tanto
 * para segmentos dentro de un formulario (modalidad de pago, moneda de un
 * gasto) como para las pestañas de nivel de página (Pasajeros / Finanzas).
 */
export default function Segmento<T extends string>({
  opciones,
  valor,
  onChange,
  etiquetas,
}: Props<T>) {
  return (
    <div className="flex border-b border-hairline" role="tablist">
      {opciones.map((op) => (
        <button
          key={op}
          type="button"
          role="tab"
          aria-selected={valor === op}
          onClick={() => onChange(op)}
          className={`min-h-11 flex-1 px-2 text-sm font-medium ${
            valor === op ? "-mb-px border-b-2 border-ash text-ink" : "text-mute"
          }`}
        >
          {etiquetas?.[op] ?? op}
        </button>
      ))}
    </div>
  );
}
