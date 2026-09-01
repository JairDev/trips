import type { ZonaConteo } from "@/lib/zonas";

interface Props {
  zonas: ZonaConteo[];
}

/**
 * Panel compacto de logística: cuenta de excursionistas por zona de recogida
 * para coordinar las paradas del autobús en ruta.
 */
export default function ZonasPanel({ zonas }: Props) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Control de zonas
      </h2>

      {zonas.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">Aún no hay pasajeros.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {zonas.map((z) => (
            <li
              key={z.zona}
              className="flex items-center gap-2 rounded-full bg-teal-50 py-1.5 pl-3 pr-2 text-sm text-teal-900"
            >
              <span className="font-medium">{z.zona}</span>
              <span className="min-w-6 rounded-full bg-teal-700 px-1.5 text-center text-xs font-semibold leading-5 text-white tabular-nums">
                {z.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
