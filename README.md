# Cupos — Logística de Senderismo (MVP)

Web App **mobile-first** para que los coordinadores de 3 grupos de senderismo
aliados gestionen inscritos, pagos y cupos de autobús en tiempo real, sin las
cadenas de WhatsApp.

## Stack

- **Next.js 16** (App Router) + **React 19** + **Tailwind CSS v4**
- **Supabase** (PostgreSQL + Realtime)
- **SheetJS (`xlsx`)** para exportar a Excel 100 % en el cliente

## Puesta en marcha

```bash
npm install

# 1. Aplica el esquema en Supabase (SQL Editor -> Run)
#    supabase/schema.sql   (ver supabase/README.md)

# 2. Credenciales del proyecto: Dashboard -> Project Settings -> API
cp .env.example .env.local
#    edita NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev        # http://localhost:3000
```

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `supabase/schema.sql` | Tablas `trips` / `passengers` / `gastos` / `tasa_bcv`, constraints, índices, publicación Realtime y RLS de prueba. Crea un viaje vacío, sin pasajeros. |
| `supabase/seed.sql` | Datos de ejemplo opcionales para una demo. |
| `utils/supabase/client.ts` | Cliente singleton del navegador. |
| `.github/workflows/scrape-tasa-bcv.yml` | Cron diario: raspa la tasa EUR/Bs del BCV y la guarda en `tasa_bcv`. |
| `lib/bcv.ts` | `fetchTasaEuro()` — lee la fila `tasa_bcv` (la app ya no raspa el BCV). |
| `lib/api.ts` | Trips/pasajeros/gastos: fetch, insert, actualizar, eliminar. |
| `lib/pagos.ts` | Cálculo de `monto_pendiente` y `estado_pago` a partir del precio del paquete. |
| `lib/zonas.ts` | `agruparPorZona()` — conteo por zona de recogida (función pura). |
| `lib/export-excel.ts` | Reporte `.xlsx` en cliente con SheetJS (carga diferida). |
| `app/page.tsx` | Dashboard: carga inicial, suscripciones Realtime (pasajeros/viaje/gastos), pestañas Pasajeros/Finanzas. Sin rutas server: la app es 100% estática. |
| `components/*` | Header sticky de cupos, ajustes del viaje, formulario de registro, panel de zonas, lista de pasajeros, caja del viaje, gastos operativos, FAB. |

## Fases (según `docs/desarrollo-mvp-claude-v2.md`)

- **Fase 1** — Esquema Supabase + UI mobile-first. ✅
- **Fase 2** — Conexión Supabase, inserción validada y sincronización Realtime. ✅
- **Fase 3** — Agrupación por zonas + exportación local a Excel. ✅

## Crons de GitHub Actions

Dos workflows, ambos usan los mismos secrets del repo
(`Settings → Secrets and variables → Actions → New repository secret`):

| Secret | Valor |
| --- | --- |
| `SUPABASE_URL` | `https://<tu-ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | la anon key (misma pública que usa el frontend) |

| Workflow | Qué hace |
| --- | --- |
| [`keep-supabase-alive.yml`](.github/workflows/keep-supabase-alive.yml) | Consulta mínima diaria → el proyecto gratis no se pausa por inactividad (~7 días). |
| [`scrape-tasa-bcv.yml`](.github/workflows/scrape-tasa-bcv.yml) | Raspa la tasa EUR/Bs del BCV una vez al día y la guarda en `tasa_bcv`. Requiere la migración `0005`. |

Probar cualquiera: pestaña `Actions` → elige el workflow → `Run workflow`.

> GitHub deshabilita los cron de repos sin commits durante 60 días (avisa por
> email para reactivar con un clic).

## Antes de producción

Las políticas RLS actuales permiten lectura/escritura pública (anónima) para
probar rápido en campo. Endurecerlas con autenticación por coordinador —
ver notas al final de `supabase/schema.sql`.
