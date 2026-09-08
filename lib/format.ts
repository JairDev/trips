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

/**
 * Máscara de entrada estilo calculadora: se teclean solo dígitos y los dos
 * últimos son los céntimos. "1136758" -> "11.367,58"; "" -> "".
 */
export function formatMontoMascara(entrada: string): string {
  const digitos = entrada.replace(/\D/g, '').replace(/^0+/, '');
  if (digitos === '') return '';
  const centimos = digitos.slice(-2).padStart(2, '0');
  const enteros = digitos.slice(0, -2) || '0';
  const conMiles = enteros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${conMiles},${centimos}`;
}

/** Inverso de {@link formatMontoMascara}: "11.367,58" -> 11367.58. */
export function parseMontoMascara(texto: string): number {
  const digitos = texto.replace(/\D/g, '');
  return digitos === '' ? 0 : Number(digitos) / 100;
}
