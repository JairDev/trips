-- =============================================================================
--  SEED OPCIONAL — datos de ejemplo para una demo del viaje "Pico Naiguatá".
--
--  NO es necesario para usar la app. Ejecútalo en el SQL Editor solo si
--  quieres poblar la lista con pasajeros de muestra.
--
--  Solo se define `monto_abonado`; `monto_pendiente` y `estado_pago` los
--  calcula el trigger a partir de trips.precio_por_persona.
--
--  Para VACIAR la lista después:
--      delete from public.passengers
--      where id_viaje = (select id_viaje from public.trips
--                        where destino = 'Pico Naiguatá' limit 1);
-- =============================================================================

with viaje as (
  select id_viaje from public.trips where destino = 'Pico Naiguatá' limit 1
)
insert into public.passengers
  (id_viaje, nombre_completo, grupo_origen, zona_recogida, metodo_pago, monto_abonado)
select v.id_viaje, d.nombre_completo, d.grupo_origen, d.zona_recogida,
       d.metodo_pago, d.monto_abonado
from viaje v
cross join (values
  ('Ana Pérez',       'Grupo 1', 'Santa Rosa',        'Pago Móvil', 10),  -- Completo
  ('Luis Gómez',      'Grupo 2', 'El Cafetal',        'Efectivo',    5),  -- Abonado
  ('María Rodríguez', 'Grupo 1', 'Santa Rosa',        'Pago Móvil',  0),  -- Pendiente
  ('Carlos Díaz',     'Grupo 3', 'Chacao',            'Efectivo',   10),  -- Completo
  ('Elena Torres',    'Grupo 2', 'El Cafetal',        'Pago Móvil',  3)   -- Abonado
) as d(nombre_completo, grupo_origen, zona_recogida, metodo_pago, monto_abonado)
where not exists (
  select 1 from public.passengers p where p.id_viaje = v.id_viaje
);
