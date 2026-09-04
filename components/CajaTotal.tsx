import { formatBs, formatEuro } from "@/lib/format";
import { CARD, SECTION_TITLE } from "@/lib/ui";

interface Props {
  totalRecaudado: number;
  totalPorCobrar: number;
  tasaEuro: number | null;
}

/**
 * Totales de caja del viaje, en bolívares (cifra principal, es lo que se
 * cobra/recibe en la calle) con el equivalente en euros debajo (la moneda
 * en la que está fijado el precio del paquete).
 */
export default function CajaTotal({
  totalRecaudado,
  totalPorCobrar,
  tasaEuro,
}: Props) {
  return (
    <section className={CARD}>
      <h2 className={SECTION_TITLE}>Caja del viaje</h2>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-mute">Total recaudado</p>
          <p className="text-2xl font-bold tabular-nums text-ink">
            {tasaEuro ? formatBs(totalRecaudado * tasaEuro) : formatEuro(totalRecaudado)}
          </p>
          {tasaEuro && (
            <p className="text-sm text-stone">≈ {formatEuro(totalRecaudado)}</p>
          )}
        </div>

        <div>
          <p className="text-sm text-mute">Por cobrar</p>
          <p className="text-2xl font-bold tabular-nums text-danger-hover">
            {tasaEuro ? formatBs(totalPorCobrar * tasaEuro) : formatEuro(totalPorCobrar)}
          </p>
          {tasaEuro && (
            <p className="text-sm text-stone">≈ {formatEuro(totalPorCobrar)}</p>
          )}
        </div>
      </div>

      <p className="mt-4 border-t border-hairline pt-3 text-sm text-stone">
        {tasaEuro
          ? `Tasa BCV: ${formatBs(tasaEuro)} / €`
          : "[!] Tasa BCV no disponible; se muestra solo en euros."}
      </p>
    </section>
  );
}
