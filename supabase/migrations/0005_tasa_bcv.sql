-- =============================================================================
--  Migración 0005 — Tabla de la tasa EUR/Bs del BCV
--
--  Antes: la app raspaba bcv.org.ve en cada carga (ruta /api/tasa-euro).
--  Ahora: un cron diario de GitHub Actions raspa el BCV y guarda el valor
--  aquí; la app solo lee esta fila (una sola: id = 1).
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase. Idempotente.
--  (schema.sql ya trae esto para instalaciones nuevas.)
-- =============================================================================

create table if not exists public.tasa_bcv (
  id          smallint primary key default 1 check (id = 1),
  eur_bs      numeric(18, 8) not null check (eur_bs > 0),
  actualizada timestamptz not null default now()
);

comment on table public.tasa_bcv is 'Tasa EUR->Bs del BCV. Fila única (id=1). La escribe el cron scrape-tasa-bcv.';

-- `actualizada` se refresca sola en cada escritura.
create or replace function public.touch_tasa_bcv()
returns trigger language plpgsql as $$
begin
  new.actualizada := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_tasa_bcv on public.tasa_bcv;
create trigger trg_touch_tasa_bcv
  before insert or update on public.tasa_bcv
  for each row execute function public.touch_tasa_bcv();

alter table public.tasa_bcv enable row level security;

drop policy if exists "MVP: lectura pública de la tasa" on public.tasa_bcv;
create policy "MVP: lectura pública de la tasa"
  on public.tasa_bcv for select
  to anon, authenticated
  using (true);

-- MVP: escritura pública (la usa el cron con la anon key). Al endurecer la RLS,
-- mover esta escritura a la service_role key.
drop policy if exists "MVP: escritura pública de la tasa" on public.tasa_bcv;
create policy "MVP: escritura pública de la tasa"
  on public.tasa_bcv for all
  to anon, authenticated
  using (true)
  with check (true);

-- Valor inicial para que la app funcione antes de la primera corrida del cron.
insert into public.tasa_bcv (id, eur_bs)
values (1, 947.29802151)
on conflict (id) do nothing;
