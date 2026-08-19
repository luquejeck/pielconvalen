-- =====================================================================
--  Piel con Valen — estructura de la base de datos
--  Pegar todo esto en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. TURNOS
-- ---------------------------------------------------------------------
create table if not exists turnos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null,
  hora        text not null,                     -- "09:00"
  estado      text not null default 'pendiente', -- pendiente | confirmado | bloqueado
  cliente     text,
  telefono    text,
  tratamiento text,
  precio      integer,
  notas       text,
  creado_en   timestamptz not null default now(),

  constraint estado_valido check (estado in ('pendiente', 'confirmado', 'bloqueado')),
  -- Dos personas no pueden tomar el mismo horario. La base lo impide.
  constraint turno_unico unique (fecha, hora)
);

create index if not exists turnos_fecha_idx on turnos (fecha);

-- ---------------------------------------------------------------------
-- 2. DIAS CERRADOS (vacaciones, feriados, licencias)
-- ---------------------------------------------------------------------
create table if not exists dias_cerrados (
  fecha  date primary key,
  motivo text
);

-- ---------------------------------------------------------------------
-- 3. VISTA PUBLICA
--    La web publica solo necesita saber QUE horarios estan tomados.
--    Nunca ve nombres ni telefonos: esta vista expone fecha y hora y nada mas.
-- ---------------------------------------------------------------------
create or replace view turnos_publicos
with (security_invoker = off) as
  select fecha, hora from turnos;

-- ---------------------------------------------------------------------
-- 4. SEGURIDAD (Row Level Security)
--    Por defecto NADIE puede leer ni escribir. Abrimos solo lo justo.
-- ---------------------------------------------------------------------
alter table turnos enable row level security;
alter table dias_cerrados enable row level security;

-- Cualquiera puede ver que dias estan cerrados
drop policy if exists "dias cerrados son publicos" on dias_cerrados;
create policy "dias cerrados son publicos"
  on dias_cerrados for select
  to anon, authenticated
  using (true);

-- Una visitante puede PEDIR un turno, pero solo en estado 'pendiente'.
-- No puede confirmarlo, ni bloquearlo, ni leer los datos de nadie.
drop policy if exists "visitantes pueden pedir turno" on turnos;
create policy "visitantes pueden pedir turno"
  on turnos for insert
  to anon
  with check (estado = 'pendiente');

-- La administradora (usuaria logueada) hace todo
drop policy if exists "la admin gestiona todo" on turnos;
create policy "la admin gestiona todo"
  on turnos for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "la admin gestiona los dias cerrados" on dias_cerrados;
create policy "la admin gestiona los dias cerrados"
  on dias_cerrados for all
  to authenticated
  using (true)
  with check (true);

-- La vista publica se lee sin login
grant select on turnos_publicos to anon, authenticated;

-- =====================================================================
--  LISTO.
--  Falta crear la usuaria de Valen:
--  Supabase → Authentication → Users → Add user
--  (email + contraseña, marcando "Auto Confirm User")
-- =====================================================================
