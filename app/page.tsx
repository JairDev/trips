"use client";

import { useMemo, useState } from "react";
import ExportFab from "@/components/ExportFab";
import PasajerosList from "@/components/PasajerosList";
import RegistroForm from "@/components/RegistroForm";
import SeatCounterHeader from "@/components/SeatCounterHeader";
import ZonasPanel from "@/components/ZonasPanel";
import { PASAJEROS_MOCK, VIAJE_MOCK } from "@/lib/mock-data";
import type { NuevoPasajero, Passenger } from "@/lib/types";
import { agruparPorZona } from "@/lib/zonas";

export default function DashboardPage() {
  // Fase 1: estado local con datos mock. En la Fase 2 se hidrata desde Supabase
  // y se sincroniza vía Realtime.
  const viaje = VIAJE_MOCK;
  const [passengers, setPassengers] = useState<Passenger[]>(PASAJEROS_MOCK);

  const registrados = passengers.length;
  const lleno = registrados >= viaje.puestos_totales;

  const zonas = useMemo(() => agruparPorZona(passengers), [passengers]);

  function agregarPasajero(nuevo: NuevoPasajero) {
    if (passengers.length >= viaje.puestos_totales) return;
    setPassengers((prev) => [
      ...prev,
      {
        ...nuevo,
        id_viajero:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `local-${Date.now()}`,
        id_viaje: viaje.id_viaje,
        created_at: new Date().toISOString(),
      },
    ]);
  }

  function exportar() {
    // Placeholder hasta la Fase 3 (SheetJS).
    alert(
      `Exportación a Excel disponible en la Fase 3.\n${registrados} pasajeros en la lista.`,
    );
  }

  return (
    <>
      <SeatCounterHeader
        destino={viaje.destino}
        fechaSalida={viaje.fecha_salida}
        puestosTotales={viaje.puestos_totales}
        registrados={registrados}
      />

      <main className="mx-auto w-full max-w-md flex-1 space-y-4 px-4 pt-4 pb-28">
        <RegistroForm onSubmit={agregarPasajero} disabled={lleno} />
        <ZonasPanel zonas={zonas} />
        <PasajerosList passengers={passengers} />
      </main>

      <ExportFab onClick={exportar} disabled={registrados === 0} />
    </>
  );
}
