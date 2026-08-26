-- =====================================================================
--  Piel con Valen — antes y después en la web
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  En cosmetologia el antes/despues es lo que mas convence: nadie
--  reserva por leer "piel mas luminosa", reserva por ver una piel.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. BUCKET PUBLICO, SEPARADO DEL PRIVADO
--
--    `imagenes` (schema-9) es privado y guarda las fotos de las fichas
--    clinicas. Estas otras van a estar a la vista de cualquiera que
--    entre a la web, asi que viven en otro lado.
--
--    Que compartan bucket es como se filtran las fotos de una ficha: un
--    dia alguien afloja una politica "para que se vean las de la web" y
--    se lleva puestas las demas. Separados, ese error no existe.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('casos', 'casos', true)
on conflict (id) do update set public = true;

drop policy if exists "casos: cualquiera mira" on storage.objects;
create policy "casos: cualquiera mira"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'casos');

drop policy if exists "casos: la admin sube" on storage.objects;
create policy "casos: la admin sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'casos');

drop policy if exists "casos: la admin borra" on storage.objects;
create policy "casos: la admin borra"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'casos');


-- ---------------------------------------------------------------------
-- 2. LOS CASOS
--
--    Sin `cliente_id` a proposito: esto NO es la ficha clinica. Una foto
--    publicada no tiene que quedar atada al nombre de nadie, y si alguna
--    vez alguien pide que la saquen, se borra la fila y listo, sin tocar
--    su historial.
--
--    `consentimiento` guarda quien autorizo y cuando, en texto libre.
--    Publicar la cara de una clienta sin permiso escrito no se hace.
-- ---------------------------------------------------------------------
create table if not exists casos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  descripcion    text,
  tratamiento    text,
  -- Rutas dentro del bucket `casos`
  archivo_antes  text not null,
  archivo_despues text not null,
  -- Quien dio permiso para publicarlas y cuando
  consentimiento text,
  orden          integer not null default 0,
  publicado      boolean not null default false,
  creado_en      timestamptz not null default now()
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
--  LISTO.
-- =====================================================================
