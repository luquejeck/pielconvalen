-- =====================================================================
--  Piel con Valen — antes y después (1 de 2): la tabla
--
--  Pegar en Supabase → SQL Editor → Run
--
--  Esta parte no toca Storage, asi que entra siempre. La otra mitad
--  (schema-10b) va aparte porque cambiar politicas de `storage.objects`
--  pide un lock exclusivo sobre esa tabla, y si justo el servicio de
--  Storage la esta leyendo, las dos se trecan y Postgres corta con
--  "deadlock detected". Separadas, un choque ahi no se lleva puesta la
--  tabla.
-- =====================================================================

-- ---------------------------------------------------------------------
--  LOS CASOS
--
--  Sin `cliente_id` a proposito: esto NO es la ficha clinica. Una foto
--  publicada no tiene que quedar atada al nombre de nadie, y si alguna
--  vez alguien pide que la saquen, se borra la fila y listo, sin tocar
--  su historial.
--
--  `consentimiento` guarda quien autorizo y cuando, en texto libre.
--  Publicar la cara de una clienta sin permiso escrito no se hace.
-- ---------------------------------------------------------------------
create table if not exists casos (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  descripcion     text,
  tratamiento     text,
  -- Rutas dentro del bucket `casos`
  archivo_antes   text not null,
  archivo_despues text not null,
  -- Quien dio permiso para publicarlas y cuando
  consentimiento  text,
  orden           integer not null default 0,
  publicado       boolean not null default false,
  creado_en       timestamptz not null default now()
);

create index if not exists casos_publicados_idx on casos (publicado, orden);

alter table casos enable row level security;

-- La web muestra solo los publicados; el panel los ve todos.
drop policy if exists "casos publicados son publicos" on casos;
create policy "casos publicados son publicos"
  on casos for select
  to anon
  using (publicado = true);

drop policy if exists "la admin gestiona los casos" on casos;
create policy "la admin gestiona los casos"
  on casos for all
  to authenticated
  using (true)
  with check (true);

-- =====================================================================
--  LISTO. Ahora corre schema-10b-casos-storage.sql
-- =====================================================================
