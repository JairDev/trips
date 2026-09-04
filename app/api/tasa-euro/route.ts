import https from "node:https";

// Ejecuta siempre en el servidor (Node), nunca en el edge ni prerenderizado:
// necesitamos el módulo `https` de Node para el workaround de certificado.
export const dynamic = "force-dynamic";

const BCV_URL = "https://www.bcv.org.ve/";
const TTL_MS = 30 * 60 * 1000; // 30 minutos: el BCV publica la tasa 1 vez al día.

let cache: { tasa: number; obtenidoEn: number } | null = null;

/**
 * Descarga el HTML de bcv.org.ve.
 *
 * El sitio del Banco Central de Venezuela sirve desde hace años una cadena de
 * certificados TLS incompleta (falta el intermedio) — es un problema conocido
 * del propio sitio, no de este código. Por eso se desactiva la verificación
 * SOLO para esta petición puntual a un dato público (tasa de cambio); el resto
 * de la app (Supabase, etc.) sigue verificando TLS con normalidad.
 */
function fetchBcvHtml(): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      BCV_URL,
      {
        rejectUnauthorized: false,
        timeout: 10_000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CuposApp/1.0)" },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`El BCV respondió ${res.statusCode}`));
          res.resume();
          return;
        }
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      },
    );
    req.on("timeout", () => req.destroy(new Error("Tiempo de espera agotado")));
    req.on("error", reject);
  });
}

/** Extrae el número dentro de #euro > .strong-tb, ej. "938,44920184" -> 938.4492. */
function extraerTasaEuro(html: string): number | null {
  const inicio = html.indexOf('id="euro"');
  if (inicio === -1) return null;

  const bloque = html.slice(inicio, inicio + 600);
  const match = bloque.match(/class="strong-tb"[^>]*>\s*([\d.,]+)\s*</);
  if (!match) return null;

  // Formato es-VE: "." separador de miles, "," decimal.
  const normalizado = match[1].trim().replace(/\./g, "").replace(",", ".");
  const numero = Number(normalizado);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}

export async function GET() {
  const ahora = Date.now();
  if (cache && ahora - cache.obtenidoEn < TTL_MS) {
    return Response.json({ tasa: cache.tasa, cacheado: true });
  }

  try {
    const html = await fetchBcvHtml();
    const tasa = extraerTasaEuro(html);
    if (tasa === null) {
      throw new Error("No se encontró la tasa EUR en la página del BCV.");
    }
    cache = { tasa, obtenidoEn: ahora };
    return Response.json({ tasa, cacheado: false });
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "Error desconocido.";
    if (cache) {
      // Sirve el último valor conocido aunque esté vencido: mejor una tasa
      // ligeramente vieja que ninguna.
      return Response.json({ tasa: cache.tasa, cacheado: true, advertencia: mensaje });
    }
    return Response.json({ tasa: null, error: mensaje }, { status: 502 });
  }
}
