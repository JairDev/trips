-- =============================================================================
--  Migración 0003 — Gastos operativos del viaje
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase. Idempotente.
--  (schema.sql ya incluye todo esto para instalaciones nuevas.)
-- =============================================================================

-- 1. Tabla de gastos.
create table if not exists public.gastos (
  id_gasto   uuid primary key default gen_random_uuid(),
  id_viaje   uuid not null
               references public.trips (id_viaje)
               on delete cascade,
  concepto   text not null,
  monto      numeric(10, 2) not null default 0 check (monto >= 0),
  created_at timestamptz not null default now()
);

comment on table public.gastos is 'Gastos operativos del viaje. Monto siempre en euros, igual que passengers.';

create index if not exists gastos_id_viaje_idx on public.gastos (id_viaje);

-- 2. Realtime.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'gastos'
  ) then
    alter publication supabase_realtime add table public.gastos;
  end if;
end $$;
alter table public.gastos replica identity full;

-- 3. RLS (mismas políticas públicas de prueba que trips/passengers).
alter table public.gastos enable row level security;

drop policy if exists "MVP: lectura pública de gastos" on public.gastos;
create policy "MVP: lectura pública de gastos"
  on public.gastos for select
  to anon, authenticated
  using (true);

drop policy if exists "MVP: escritura pública de gastos" on public.gastos;
create policy "MVP: escritura pública de gastos"
  on public.gastos for all
  to anon, authenticated
  using (true)
  with check (true);
