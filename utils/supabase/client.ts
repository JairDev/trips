import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente del navegador (singleton). Las claves NEXT_PUBLIC_* son públicas por
// diseño; la seguridad la aplica Row Level Security en la base de datos.

let cliente: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes("TU-PROYECTO")) {
    throw new Error(
      "Supabase no está configurado. Copia .env.example a .env.local y define " +
        "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (Dashboard → " +
        "Project Settings → API). Reinicia `npm run dev` después.",
    );
  }

  cliente = createClient(url, anonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return cliente;
}
