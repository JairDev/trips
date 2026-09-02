-- =============================================================================
--  Migración 0001 — Precio del paquete + cálculo automático de pagos
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase si ya aplicaste el
--  schema.sql anterior. Es idempotente. (schema.sql ya incluye todo esto
--  para instalaciones nuevas.)
-- =============================================================================

-- 1. Nueva columna: precio del paquete por persona.
alter table public.trips
  add column if not exists precio_por_persona numeric(10, 2) not null default 0;

alter table public.trips drop constraint if exists trips_precio_por_persona_check;
alter table public.trips
  add constraint trips_precio_por_persona_check check (precio_por_persona >= 0);

-- 2. Fija el precio de tu viaje (AJUSTA el valor a tu caso real).
update public.trips set precio_por_persona = 10 where destino = 'Pico Naiguatá';

-- 3. Función + trigger: recalcula monto_pendiente y estado_pago de un pasajero.
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

-- 4. Función + trigger: al cambiar el precio, recalcula todos los pasajeros.
create or replace function public.recalc_pagos_por_viaje()
returns trigger
language plpgsql
as $$
begin
  if new.precio_por_persona is distinct from old.precio_por_persona then
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

-- 5. Recalcula las filas que ya existían (dispara el trigger fila a fila).
update public.passengers set monto_abonado = monto_abonado;

-- 6. Publica `trips` en Realtime (para propagar cambios de precio en vivo).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'trips'
  ) then
    alter publication supabase_realtime add table public.trips;
  end if;
end $$;
alter table public.trips replica identity full;
