import { formatFecha } from "@/lib/format";

interface Props {
  destino: string;
  fechaSalida: string;
  puestosTotales: number;
  registrados: number;
  onExport?: () => void;
  exportDisabled?: boolean;
}

/**
 * Header fijo (sticky) con el balance de cupos en tiempo real.
 * Fórmula: disponibles = totales - registrados.
 * Cambia de color al agotarse los cupos.
 * En escritorio se despliega en horizontal e incluye el botón de exportar.
 */
export default function SeatCounterHeader({
  destino,
  fechaSalida,
  puestosTotales,
  registrados,
  onExport,
  exportDisabled = false,
}: Props) {
  const disponibles = puestosTotales - registrados;
  const lleno = disponibles <= 0;
  const casiLleno = !lleno && disponibles <= 4;
  const ocupacion = Math.min(
    100,
    Math.round((registrados / puestosTotales) * 100),
  );

  const tono = lleno
    ? "bg-red-600 text-white"
    : casiLleno
      ? "bg-amber-500 text-white"
      : "bg-teal-700 text-white";

  return (
    <header
      className={`sticky top-0 z-30 ${tono} shadow-md transition-colors`}
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto max-w-6xl px-4 pt-3 pb-4 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight sm:text-xl">
              {destino}
            </h1>
            <p className="text-xs opacity-90 sm:text-sm">
              {formatFecha(fechaSalida)}
            </p>
          </div>

          <div className="flex items-end justify-between gap-4 sm:justify-start sm:gap-6">
            <div className="leading-none">
              <span className="text-4xl font-bold tabular-nums sm:text-5xl">
                {Math.max(0, disponibles)}
              </span>
              <span className="ml-2 text-sm font-medium opacity-90">
                {lleno ? "sin cupos" : "disponibles"}
              </span>
            </div>
            <div className="pb-1 text-right text-sm tabular-nums opacity-90">
              <div>
                {registrados} / {puestosTotales}
              </div>
              <div className="text-xs">ocupados</div>
            </div>
          </div>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exportDisabled}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold ring-1 ring-white/30 transition-colors hover:bg-white/25 disabled:opacity-40 lg:inline-flex"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Exportar a Excel
            </button>
          )}
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-black/20 sm:mt-2">
          <div
            className="h-full rounded-full bg-white/90 transition-[width]"
            style={{ width: `${ocupacion}%` }}
          />
        </div>

        {lleno && (
          <p className="mt-2 text-xs font-medium">
            Autobús completo. No se pueden registrar más pasajeros.
          </p>
        )}
      </div>
    </header>
  );
}
