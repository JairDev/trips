# Supabase — Backend del MVP

## 1. Aplicar el esquema

1. Entra a tu proyecto en <https://supabase.com/dashboard>.
2. `SQL Editor` → `New query`.
3. Pega el contenido completo de [`schema.sql`](./schema.sql) y pulsa **Run**.

Esto crea:

| Objeto | Descripción |
| --- | --- |
| `public.trips` | Salidas de senderismo (destino, fecha, `puestos_totales`). |
| `public.passengers` | Excursionistas inscritos, con constraints de dominio (`grupo_origen`, `metodo_pago`, `estado_pago`) y montos. |
| Índices | Por `id_viaje`, por zona de recogida y unicidad de nombre por viaje (evita duplicados). |
| Publicación `supabase_realtime` | La tabla `passengers` queda emitiendo `INSERT/UPDATE/DELETE` en tiempo real. |
| RLS | Políticas **públicas de prueba** (lectura + escritura para `anon`). Endurecer antes de producción — ver notas al final de `schema.sql`. |

El script es **idempotente** y trae un *seed* del viaje `Pico Naiguatá` con 5 pasajeros de ejemplo.

## 2. Verificar Realtime

`Database` → `Publications` → `supabase_realtime` debe listar la tabla `passengers`
con los eventos Insert / Update / Delete activados.

## 3. Credenciales para el frontend (Fase 2)

`Project Settings` → `API`:

```bash
# .env.local (en la raíz del proyecto Next.js — NO se commitea)
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
