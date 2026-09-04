export interface TasaEuroResponse {
  tasa: number | null;
  error?: string;
  advertencia?: string;
}

/** Consulta la tasa EUR/Bs del BCV a través de nuestra propia API (server-side). */
export async function fetchTasaEuro(): Promise<TasaEuroResponse> {
  try {
    const res = await fetch("/api/tasa-euro");
    return (await res.json()) as TasaEuroResponse;
  } catch {
    return { tasa: null, error: "No se pudo consultar la tasa del BCV." };
  }
}
