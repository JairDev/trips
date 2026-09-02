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
| `supabase/schema.sql` | Tablas `trips` / `passengers`, constraints, índices, publicación Realtime y RLS de prueba. Crea un viaje vacío, sin pasajeros. |
| `supabase/seed.sql` | Datos de ejemplo opcionales para una demo. |
| `utils/supabase/client.ts` | Cliente singleton del navegador. |
| `lib/api.ts` | `fetchViajeActivo`, `fetchPasajeros`, `insertPasajero`. |
| `lib/zonas.ts` | `agruparPorZona()` — conteo por zona de recogida (función pura). |
| `lib/export-excel.ts` | Reporte `.xlsx` en cliente con SheetJS (carga diferida). |
| `app/page.tsx` | Dashboard: carga inicial, suscripción Realtime, alta con validación de cupos. |
| `components/*` | Header sticky de cupos, formulario exprés, panel de zonas, lista maestra, FAB. |

## Fases (según `docs/desarrollo-mvp-claude-v2.md`)

- **Fase 1** — Esquema Supabase + UI mobile-first. ✅
- **Fase 2** — Conexión Supabase, inserción validada y sincronización Realtime. ✅
- **Fase 3** — Agrupación por zonas + exportación local a Excel. ✅

## Antes de producción

Las políticas RLS actuales permiten lectura/escritura pública (anónima) para
probar rápido en campo. Endurecerlas con autenticación por coordinador —
ver notas al final de `supabase/schema.sql`.
