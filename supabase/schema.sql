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
  destino            text        not null,
  fecha_salida       date        not null,
  puestos_totales    integer     not null check (puestos_totales > 0),
  precio_por_persona numeric(10, 2) not null default 0
                       check (precio_por_persona >= 0),
  created_at         timestamptz not null default now()
);

comment on table  public.trips is 'Salidas de senderismo organizadas por los 3 grupos aliados.';
comment on column public.trips.puestos_totales is 'Capacidad máxima de asientos de la unidad de transporte contratada.';
comment on column public.trips.precio_por_persona is 'Precio del paquete por excursionista. De aquí sale el monto pendiente de cada pasajero.';

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
comment on column public.passengers.monto_abonado is 'Único monto que introduce el coordinador. El resto se calcula.';
comment on column public.passengers.monto_pendiente is 'Calculado automáticamente por trigger: precio_por_persona del viaje − monto_abonado.';
comment on column public.passengers.estado_pago is 'Calculado automáticamente por trigger a partir de los montos.';

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
--  CÁLCULO AUTOMÁTICO DE PAGOS
--
--  El coordinador solo introduce `monto_abonado`. La base de datos deriva:
--    monto_pendiente = max(0, trips.precio_por_persona - monto_abonado)
--    estado_pago     = Pendiente | Abonado | Completo
--
--  Fuente de verdad en el servidor: así todos los coordinadores (y el Excel)
--  ven siempre lo mismo, aunque cambie el precio del paquete.
-- =============================================================================

-- Recalcula una fila de passengers a partir del precio de su viaje.
create or replace function public.recalc_pago_pasajero()
returns trigger
language plpgsql
as $$
declare
  precio numeric(10, 2);
begin
  select t.precio_por_persona into precio
  from public.trips t
  where t.id_viaje = new.id_viaje;

  precio := coalesce(precio, 0);

  new.monto_abonado   := round(greatest(0, coalesce(new.monto_abonado, 0)), 2);
  new.monto_pendiente := round(greatest(0, precio - new.monto_abonado), 2);

  if new.monto_abonado <= 0 then
    new.estado_pago := 'Pendiente';
  elsif precio > 0 and new.monto_abonado >= precio then
    new.estado_pago := 'Completo';
  else
    new.estado_pago := 'Abonado';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_recalc_pago on public.passengers;
create trigger trg_recalc_pago
  before insert or update of monto_abonado, id_viaje on public.passengers
  for each row execute function public.recalc_pago_pasajero();

-- Al cambiar el precio del paquete, recalcula todos los pasajeros del viaje.
create or replace function public.recalc_pagos_por_viaje()
returns trigger
language plpgsql
as $$
begin
  if new.precio_por_persona is distinct from old.precio_por_persona then
    -- Nombrar monto_abonado en el SET dispara trg_recalc_pago en cada fila.
    update public.passengers
    set monto_abonado = monto_abonado
    where id_viaje = new.id_viaje;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recalc_pagos_viaje on public.trips;
create trigger trg_recalc_pagos_viaje
  after update of precio_por_persona on public.trips
  for each row execute function public.recalc_pagos_por_viaje();


-- =============================================================================
--  TIEMPO REAL  (Supabase Realtime)
--
--  Para que los coordinadores en campo vean los cambios al instante sin
--  refrescar, la tabla `passengers` debe:
--    a) estar añadida a la publicación `supabase_realtime`
--    b) emitir la fila COMPLETA en UPDATE/DELETE (REPLICA IDENTITY FULL),
--       necesario para que el cliente pueda reconciliar su estado local.
--
--  Se publican `passengers` (altas/pagos) y `trips` (precio del paquete, para
--  que el cambio de precio y el recálculo lleguen a todos al instante).
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'passengers'
  ) then
    alter publication supabase_realtime add table public.passengers;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
end $$;

-- Emitir la fila completa en cambios (por defecto solo emite la PK).
alter table public.passengers replica identity full;
alter table public.trips      replica identity full;


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
--  Solo crea UN viaje vacío para que la app tenga contexto al arrancar
--  (sin él, el dashboard muestra la pantalla "No hay viajes").
--  NO inserta pasajeros: la lista arranca vacía para tus pruebas.
--
--  ¿Quieres datos de ejemplo para una demo? Ejecuta supabase/seed.sql aparte.
-- =============================================================================

insert into public.trips (destino, fecha_salida, puestos_totales, precio_por_persona)
select 'Pico Naiguatá', current_date + 14, 40, 10
where not exists (
  select 1 from public.trips where destino = 'Pico Naiguatá'
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
