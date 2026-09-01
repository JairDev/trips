-- =============================================================================
--  MVP Senderismo — Esquema relacional para Supabase (PostgreSQL)
--  Fase 1 · Prompt 1
--
--  Cómo usar:
--    1. Abre tu proyecto en https://supabase.com/dashboard
--    2. Ve a  SQL Editor  ->  New query
--    3. Pega este archivo COMPLETO y pulsa  Run
--
--  El script es idempotente: se puede volver a ejecutar sin romper nada.
-- =============================================================================

-- Extensión para generar UUIDs (viene activa por defecto en Supabase, se deja
-- explícito por si el proyecto es muy nuevo o se restauró un backup).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
--  Tabla: trips  (Viajes / Salidas)
-- -----------------------------------------------------------------------------
create table if not exists public.trips (
  id_viaje        uuid primary key default gen_random_uuid(),
  destino         text        not null,
  fecha_salida    date        not null,
  puestos_totales integer     not null check (puestos_totales > 0),
  created_at      timestamptz not null default now()
);

comment on table  public.trips is 'Salidas de senderismo organizadas por los 3 grupos aliados.';
comment on column public.trips.puestos_totales is 'Capacidad máxima de asientos de la unidad de transporte contratada.';

-- -----------------------------------------------------------------------------
--  Tabla: passengers  (Viajeros / Pasajeros)
-- -----------------------------------------------------------------------------
create table if not exists public.passengers (
  id_viajero      uuid primary key default gen_random_uuid(),
  id_viaje        uuid not null
                    references public.trips (id_viaje)
                    on delete cascade,
  nombre_completo text not null,
  grupo_origen    text not null
                    check (grupo_origen in ('Grupo 1', 'Grupo 2', 'Grupo 3')),
  zona_recogida   text not null,
  metodo_pago     text not null
                    check (metodo_pago in ('Pago Móvil', 'Efectivo')),
  estado_pago     text not null default 'Pendiente'
                    check (estado_pago in ('Pendiente', 'Abonado', 'Completo')),
  monto_abonado   numeric(10, 2) not null default 0 check (monto_abonado   >= 0),
  monto_pendiente numeric(10, 2) not null default 0 check (monto_pendiente >= 0),
  created_at      timestamptz not null default now()
);

comment on table public.passengers is 'Excursionistas inscritos en cada salida. Base común para los 3 grupos.';

-- Índice para acelerar el fetch por viaje y el conteo de cupos.
create index if not exists passengers_id_viaje_idx
  on public.passengers (id_viaje);

-- Índice para el "Control de Zonas" (agrupación por zona de recogida).
create index if not exists passengers_zona_recogida_idx
  on public.passengers (id_viaje, zona_recogida);

-- Evita duplicar el mismo nombre dentro de un mismo viaje (problema de origen:
-- duplicidad de nombres en los cupos). Case-insensitive y sin espacios extra.
create unique index if not exists passengers_viaje_nombre_uniq
  on public.passengers (id_viaje, lower(btrim(nombre_completo)));


-- =============================================================================
--  TIEMPO REAL  (Supabase Realtime)
--
--  Para que los coordinadores en campo vean los cambios al instante sin
--  refrescar, la tabla `passengers` debe:
--    a) estar añadida a la publicación `supabase_realtime`
--    b) emitir la fila COMPLETA en UPDATE/DELETE (REPLICA IDENTITY FULL),
--       necesario para que el cliente pueda reconciliar su estado local.
-- =============================================================================

-- (a) Añadir la tabla a la publicación de Realtime (idempotente).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'passengers'
  ) then
    alter publication supabase_realtime add table public.passengers;
  end if;
end $$;

-- (b) Emitir la fila completa en cambios (por defecto solo emite la PK).
alter table public.passengers replica identity full;

-- Opcional: también publicar `trips` por si en el futuro se edita la capacidad
-- del autobús en vivo. Descomenta si lo necesitas.
-- do $$
-- begin
--   if not exists (
--     select 1 from pg_publication_tables
--     where pubname = 'supabase_realtime'
--       and schemaname = 'public' and tablename = 'trips'
--   ) then
--     alter publication supabase_realtime add table public.trips;
--   end if;
-- end $$;
-- alter table public.trips replica identity full;


-- =============================================================================
--  ROW LEVEL SECURITY (RLS)
--
--  ⚠️  POLÍTICAS DE PRUEBA PARA EL MVP EN CAMPO.
--  Permiten lectura y escritura PÚBLICA (rol anónimo) para poder probar rápido
--  con los coordinadores sin montar autenticación todavía.
--
--  ANTES DE PRODUCCIÓN: reemplazar por políticas basadas en `auth.uid()` /
--  pertenencia a grupo. Ver notas al final del archivo.
-- =============================================================================

alter table public.trips      enable row level security;
alter table public.passengers enable row level security;

-- --- trips -------------------------------------------------------------------
drop policy if exists "MVP: lectura pública de viajes"  on public.trips;
create policy "MVP: lectura pública de viajes"
  on public.trips for select
  to anon, authenticated
  using (true);

drop policy if exists "MVP: escritura pública de viajes" on public.trips;
create policy "MVP: escritura pública de viajes"
  on public.trips for all
  to anon, authenticated
  using (true)
  with check (true);

-- --- passengers ------------------------------------------------------------
drop policy if exists "MVP: lectura pública de pasajeros"  on public.passengers;
create policy "MVP: lectura pública de pasajeros"
  on public.passengers for select
  to anon, authenticated
  using (true);

drop policy if exists "MVP: escritura pública de pasajeros" on public.passengers;
create policy "MVP: escritura pública de pasajeros"
  on public.passengers for all
  to anon, authenticated
  using (true)
  with check (true);


-- =============================================================================
--  SEED — datos de ejemplo para el viaje "Pico Naiguatá"
--  (útil para maquetar la UI de la Fase 1; borrar cuando haya datos reales)
-- =============================================================================

insert into public.trips (destino, fecha_salida, puestos_totales)
select 'Pico Naiguatá', current_date + 14, 40
where not exists (
  select 1 from public.trips where destino = 'Pico Naiguatá'
);

with viaje as (
  select id_viaje from public.trips where destino = 'Pico Naiguatá' limit 1
)
insert into public.passengers
  (id_viaje, nombre_completo, grupo_origen, zona_recogida,
   metodo_pago, estado_pago, monto_abonado, monto_pendiente)
select v.id_viaje, d.nombre_completo, d.grupo_origen, d.zona_recogida,
       d.metodo_pago, d.estado_pago, d.monto_abonado, d.monto_pendiente
from viaje v
cross join (values
  ('Ana Pérez',        'Grupo 1', 'Santa Rosa', 'Pago Móvil', 'Completo',  25, 0),
  ('Luis Gómez',       'Grupo 2', 'El Cafetal', 'Efectivo',   'Abonado',   10, 15),
  ('María Rodríguez',  'Grupo 1', 'Santa Rosa', 'Pago Móvil', 'Pendiente',  0, 25),
  ('Carlos Díaz',      'Grupo 3', 'Chacao',     'Efectivo',   'Completo',   25, 0),
  ('Elena Torres',     'Grupo 2', 'El Cafetal', 'Pago Móvil', 'Abonado',   20, 5)
) as d(nombre_completo, grupo_origen, zona_recogida,
       metodo_pago, estado_pago, monto_abonado, monto_pendiente)
where not exists (
  select 1 from public.passengers p
  where p.id_viaje = v.id_viaje
);


-- =============================================================================
--  NOTAS PARA ENDURECER RLS ANTES DE PRODUCCIÓN
-- -----------------------------------------------------------------------------
--  1. Activar Auth en Supabase y hacer que cada coordinador inicie sesión.
--  2. Tabla `coordinators (user_id uuid, grupo_origen text)` o un claim en JWT.
--  3. Sustituir las políticas "pública" por, por ejemplo:
--
--       create policy "Coordinadores autenticados leen pasajeros"
--         on public.passengers for select
--         to authenticated using (true);
--
--       create policy "Coordinador inserta en su grupo"
--         on public.passengers for insert
--         to authenticated
--         with check (
--           grupo_origen = (auth.jwt() ->> 'grupo_origen')
--         );
--
--  4. Revocar el acceso del rol `anon` por completo.
-- =============================================================================
