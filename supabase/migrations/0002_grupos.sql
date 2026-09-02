-- =============================================================================
--  Migración 0002 — Renombra los grupos aliados
--
--  Grupo 1 -> Brújula mochilera
--  Grupo 2 -> Senderos del alma
--  Grupo 3 -> Destino 100% activo
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase. Idempotente.
--  (schema.sql ya trae la restricción nueva para instalaciones nuevas.)
-- =============================================================================

-- 1. Migra los datos existentes (si los hay).
update public.passengers set grupo_origen = 'Brújula mochilera'   where grupo_origen = 'Grupo 1';
update public.passengers set grupo_origen = 'Senderos del alma'   where grupo_origen = 'Grupo 2';
update public.passengers set grupo_origen = 'Destino 100% activo' where grupo_origen = 'Grupo 3';

-- 2. Reemplaza la restricción de dominio.
alter table public.passengers drop constraint if exists passengers_grupo_origen_check;
alter table public.passengers
  add constraint passengers_grupo_origen_check
  check (grupo_origen in (
    'Brújula mochilera',
    'Senderos del alma',
    'Destino 100% activo'
  ));
