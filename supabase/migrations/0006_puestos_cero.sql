-- =============================================================================
--  Migración 0006 — Permitir puestos_totales = 0
--
--  Al pulsar "nuevo viaje" el destino, los puestos y el precio quedan en
--  blanco (0 / texto guía) para que el coordinador los configure. Para eso
--  `puestos_totales` debe poder ser 0.
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase. Idempotente.
-- =============================================================================

alter table public.trips drop constraint if exists trips_puestos_totales_check;
alter table public.trips
  add constraint trips_puestos_totales_check check (puestos_totales >= 0);
