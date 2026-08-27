-- =====================================================================
--  Piel con Valen — galería de fotos
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  NO toca Storage. El bucket `casos` y sus políticas ya existen de
--  antes y se reusan tal cual: cambiar políticas sobre storage.objects
--  es justo lo que la vez pasada choco con el servicio de Storage y
--  corto con "deadlock detected". Esto es una tabla y nada mas, asi que
--  entra sin riesgo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. FUERA LA TABLA DE ANTES/DESPUES
--    Se creo para una seccion que despues se quito. Esta vacia.
-- ---------------------------------------------------------------------
drop table if exists casos;


-- ---------------------------------------------------------------------
-- 2. LA GALERIA
--
--    Una foto por fila. Sin `cliente_id` a proposito: son fotos del
--    lugar, de los productos o de un tratamiento en curso, no de la
--    ficha de nadie. Si alguna vez hay que sacar una, se borra la fila.
--
--    `publicado` arranca en false: una foto aparece en la web recien
--    cuando Valen la publica a mano, mirandola.
-- ---------------------------------------------------------------------
create table if not exists galeria (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  -- Ruta dentro del bucket `casos`, que es publico
  archivo     text not null,
  orden       integer not null default 0,
  publicado   boolean not null default false,
  creado_en   timestamptz not null default now()
);

create index if not exists galeria_publicadas_idx on galeria (publicado, orden);

alter table galeria enable row level security;

-- La web ve solo las publicadas; el panel las ve todas.
drop policy if exists "galeria publicada es publica" on galeria;
create policy "galeria publicada es publica"
  on galeria for select
  to anon
  using (publicado = true);

drop policy if exists "la admin gestiona la galeria" on galeria;
create policy "la admin gestiona la galeria"
  on galeria for all
  to authenticated
  using (true)
  with check (true);


-- =====================================================================
--  LISTO.
-- =====================================================================
