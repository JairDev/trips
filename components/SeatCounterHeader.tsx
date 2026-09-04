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
 * Cabecera fija con el balance de cupos. Estilo terminal: lienzo crema, tinta,
 * regla hairline inferior. El color semántico (danger / warning) solo aparece
 * cuando el cupo se agota o está por agotarse.
 * Fórmula: disponibles = totales - registrados.
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
            <h1 className="truncate text-base font-bold text-ink">
              {destino}
            </h1>
            <p className="text-sm text-mute">{formatFecha(fechaSalida)}</p>
          </div>

          <div className="leading-none">
            <span
              className={`text-4xl font-bold tabular-nums sm:text-5xl ${tonoNumero}`}
            >
              {Math.max(0, disponibles)}
            </span>
            <span className="ml-2 text-sm font-medium text-mute">
              {lleno ? "sin cupos" : "disponibles"}
            </span>
          </div>

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              disabled={exportDisabled}
              className="hidden shrink-0 rounded-sm border border-hairline-strong px-4 py-2 text-sm font-medium text-ink active:bg-surface-soft disabled:text-ash lg:inline-block"
            >
              [↓] exportar a excel
            </button>
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
      </div>
    </header>
  );
}
