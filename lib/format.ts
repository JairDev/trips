/** Formatea un monto con separador de miles y 2 decimales (es-VE). */
export function formatMonto(valor: number): string {
  return valor.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Monto en euros, ej. 12 -> "€12,00". Todos los montos de la app son EUR. */
export function formatEuro(valor: number): string {
  return `€${formatMonto(valor)}`;
}

/** Monto en bolívares, ej. 11261.4 -> "Bs 11.261,40". */
export function formatBs(valor: number): string {
  return `Bs ${formatMonto(valor)}`;
}

/** Fecha 'YYYY-MM-DD' -> 'sáb, 14 sep 2026' sin desfases de zona horaria. */
export function formatFecha(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const fecha = new Date(y, (m ?? 1) - 1, d ?? 1);
  return fecha.toLocaleDateString('es-VE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
