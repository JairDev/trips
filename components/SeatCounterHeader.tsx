import { formatFecha } from "@/lib/format";

interface Props {
  destino: string;
  fechaSalida: string;
  puestosTotales: number;
  registrados: number;
}

/**
 * Header fijo (sticky) con el balance de cupos en tiempo real.
 * Fórmula: disponibles = totales - registrados.
 * Cambia de color al agotarse los cupos.
 */
export default function SeatCounterHeader({
  destino,
  fechaSalida,
  puestosTotales,
  registrados,
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
      <div className="mx-auto max-w-md px-4 pt-3 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-base font-semibold leading-tight">{destino}</h1>
          <span className="text-xs opacity-90">{formatFecha(fechaSalida)}</span>
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div className="leading-none">
            <span className="text-5xl font-bold tabular-nums">
              {Math.max(0, disponibles)}
            </span>
            <span className="ml-2 text-sm font-medium opacity-90">
              {lleno ? "sin cupos" : "disponibles"}
            </span>
          </div>
          <div className="text-right text-sm tabular-nums opacity-90">
            <div>
              {registrados} / {puestosTotales}
            </div>
            <div className="text-xs">ocupados</div>
          </div>
        </div>

        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/20">
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
