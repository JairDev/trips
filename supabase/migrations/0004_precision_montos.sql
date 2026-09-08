-- =============================================================================
--  Migración 0004 — Precisión de los montos convertidos desde bolívares
--
--  Problema: los montos que se cargan en Bs (Pago Móvil, gastos) se guardan
--  convertidos a euros. Con 2 decimales, a la tasa BCV (~950) el número en
--  bolívares no vuelve exacto: "300 Bs" -> "0,32 €" -> "303,14 Bs".
--
--  Solución: guardar los euros con 6 decimales.
--
--  Ejecútala UNA VEZ en el SQL Editor de Supabase. Idempotente.
--  (schema.sql ya trae esto para instalaciones nuevas.)
--
--  Nota: las filas creadas ANTES de esta migración conservan su redondeo a
--  2 decimales; si necesitas exactitud en ellas, vuelve a registrarlas.
-- =============================================================================

-- El trigger nombra `monto_abonado` en su definición (update of ...), así que
-- hay que soltarlo antes de cambiar el tipo de la columna.
drop trigger if exists trg_recalc_pago on public.passengers;

alter table public.passengers
  alter column monto_abonado   type numeric(14, 6),
  alter column monto_pendiente type numeric(14, 6);

alter table public.gastos
  alter column monto type numeric(14, 6);

-- Trigger de recálculo con 6 decimales y tolerancia de 1 céntimo para "Completo".
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

  new.monto_abonado := round(greatest(0, coalesce(new.monto_abonado, 0)), 6);

  if new.monto_abonado <= 0 then
    new.estado_pago     := 'Pendiente';
    new.monto_pendiente := round(precio, 6);
  elsif precio > 0 and round(new.monto_abonado, 2) >= precio then
    new.estado_pago     := 'Completo';
    new.monto_pendiente := 0;
  else
    new.estado_pago     := 'Abonado';
    new.monto_pendiente := round(greatest(0, precio - new.monto_abonado), 6);
  end if;

  return new;
end;
$$;

create trigger trg_recalc_pago
  before insert or update of monto_abonado, id_viaje on public.passengers
  for each row execute function public.recalc_pago_pasajero();

-- Reaplica el recálculo a los pasajeros existentes.
update public.passengers set monto_abonado = monto_abonado;
