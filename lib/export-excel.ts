import * as XLSX from "xlsx";
import type { Passenger } from "./types";

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Genera el reporte .xlsx de pasajeros ENTERAMENTE en el cliente (SheetJS) y
 * dispara la descarga local. Cero consumo de ancho de banda de servidor:
 * pensado para usarse en ruta con datos móviles limitados.
 */
export function exportarPasajerosXlsx(
  passengers: Passenger[],
  destino: string,
  fechaSalida: string,
): void {
  const filas: Record<string, string | number>[] = passengers.map((p) => ({
    Nombre: p.nombre_completo,
    "Grupo de Origen": p.grupo_origen,
    "Zona de Recogida": p.zona_recogida,
    "Método de Pago": p.metodo_pago,
    "Estado de Pago": p.estado_pago,
    "Monto Abonado": p.monto_abonado,
    "Monto Pendiente": p.monto_pendiente,
  }));

  // Fila de totales para el control de caja.
  const totalAbonado = passengers.reduce((s, p) => s + p.monto_abonado, 0);
  const totalPendiente = passengers.reduce((s, p) => s + p.monto_pendiente, 0);
  filas.push({
    Nombre: `TOTAL (${passengers.length})`,
    "Grupo de Origen": "",
    "Zona de Recogida": "",
    "Método de Pago": "",
    "Estado de Pago": "",
    "Monto Abonado": totalAbonado,
    "Monto Pendiente": totalPendiente,
  });

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 26 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 15 },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Pasajeros");

  const slug =
    destino
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "viaje";

  XLSX.writeFile(libro, `pasajeros-${slug}-${fechaSalida}.xlsx`);
}
