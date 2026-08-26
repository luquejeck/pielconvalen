-- =====================================================================
--  Piel con Valen — antes y después (2 de 2): las fotos
--
--  Pegar en Supabase → SQL Editor → Run
--
--  Va aparte porque cambiar politicas sobre `storage.objects` pide un
--  lock exclusivo sobre esa tabla. Si el servicio de Storage la esta
--  leyendo en ese momento, las dos se trecan y Postgres corta con
--  "deadlock detected". Es transitorio: si pasa, se vuelve a correr.
--
--  SI VUELVE A FALLAR: crea el bucket a mano desde el menu Storage →
--  New bucket, con nombre `casos` y marcando "Public bucket", y despues
--  corre este archivo de nuevo. Las politicas solas casi nunca chocan.
-- =====================================================================

-- ---------------------------------------------------------------------
--  BUCKET PUBLICO, SEPARADO DEL PRIVADO
--
--  `imagenes` (schema-9) es privado y guarda las fotos de las fichas
--  clinicas. Estas otras van a estar a la vista de cualquiera que entre
--  a la web, asi que viven en otro lado.
--
--  Que compartan bucket es como se filtran las fotos de una ficha: un
--  dia alguien afloja una politica "para que se vean las de la web" y se
--  lleva puestas las demas. Separados, ese error no existe.
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

-- =====================================================================
--  LISTO.
-- =====================================================================
