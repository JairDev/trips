"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AccionesFab from "@/components/AccionesFab";
import AjustesViaje from "@/components/AjustesViaje";
import CajaTotal from "@/components/CajaTotal";
import GastosOperativos from "@/components/GastosOperativos";
import PasajerosList from "@/components/PasajerosList";
import RegistroForm from "@/components/RegistroForm";
import SeatCounterHeader from "@/components/SeatCounterHeader";
import Segmento from "@/components/Segmento";
import ZonasPanel from "@/components/ZonasPanel";
import {
  actualizarDestinoViaje,
  actualizarPrecioViaje,
  actualizarPuestosViaje,
  eliminarGasto,
  eliminarPasajero,
  fetchGastos,
  fetchPasajeros,
  fetchViajeActivo,
  insertGasto,
  insertPasajero,
  vaciarViaje,
} from "@/lib/api";
import { fetchTasaEuro } from "@/lib/bcv";
import type { Gasto, NuevoGasto, NuevoPasajero, Passenger, Trip } from "@/lib/types";
import { agruparPorZona } from "@/lib/zonas";
import { getSupabaseClient } from "@/utils/supabase/client";

type Estado = "cargando" | "listo" | "error";
type Pestana = "pasajeros" | "finanzas";

export default function DashboardPage() {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [estado, setEstado] = useState<Estado>("cargando");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tasaEuro, setTasaEuro] = useState<number | null>(null);
  const [pestana, setPestana] = useState<Pestana>("pasajeros");

  // --- Tasa EUR/Bs del BCV (para mostrar la conversión de los montos) -----
  useEffect(() => {
    let vivo = true;
    fetchTasaEuro().then((r) => {
      if (vivo) setTasaEuro(r.tasa);
    });
    return () => {
      vivo = false;
    };
  }, []);

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

        const [lista, listaGastos] = await Promise.all([
          fetchPasajeros(viaje.id_viaje),
          fetchGastos(viaje.id_viaje),
        ]);
        if (!vivo) return;

        setTrip(viaje);
        setPassengers(lista);
        setGastos(listaGastos);
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

  // --- Suscripción Realtime a la tabla gastos ------------------------------
  useEffect(() => {
    if (!tripId) return;

    const supabase = getSupabaseClient();
    const canal = supabase
      .channel(`gastos:${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gastos",
          filter: `id_viaje=eq.${tripId}`,
        },
        (payload) => {
          setGastos((prev) => {
            if (payload.eventType === "INSERT") {
              const fila = payload.new as Gasto;
              return prev.some((g) => g.id_gasto === fila.id_gasto)
                ? prev
                : [...prev, fila];
            }
            if (payload.eventType === "DELETE") {
              const fila = payload.old as Partial<Gasto>;
              return prev.filter((g) => g.id_gasto !== fila.id_gasto);
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

  const registrados = passengers.length;
  const lleno = trip ? registrados >= trip.puestos_totales : false;
  const zonas = useMemo(() => agruparPorZona(passengers), [passengers]);
  const totalRecaudado = useMemo(
    () => passengers.reduce((s, p) => s + p.monto_abonado, 0),
    [passengers],
  );
  const totalPorCobrar = useMemo(
    () => passengers.reduce((s, p) => s + p.monto_pendiente, 0),
    [passengers],
  );
  const totalGastos = useMemo(
    () => gastos.reduce((s, g) => s + g.monto, 0),
    [gastos],
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

  const guardarDestino = useCallback(
    async (nuevo: string) => {
      if (!trip) throw new Error("No hay viaje activo.");
      setTrip(await actualizarDestinoViaje(trip.id_viaje, nuevo));
    },
    [trip],
  );

  const quitarPasajero = useCallback(async (idViajero: string) => {
    await eliminarPasajero(idViajero);
    // Quita ya de la lista; el evento Realtime DELETE luego es idempotente.
    setPassengers((prev) => prev.filter((p) => p.id_viajero !== idViajero));
  }, []);

  const agregarGasto = useCallback(
    async (nuevo: NuevoGasto) => {
      if (!trip) throw new Error("No hay viaje activo.");
      const creado = await insertGasto(trip.id_viaje, nuevo);
      setGastos((prev) =>
        prev.some((g) => g.id_gasto === creado.id_gasto) ? prev : [...prev, creado],
      );
    },
    [trip],
  );

  const quitarGasto = useCallback(async (idGasto: string) => {
    await eliminarGasto(idGasto);
    setGastos((prev) => prev.filter((g) => g.id_gasto !== idGasto));
  }, []);

  const nuevoViaje = useCallback(async () => {
    if (!trip) return;
    const ok = window.confirm(
      `¿Empezar un viaje nuevo?\n\n` +
        `Se borrarán ${passengers.length} pasajero(s) y ${gastos.length} gasto(s) ` +
        `de "${trip.destino}". Esta acción no se puede deshacer.\n\n` +
        `Los puestos del bus y el precio del paquete se conservan; ajústalos ` +
        `para la próxima salida.`,
    );
    if (!ok) return;

    try {
      await vaciarViaje(trip.id_viaje);
      setPassengers([]);
      setGastos([]);
      setPestana("pasajeros");
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "No se pudo reiniciar el viaje. Intenta de nuevo.",
      );
    }
  }, [trip, passengers.length, gastos.length]);

  async function exportar() {
    if (!trip || passengers.length === 0) return;
    // Carga diferida de SheetJS: no entra en el bundle inicial (ahorra datos
    // móviles hasta que el coordinador realmente exporta).
    const { exportarPasajerosXlsx } = await import("@/lib/export-excel");
    exportarPasajerosXlsx(passengers, trip.destino, trip.fecha_salida, tasaEuro);
  }

  // --- Estados de carga / error -----------------------------------------
  if (estado === "cargando") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-mute">[ ... ] Cargando viaje</p>
      </main>
    );
  }

  if (estado === "error" || !trip) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6">
        <div className="w-full border border-hairline bg-canvas p-5">
          <p className="text-base font-bold text-danger-hover">
            [x] No se pudo cargar el dashboard
          </p>
          <p className="mt-2 text-sm text-body">{errorMsg}</p>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-body">
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
        onGuardarDestino={guardarDestino}
        onExport={exportar}
        exportDisabled={registrados === 0}
        onNuevoViaje={nuevoViaje}
      />

      <main className="mx-auto w-full max-w-[84rem] flex-1 px-4 pt-4 pb-28 lg:px-8 lg:pt-6 lg:pb-12">
        <div className="mx-auto grid max-w-2xl gap-4 lg:max-w-none lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:space-y-6 lg:overflow-y-auto lg:pr-1">
            <AjustesViaje
              puestosTotales={trip.puestos_totales}
              precioPorPersona={trip.precio_por_persona}
              registrados={registrados}
              tasaEuro={tasaEuro}
              onGuardarPuestos={guardarPuestos}
              onGuardarPrecio={guardarPrecio}
            />
            <RegistroForm
              onSubmit={agregarPasajero}
              precioPorPersona={trip.precio_por_persona}
              tasaEuro={tasaEuro}
              disabled={lleno}
            />
          </div>

          <div>
            <Segmento
              opciones={["pasajeros", "finanzas"] as const}
              valor={pestana}
              onChange={setPestana}
              etiquetas={{ pasajeros: "Pasajeros", finanzas: "Finanzas" }}
            />

            {pestana === "pasajeros" ? (
              <div className="mt-4 space-y-4 lg:space-y-6">
                <ZonasPanel zonas={zonas} />
                <PasajerosList
                  passengers={passengers}
                  tasaEuro={tasaEuro}
                  onEliminar={quitarPasajero}
                />
              </div>
            ) : (
              <div className="mt-4 space-y-4 lg:space-y-6">
                <CajaTotal
                  totalRecaudado={totalRecaudado}
                  totalPorCobrar={totalPorCobrar}
                  totalGastos={totalGastos}
                  tasaEuro={tasaEuro}
                />
                <GastosOperativos
                  gastos={gastos}
                  tasaEuro={tasaEuro}
                  onAgregar={agregarGasto}
                  onEliminar={quitarGasto}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <AccionesFab
        onExport={exportar}
        onNuevoViaje={nuevoViaje}
        exportDisabled={registrados === 0}
      />
    </>
  );
}
