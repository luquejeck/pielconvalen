-- =====================================================================
--  Piel con Valen — gestión de clientas
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CLIENTAS
-- ---------------------------------------------------------------------
create table if not exists clientes (
  id              uuid primary key default gen_random_uuid(),
  nombre          text not null,
  telefono        text,
  email           text,
  fecha_nacimiento date,
  -- Historial médico libre: alergias, medicamentos, condiciones, etc.
  antecedentes    text,
  notas           text,
  creado_en       timestamptz not null default now()
);

create index if not exists clientes_nombre_idx on clientes (lower(nombre));

-- ---------------------------------------------------------------------
-- 2. HISTORIAL DE SESIONES
-- ---------------------------------------------------------------------
create table if not exists sesiones (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references clientes(id) on delete cascade,
  fecha       date not null default current_date,
  tratamiento text not null,
  precio      integer,
  -- Observaciones de esa sesión: reacción, producto usado, seguimiento
  notas       text,
  creado_en   timestamptz not null default now()
);

create index if not exists sesiones_cliente_idx on sesiones (cliente_id);
create index if not exists sesiones_fecha_idx on sesiones (fecha desc);

-- ---------------------------------------------------------------------
-- 3. SEGURIDAD (solo Valen, autenticada)
-- ---------------------------------------------------------------------
alter table clientes enable row level security;
alter table sesiones enable row level security;

drop policy if exists "clientes: solo autenticada" on clientes;
create policy "clientes: solo autenticada"
  on clientes for all to authenticated using (true) with check (true);

drop policy if exists "sesiones: solo autenticada" on sesiones;
create policy "sesiones: solo autenticada"
  on sesiones for all to authenticated using (true) with check (true);
