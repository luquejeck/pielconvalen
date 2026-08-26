-- =====================================================================
--  Piel con Valen — tanda 2 del control
--  "Que el panel deje de hacerle cargar todo tres veces"
--
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  Hasta ahora un turno atendido eran TRES cargas a mano: aceptarlo en
--  Turnos, volver a escribirlo como ingreso en Economía, y volver a
--  escribirlo como sesión en la ficha de la clienta. Los datos para
--  hacerlo solo ya estaban todos en la tabla `turnos`; lo que faltaba
--  era esto.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ESTADOS QUE FALTABAN
--
--    Con solo pendiente/confirmado/bloqueado no habia forma de saber si
--    un turno confirmado efectivamente paso, ni de distinguir a la que
--    aviso de la que no aparecio. Sin eso no se puede medir ausentismo
--    ni saber que se facturo de verdad.
-- ---------------------------------------------------------------------
alter table turnos drop constraint if exists estado_valido;
alter table turnos add constraint estado_valido
  check (estado in ('pendiente', 'confirmado', 'bloqueado', 'realizado', 'no_vino'));


-- ---------------------------------------------------------------------
-- 2. EL TURNO SE ACUERDA DE LO QUE GENERO
--
--    Sin esto, tocar dos veces "Atendida y cobrada" cargaba el ingreso
--    dos veces. Guardando que movimiento y que sesion salieron de este
--    turno, el cobro es idempotente y ademas se puede deshacer entero.
-- ---------------------------------------------------------------------
alter table turnos
  add column if not exists movimiento_id uuid references movimientos(id) on delete set null;

alter table turnos
  add column if not exists sesion_id uuid references sesiones(id) on delete set null;


-- ---------------------------------------------------------------------
-- 3. MEDIO DE PAGO
--
--    La web promete tres formas de pago —efectivo, transferencia y
--    Mercado Pago— y el panel no registraba ninguna. Sin ese dato no se
--    puede cuadrar la caja contra lo que entro al banco.
-- ---------------------------------------------------------------------
alter table movimientos
  add column if not exists medio_pago text;


-- ---------------------------------------------------------------------
-- 4. GASTOS FIJOS
--
--    El alquiler del gabinete se cargaba a mano todos los meses. Se
--    declaran una vez y despues se vuelcan al mes con un boton.
-- ---------------------------------------------------------------------
create table if not exists gastos_fijos (
  id          uuid primary key default gen_random_uuid(),
  descripcion text not null,
  categoria   text not null default 'Gastos fijos',
  monto       integer not null,
  -- Que dia del mes vence, para que la fecha del movimiento tenga sentido
  dia_del_mes integer not null default 1 check (dia_del_mes between 1 and 28),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

alter table gastos_fijos enable row level security;

drop policy if exists "gastos fijos: solo autenticada" on gastos_fijos;
create policy "gastos fijos: solo autenticada"
  on gastos_fijos for all to authenticated using (true) with check (true);

-- Marca de que gasto fijo salio cada movimiento, para no volcarlo dos veces
alter table movimientos
  add column if not exists gasto_fijo_id uuid references gastos_fijos(id) on delete set null;

-- El casteo a `timestamp` no es adorno: sin el, Postgres resuelve
-- date_trunc contra `timestamptz`, que depende de la zona horaria de la
-- sesion y por lo tanto no es IMMUTABLE. Un indice no puede depender de
-- algo que cambia segun quien mire, asi que lo rechaza con
-- "functions in index expression must be marked IMMUTABLE".
create unique index if not exists movimientos_gasto_fijo_mes_idx
  on movimientos (gasto_fijo_id, (date_trunc('month', fecha::timestamp)))
  where gasto_fijo_id is not null;


-- ---------------------------------------------------------------------
-- 5. LOS PEDIDOS SIN RESPONDER SE VENCEN SOLOS
--
--    Una clienta tocaba "confirmar", nunca mandaba el mensaje, y ese
--    horario quedaba tomado como "pendiente" PARA SIEMPRE. Nadie mas lo
--    podia reservar y Valen no lo veia salvo que navegara a ese dia
--    exacto.
--
--    La vista que alimenta la web ahora ignora los pendientes de mas de
--    24 horas: el horario se libera solo, sin tarea programada y sin que
--    nadie tenga que acordarse. En el panel se siguen viendo, para que
--    Valen sepa que paso.
-- ---------------------------------------------------------------------
create or replace view turnos_publicos
with (security_invoker = off) as
  select fecha, hora
    from turnos
   where estado <> 'pendiente'
      or creado_en > now() - interval '24 hours';

grant select on turnos_publicos to anon, authenticated;


-- ---------------------------------------------------------------------
-- 6. ATENDIDA Y COBRADA, EN UNA SOLA OPERACION
--
--    Marca el turno como realizado, carga el ingreso en Economia y —si
--    el turno esta vinculado a una clienta— le agrega la sesion a su
--    ficha. Las tres cosas juntas o ninguna: si algo falla, no queda un
--    ingreso cargado y un turno sin marcar.
-- ---------------------------------------------------------------------
create or replace function registrar_turno_realizado(
  p_turno_id   uuid,
  p_monto      integer,
  p_medio_pago text default null,
  p_notas      text default null
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_turno  turnos%rowtype;
  v_mov_id uuid;
  v_ses_id uuid;
begin
  select * into v_turno from turnos where id = p_turno_id for update;

  if not found then
    raise exception 'Ese turno ya no existe.' using errcode = 'P0002';
  end if;

  if v_turno.movimiento_id is not null then
    raise exception 'Ese turno ya estaba cobrado.' using errcode = 'P0001';
  end if;

  insert into movimientos (fecha, tipo, categoria, descripcion, monto, medio_pago, cliente_id)
  values (
    v_turno.fecha,
    'ingreso',
    coalesce(v_turno.tratamiento, 'Tratamiento'),
    trim(both ' · ' from
      coalesce(v_turno.cliente, '') || ' · ' || coalesce(v_turno.tratamiento, 'Turno')),
    p_monto,
    p_medio_pago,
    v_turno.cliente_id
  )
  returning id into v_mov_id;

  -- La sesion solo se puede cargar si el turno tiene clienta vinculada.
  if v_turno.cliente_id is not null then
    insert into sesiones (cliente_id, fecha, tratamiento, precio, notas)
    values (
      v_turno.cliente_id,
      v_turno.fecha,
      coalesce(v_turno.tratamiento, 'Tratamiento'),
      p_monto,
      p_notas
    )
    returning id into v_ses_id;
  end if;

  update turnos
     set estado = 'realizado',
         movimiento_id = v_mov_id,
         sesion_id = v_ses_id
   where id = p_turno_id;

  return v_mov_id;
end;
$$;

revoke all on function registrar_turno_realizado(uuid, integer, text, text) from public, anon;
grant execute on function registrar_turno_realizado(uuid, integer, text, text) to authenticated;


-- ---------------------------------------------------------------------
-- 7. DESHACER EL COBRO
--
--    Con plata de por medio, equivocarse es cuestion de tiempo. Borra el
--    ingreso y la sesion que genero el turno y lo devuelve a confirmado.
-- ---------------------------------------------------------------------
create or replace function anular_turno_realizado(p_turno_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_turno turnos%rowtype;
begin
  select * into v_turno from turnos where id = p_turno_id for update;

  if not found then
    raise exception 'Ese turno ya no existe.' using errcode = 'P0002';
  end if;

  update turnos
     set estado = 'confirmado', movimiento_id = null, sesion_id = null
   where id = p_turno_id;

  if v_turno.movimiento_id is not null then
    delete from movimientos where id = v_turno.movimiento_id;
  end if;

  if v_turno.sesion_id is not null then
    delete from sesiones where id = v_turno.sesion_id;
  end if;
end;
$$;

revoke all on function anular_turno_realizado(uuid) from public, anon;
grant execute on function anular_turno_realizado(uuid) to authenticated;


-- ---------------------------------------------------------------------
-- 8. INDICES DE LO QUE EL PANEL VA A CONSULTAR TODO EL TIEMPO
-- ---------------------------------------------------------------------
create index if not exists turnos_cliente_idx on turnos (cliente_id);
create index if not exists movimientos_cliente_idx on movimientos (cliente_id);


-- =====================================================================
--  LISTO.
-- =====================================================================
