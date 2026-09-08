# Supabase — Backend del MVP

## 1. Aplicar el esquema

1. Entra a tu proyecto en <https://supabase.com/dashboard>.
2. `SQL Editor` → `New query`.
3. Pega el contenido completo de [`schema.sql`](./schema.sql) y pulsa **Run**.

> **¿Ya habías aplicado una versión anterior del `schema.sql`?**
> Ejecuta también, una vez cada una:
> - [`migrations/0001_precio_paquete.sql`](./migrations/0001_precio_paquete.sql) — añade `trips.precio_por_persona` y los triggers que calculan `monto_pendiente` / `estado_pago` automáticamente. Ajusta el precio dentro del script.
> - [`migrations/0002_grupos.sql`](./migrations/0002_grupos.sql) — renombra los grupos aliados.
> - [`migrations/0003_gastos.sql`](./migrations/0003_gastos.sql) — crea la tabla `gastos` (transporte, snacks, etc.).
> - [`migrations/0004_precision_montos.sql`](./migrations/0004_precision_montos.sql) — sube a 6 decimales los montos en euros para que la conversión a bolívares vuelva exacta.
> - [`migrations/0005_tasa_bcv.sql`](./migrations/0005_tasa_bcv.sql) — crea la tabla `tasa_bcv` que llena el cron diario de GitHub Actions.
> - [`migrations/0006_puestos_cero.sql`](./migrations/0006_puestos_cero.sql) — permite `puestos_totales = 0` (el botón "nuevo viaje" deja el viaje en blanco).

Esto crea:

| Objeto | Descripción |
| --- | --- |
| `public.trips` | Salidas de senderismo (destino, fecha, `puestos_totales`, `precio_por_persona`). |
| `public.passengers` | Excursionistas inscritos, con constraints de dominio (`grupo_origen`, `metodo_pago`, `estado_pago`) y montos. |
| `public.gastos` | Gastos operativos del viaje (transporte, snacks, peajes...). Monto siempre en euros. |
| Índices | Por `id_viaje`, por zona de recogida y unicidad de nombre por viaje (evita duplicados). |
| Publicación `supabase_realtime` | `passengers`, `trips` y `gastos` emiten `INSERT/UPDATE/DELETE` en tiempo real. |
| RLS | Políticas **públicas de prueba** (lectura + escritura para `anon`) en las tres tablas. Endurecer antes de producción — ver notas al final de `schema.sql`. |

El script es **idempotente**. Crea **un viaje vacío** (`Pico Naiguatá`) para que
la app tenga contexto al arrancar, pero **no inserta pasajeros**: la lista arranca
vacía para tus pruebas.

### Datos de ejemplo (opcional)

Si quieres poblar la lista para una demo, ejecuta [`seed.sql`](./seed.sql) aparte.
Para volver a vaciarla:

```sql
delete from public.passengers
where id_viaje = (select id_viaje from public.trips
                  where destino = 'Pico Naiguatá' limit 1);
```

## 2. Verificar Realtime

`Database` → `Publications` → `supabase_realtime` debe listar las tablas `passengers`,
`trips` y `gastos` con los eventos Insert / Update / Delete activados.

## 3. Credenciales para el frontend (Fase 2)

`Project Settings` → `API`:

```bash
# .env.local (en la raíz del proyecto Next.js — NO se commitea)
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
