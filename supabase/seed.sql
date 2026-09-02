-- =============================================================================
--  SEED OPCIONAL — datos de ejemplo para una demo del viaje "Pico Naiguatá".
--
--  NO es necesario para usar la app. Ejecútalo en el SQL Editor solo si
--  quieres poblar la lista con pasajeros de muestra.
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
  select 1 from public.passengers p where p.id_viaje = v.id_viaje
);
