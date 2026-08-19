-- =====================================================================
--  Piel con Valen — parte 2: catálogo editable
--
--  Mueve los tratamientos y la configuración de la agenda del código
--  a la base, para que Valen los edite desde el panel sin programar.
--
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

-- ---------------------------------------------------------------------
-- TRATAMIENTOS
-- ---------------------------------------------------------------------
create table if not exists tratamientos (
  id           text primary key,
  nombre       text not null,
  nombre_corto text not null,
  precio       integer not null,
  duracion     text not null default '1.5 a 2 horas',
  -- lo que suma por encima de los pasos base
  extras       text[] not null default '{}',
  destacado    boolean not null default false,
  orden        integer not null default 0,
  activo       boolean not null default true
);

-- ---------------------------------------------------------------------
-- AGENDA (una sola fila: la configuración del consultorio)
-- ---------------------------------------------------------------------
create table if not exists agenda (
  id                 integer primary key default 1,
  -- 0 = domingo ... 6 = sabado
  dias_habiles       integer[] not null default '{1,2,3,4,5,6}',
  horarios           text[]    not null default '{08:00,10:00,12:00,14:00,16:00,18:00}',
  anticipacion_horas integer   not null default 24,
  ventana_dias       integer   not null default 60,
  -- los pasos que incluyen todos los tratamientos
  pasos_base         text[]    not null default '{}',
  constraint agenda_fila_unica check (id = 1)
);

-- ---------------------------------------------------------------------
-- CARGA INICIAL (lo que hoy esta en el codigo)
-- ---------------------------------------------------------------------
insert into tratamientos (id, nombre, nombre_corto, precio, extras, destacado, orden)
values
  ('hfp',              'Higiene Facial Profunda',          'Higiene Facial',   34000, '{}',                                        false, 1),
  ('hfp-acidos',       'Higiene Facial con Ácidos',        'Con Ácidos',       37000, '{Ácidos}',                                  false, 2),
  ('hf-dermaplaning',  'Higiene Facial con Dermaplaning',  'Con Dermaplaning', 39500, '{Dermaplaning,Ácidos}',                     false, 3),
  ('hf-microneedling', 'Higiene Facial con Microneedling', 'Con Microneedling',42000, '{Ácidos,Microneedling}',                    false, 4),
  ('full-glow',        'Full Glow',                        'Full Glow',        47000, '{Dermaplaning,Ácidos,Microneedling}',       true,  5)
on conflict (id) do nothing;

insert into agenda (id, dias_habiles, horarios, anticipacion_horas, ventana_dias, pasos_base)
values (
  1,
  '{1,2,3,4,5,6}',
  '{08:00,10:00,12:00,14:00,16:00,18:00}',
  24,
  60,
  '{"Preparación de la piel","Exfoliación mecánica","Máscara de ácidos o enzimática","Extracciones","Descongestión y alta frecuencia","Hidratación","Protector solar"}'
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- SEGURIDAD
-- Cualquiera puede LEER (la web publica los muestra).
-- Solo la admin logueada puede modificar.
-- ---------------------------------------------------------------------
alter table tratamientos enable row level security;
alter table agenda enable row level security;

drop policy if exists "tratamientos son publicos" on tratamientos;
create policy "tratamientos son publicos"
  on tratamientos for select
  to anon, authenticated
  using (true);

drop policy if exists "la admin edita tratamientos" on tratamientos;
create policy "la admin edita tratamientos"
  on tratamientos for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "la agenda es publica" on agenda;
create policy "la agenda es publica"
  on agenda for select
  to anon, authenticated
  using (true);

drop policy if exists "la admin edita la agenda" on agenda;
create policy "la admin edita la agenda"
  on agenda for all
  to authenticated
  using (true)
  with check (true);
