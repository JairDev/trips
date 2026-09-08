import { getSupabaseClient } from "@/utils/supabase/client";
import type { Gasto, NuevoGasto, NuevoPasajero, Passenger, Trip } from "./types";

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

/**
 * Actualiza el precio del paquete del viaje. Un trigger en Postgres recalcula
 * `monto_pendiente` y `estado_pago` de todos los pasajeros de ese viaje, y esos
 * cambios llegan a los coordinadores por Realtime.
 */
export async function actualizarPrecioViaje(
  idViaje: string,
  precioPorPersona: number,
): Promise<Trip> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ precio_por_persona: precioPorPersona })
    .eq("id_viaje", idViaje)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Trip;
}

/** Actualiza la capacidad (puestos) del autobús del viaje. */
export async function actualizarPuestosViaje(
  idViaje: string,
  puestosTotales: number,
): Promise<Trip> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ puestos_totales: puestosTotales })
    .eq("id_viaje", idViaje)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Trip;
}

/** Actualiza el nombre del destino del viaje. */
export async function actualizarDestinoViaje(
  idViaje: string,
  destino: string,
): Promise<Trip> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ destino })
    .eq("id_viaje", idViaje)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Trip;
}

export async function eliminarPasajero(idViajero: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("passengers")
    .delete()
    .eq("id_viajero", idViajero);
  if (error) throw new Error(error.message);
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

export async function fetchGastos(idViaje: string): Promise<Gasto[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .eq("id_viaje", idViaje)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Gasto[];
}

export async function insertGasto(
  idViaje: string,
  nuevo: NuevoGasto,
): Promise<Gasto> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("gastos")
    .insert({ ...nuevo, id_viaje: idViaje })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Gasto;
}

export async function eliminarGasto(idGasto: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("gastos").delete().eq("id_gasto", idGasto);
  if (error) throw new Error(error.message);
}

/**
 * Borra todos los pasajeros y gastos del viaje para empezar de cero.
 * El viaje (destino, fecha, puestos, precio) se conserva y se reutiliza.
 */
export async function vaciarViaje(idViaje: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error: errPax } = await supabase
    .from("passengers")
    .delete()
    .eq("id_viaje", idViaje);
  if (errPax) throw new Error(errPax.message);

  const { error: errGastos } = await supabase
    .from("gastos")
    .delete()
    .eq("id_viaje", idViaje);
  if (errGastos) throw new Error(errGastos.message);
}
