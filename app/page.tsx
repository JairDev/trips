"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AjustesViaje from "@/components/AjustesViaje";
import ExportFab from "@/components/ExportFab";
import PasajerosList from "@/components/PasajerosList";
import RegistroForm from "@/components/RegistroForm";
import SeatCounterHeader from "@/components/SeatCounterHeader";
import ZonasPanel from "@/components/ZonasPanel";
import {
  actualizarPrecioViaje,
  actualizarPuestosViaje,
  eliminarPasajero,
  fetchPasajeros,
  fetchViajeActivo,
  insertPasajero,
} from "@/lib/api";
import type { NuevoPasajero, Passenger, Trip } from "@/lib/types";
import { agruparPorZona } from "@/lib/zonas";
import { getSupabaseClient } from "@/utils/supabase/client";

type Estado = "cargando" | "listo" | "error";

export default function DashboardPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Carga inicial: viaje activo + sus pasajeros -------------------------
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const viaje = await fetchViajeActivo();
        if (!vivo) return;

        if (!viaje) {
          setEstado("error");
          setErrorMsg(
            "No hay viajes en la base de datos. Ejecuta supabase/schema.sql en el SQL Editor de Supabase.",
          );
          return;
        }

        const lista = await fetchPasajeros(viaje.id_viaje);
        if (!vivo) return;

        setTrip(viaje);
        setPassengers(lista);
        setEstado("listo");
      } catch (err) {
        if (!vivo) return;
        setEstado("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Error de conexión con Supabase.",
        );
      }
    })();

    return () => {
      vivo = false;
    };
  }, []);

  const tripId = trip?.id_viaje;

  // --- Suscripción Realtime a la tabla passengers -------------------------
  useEffect(() => {
    if (!tripId) return;

    const supabase = getSupabaseClient();
    const canal = supabase
      .channel(`passengers:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "passengers",
          filter: `id_viaje=eq.${tripId}`,
        },
        (payload) => {
          setPassengers((prev) => {
            if (payload.eventType === "INSERT") {
              const fila = payload.new as Passenger;
              return prev.some((p) => p.id_viajero === fila.id_viajero)
                ? prev
                : [...prev, fila];
            }
            if (payload.eventType === "UPDATE") {
              const fila = payload.new as Passenger;
              return prev.map((p) =>
                p.id_viajero === fila.id_viajero ? fila : p,
              );
            }
            if (payload.eventType === "DELETE") {
              const fila = payload.old as Partial<Passenger>;
              return prev.filter((p) => p.id_viajero !== fila.id_viajero);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tripId]);

  // --- Realtime del viaje (precio del paquete editado por otro coordinador) --
  useEffect(() => {
    if (!tripId) return;

    const supabase = getSupabaseClient();
    const canal = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trips",
          filter: `id_viaje=eq.${tripId}`,
        },
        (payload) => setTrip(payload.new as Trip),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tripId]);

  const registrados = passengers.length;
  const lleno = trip ? registrados >= trip.puestos_totales : false;
  const zonas = useMemo(() => agruparPorZona(passengers), [passengers]);
  const recaudado = useMemo(
    () => passengers.reduce((s, p) => s + p.monto_abonado, 0),
    [passengers],
  );
  const porCobrar = useMemo(
    () => passengers.reduce((s, p) => s + p.monto_pendiente, 0),
    [passengers],
  );

  // --- Alta desde el Formulario Exprés (con validación de cupos) ----------
  const agregarPasajero = useCallback(
    async (nuevo: NuevoPasajero) => {
      if (!trip) throw new Error("No hay viaje activo.");
      // Validación de cliente: no superar la capacidad del autobús.
      if (passengers.length >= trip.puestos_totales) {
        throw new Error("El autobús está completo. No se pueden añadir puestos.");
      }

      const creado = await insertPasajero(trip.id_viaje, nuevo);
      // Feedback inmediato; el evento Realtime luego llega y se deduplica.
      setPassengers((prev) =>
        prev.some((p) => p.id_viajero === creado.id_viajero)
          ? prev
          : [...prev, creado],
      );
    },
    [trip, passengers.length],
  );

  const guardarPrecio = useCallback(
    async (nuevo: number) => {
      if (!trip) throw new Error("No hay viaje activo.");
      const actualizado = await actualizarPrecioViaje(trip.id_viaje, nuevo);
      setTrip(actualizado);
      // El backend recalcula el pendiente de cada pasajero; refrescamos la lista.
      setPassengers(await fetchPasajeros(trip.id_viaje));
    },
    [trip],
  );

  const guardarPuestos = useCallback(
    async (nuevo: number) => {
      if (!trip) throw new Error("No hay viaje activo.");
      setTrip(await actualizarPuestosViaje(trip.id_viaje, nuevo));
    },
    [trip],
  );

  const quitarPasajero = useCallback(async (idViajero: string) => {
    await eliminarPasajero(idViajero);
    // Quita ya de la lista; el evento Realtime DELETE luego es idempotente.
    setPassengers((prev) => prev.filter((p) => p.id_viajero !== idViajero));
  }, []);

  async function exportar() {
    if (!trip || passengers.length === 0) return;
    // Carga diferida de SheetJS: no entra en el bundle inicial (ahorra datos
    // móviles hasta que el coordinador realmente exporta).
    const { exportarPasajerosXlsx } = await import("@/lib/export-excel");
    exportarPasajerosXlsx(passengers, trip.destino, trip.fecha_salida);
  }

  // --- Estados de carga / error -----------------------------------------
  if (estado === "cargando") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-teal-700" />
        <p className="text-sm text-zinc-500">Cargando viaje…</p>
      </main>
    );
  }

  if (estado === "error" || !trip) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">
            No se pudo cargar el dashboard
          </p>
          <p className="mt-2 text-sm text-amber-800">{errorMsg}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-left text-xs text-amber-800">
            <li>
              Define <code>NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
              <code>.env.local</code>.
            </li>
            <li>
              Ejecuta <code>supabase/schema.sql</code> en el SQL Editor.
            </li>
            <li>
              Reinicia <code>npm run dev</code>.
            </li>
          </ol>
        </div>
      </main>
    );
  }

  // --- Dashboard --------------------------------------------------------
  return (
    <>
      <SeatCounterHeader
        destino={trip.destino}
        fechaSalida={trip.fecha_salida}
        puestosTotales={trip.puestos_totales}
        registrados={registrados}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 pt-4 pb-28">
        <AjustesViaje
          puestosTotales={trip.puestos_totales}
          precioPorPersona={trip.precio_por_persona}
          registrados={registrados}
          recaudado={recaudado}
          porCobrar={porCobrar}
          onGuardarPuestos={guardarPuestos}
          onGuardarPrecio={guardarPrecio}
        />
        <RegistroForm
          onSubmit={agregarPasajero}
          precioPorPersona={trip.precio_por_persona}
          disabled={lleno}
        />
        <ZonasPanel zonas={zonas} />
        <PasajerosList passengers={passengers} onEliminar={quitarPasajero} />
      </main>

      <ExportFab onClick={exportar} disabled={registrados === 0} />
    </>
  );
}
