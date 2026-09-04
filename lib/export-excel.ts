import * as XLSX from "xlsx";
import { redondear2 } from "./pagos";
import type { Passenger } from "./types";

const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Genera el reporte .xlsx de pasajeros ENTERAMENTE en el cliente (SheetJS) y
 * dispara la descarga local. Cero consumo de ancho de banda de servidor:
 * pensado para usarse en ruta con datos móviles limitados.
 *
 * Los montos están en euros; si se pasa `tasaEuro` (tasa BCV del día) se
 * añaden columnas con el equivalente en bolívares.
 */
export function exportarPasajerosXlsx(
  passengers: Passenger[],
  destino: string,
  fechaSalida: string,
  tasaEuro: number | null = null,
): void {
  const conBs = tasaEuro !== null;

  const filas: Record<string, string | number>[] = passengers.map((p) => ({
    Nombre: p.nombre_completo,
    "Grupo de Origen": p.grupo_origen,
    "Zona de Recogida": p.zona_recogida,
    "Método de Pago": p.metodo_pago,
    "Estado de Pago": p.estado_pago,
    "Monto Abonado (EUR)": p.monto_abonado,
    "Monto Pendiente (EUR)": p.monto_pendiente,
    ...(conBs && {
      "Monto Abonado (Bs)": redondear2(p.monto_abonado * tasaEuro),
      "Monto Pendiente (Bs)": redondear2(p.monto_pendiente * tasaEuro),
    }),
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
    "Monto Abonado (EUR)": totalAbonado,
    "Monto Pendiente (EUR)": totalPendiente,
    ...(conBs && {
      "Monto Abonado (Bs)": redondear2(totalAbonado * tasaEuro),
      "Monto Pendiente (Bs)": redondear2(totalPendiente * tasaEuro),
    }),
  });

  const hoja = XLSX.utils.json_to_sheet(filas);
  hoja["!cols"] = [
    { wch: 26 },
    { wch: 15 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    ...(conBs ? [{ wch: 16 }, { wch: 18 }] : []),
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Pasajeros");

  if (conBs) {
    const hojaTasa = XLSX.utils.aoa_to_sheet([
      ["Tasa BCV (EUR -> Bs)", tasaEuro],
      ["Fecha de exportación", new Date().toISOString().slice(0, 10)],
    ]);
    XLSX.utils.book_append_sheet(libro, hojaTasa, "Tasa BCV");
  }

  const slug =
    destino
      .normalize("NFD")
      .replace(COMBINING_MARKS, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "viaje";

  XLSX.writeFile(libro, `pasajeros-${slug}-${fechaSalida}.xlsx`);
}
