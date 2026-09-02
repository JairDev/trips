import { getSupabaseClient } from "@/utils/supabase/client";
import type { NuevoPasajero, Passenger, Trip } from "./types";

/**
 * Viaje "activo": la próxima salida programada (fecha_salida >= hoy).
 * Si no hay salidas futuras, devuelve la más reciente. `null` si no hay viajes.
 */
export async function fetchViajeActivo(): Promise<Trip | null> {
  const supabase = getSupabaseClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: futuras, error } = await supabase
    .from("trips")
    .select("*")
    .gte("fecha_salida", hoy)
    .order("fecha_salida", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  if (futuras && futuras.length > 0) return futuras[0] as Trip;

  const { data: recientes, error: err2 } = await supabase
    .from("trips")
    .select("*")
    .order("fecha_salida", { ascending: false })
    .limit(1);
  if (err2) throw new Error(err2.message);
  return (recientes?.[0] as Trip | undefined) ?? null;
}

export async function fetchPasajeros(idViaje: string): Promise<Passenger[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("passengers")
    .select("*")
    .eq("id_viaje", idViaje)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Passenger[];
}

export async function insertPasajero(
  idViaje: string,
  nuevo: NuevoPasajero,
): Promise<Passenger> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("passengers")
    .insert({ ...nuevo, id_viaje: idViaje })
    .select()
    .single();

  if (error) {
    // 23505 = unique_violation -> índice único (id_viaje, lower(nombre)).
    if (error.code === "23505") {
      throw new Error("Ya hay un pasajero con ese nombre en este viaje.");
    }
    throw new Error(error.message);
  }
  return data as Passenger;
}
