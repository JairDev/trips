import { getSupabaseClient } from "@/utils/supabase/client";

export interface TasaEuro {
  tasa: number | null;
  actualizada?: string;
}

/**
 * Lee la tasa EUR->Bs del BCV desde la tabla `tasa_bcv` (fila única id=1).
 * Esa fila la mantiene al día un cron de GitHub Actions; la app ya no raspa
 * bcv.org.ve directamente.
 */
export async function fetchTasaEuro(): Promise<TasaEuro> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("tasa_bcv")
      .select("eur_bs, actualizada")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return { tasa: null };
    return { tasa: Number(data.eur_bs), actualizada: data.actualizada as string };
  } catch {
    return { tasa: null };
  }
}
