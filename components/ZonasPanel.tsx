import type { ZonaConteo } from "@/lib/zonas";
import { CARD, SECTION_TITLE } from "@/lib/ui";

interface Props {
  zonas: ZonaConteo[];
}

/**
 * Panel compacto de logística: cuenta de excursionistas por zona de recogida
 * para coordinar las paradas del autobús en ruta.
 */
export default function ZonasPanel({ zonas }: Props) {
  return (
    <section className={CARD}>
      <h2 className={SECTION_TITLE}>Control de zonas</h2>

      {zonas.length === 0 ? (
        <p className="mt-3 text-sm text-stone">Aún no hay pasajeros.</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {zonas.map((z) => (
            <li
              key={z.zona}
              className="rounded-sm border border-hairline bg-surface-soft px-2.5 py-1 text-sm text-body"
            >
              {z.zona}{" "}
              <span className="font-bold tabular-nums text-ink">
                [{z.total}]
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
