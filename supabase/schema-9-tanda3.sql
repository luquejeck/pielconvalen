-- =====================================================================
--  Piel con Valen — tanda 3 del control
--  "Que puedas cambiar la web sin llamarme"
--
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  De las once cosas que se ven en la web, Valen podia cambiar dos:
--  los tratamientos y los horarios. Las otras nueve —su nombre, la
--  direccion, el telefono, los medios de pago, los beneficios, las
--  explicaciones de los tratamientos, las fotos— vivian escritas en el
--  codigo y cambiarlas necesitaba un programador y un deploy.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. CONFIGURACION DE LA WEB
--
--    Clave / valor, igual que la tabla `agenda`: lo que no este cargado
--    cae en el valor que trae el codigo, asi que la web nunca queda sin
--    datos ni a medio configurar.
--
--    Los valores estructurados (beneficios, glosario) van como JSON en
--    el mismo campo de texto. Es una tabla que lee una sola persona y
--    escribe una sola persona: no hace falta mas.
-- ---------------------------------------------------------------------
create table if not exists configuracion (
  clave          text primary key,
  valor          text not null,
  actualizado_en timestamptz not null default now()
);

alter table configuracion enable row level security;

-- La web publica la lee en cada visita: tiene que ser legible sin login.
drop policy if exists "la configuracion es publica" on configuracion;
create policy "la configuracion es publica"
  on configuracion for select
  to anon, authenticated
  using (true);

drop policy if exists "la admin edita la configuracion" on configuracion;
create policy "la admin edita la configuracion"
  on configuracion for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 2. FICHA CLINICA: FOTOS Y CONSENTIMIENTO
--
--    En cosmetologia con microneedling, el antes/despues y el
--    consentimiento firmado no son un lujo: son el registro de que se
--    hizo y de que la clienta sabia lo que le iban a hacer.
-- ---------------------------------------------------------------------
create table if not exists fotos_clienta (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  sesion_id  uuid references sesiones(id) on delete set null,
  -- 'antes' | 'despues'
  momento    text not null default 'antes',
  -- Ruta dentro del bucket de Storage, no la URL completa
  archivo    text not null,
  notas      text,
  creado_en  timestamptz not null default now(),

  constraint momento_valido check (momento in ('antes', 'despues'))
);

create index if not exists fotos_clienta_idx on fotos_clienta (cliente_id, creado_en desc);

alter table fotos_clienta enable row level security;

drop policy if exists "fotos: solo autenticada" on fotos_clienta;
create policy "fotos: solo autenticada"
  on fotos_clienta for all to authenticated using (true) with check (true);


create table if not exists consentimientos (
  id           uuid primary key default gen_random_uuid(),
  cliente_id   uuid not null references clientes(id) on delete cascade,
  tratamiento  text not null,
  -- Lo que la clienta acepto, guardado tal como estaba ese dia: si el
  -- texto cambia despues, el consentimiento viejo tiene que seguir
  -- diciendo lo que decia cuando lo firmo.
  texto        text not null,
  firmado_por  text not null,
  firmado_en   timestamptz not null default now()
);

create index if not exists consentimientos_cliente_idx on consentimientos (cliente_id, firmado_en desc);

alter table consentimientos enable row level security;

drop policy if exists "consentimientos: solo autenticada" on consentimientos;
create policy "consentimientos: solo autenticada"
  on consentimientos for all to authenticated using (true) with check (true);


-- ---------------------------------------------------------------------
-- 3. BUCKET PARA LAS IMAGENES
--
--    Uno solo, privado. Las fotos de la web se sirven con URL firmada
--    igual que las de las clientas: mezclar publico y privado en el
--    mismo lugar es como se filtran las fotos de una ficha clinica.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('imagenes', 'imagenes', false)
on conflict (id) do nothing;

drop policy if exists "imagenes: la admin sube" on storage.objects;
create policy "imagenes: la admin sube"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'imagenes');

drop policy if exists "imagenes: la admin ve" on storage.objects;
create policy "imagenes: la admin ve"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'imagenes');

drop policy if exists "imagenes: la admin borra" on storage.objects;
create policy "imagenes: la admin borra"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'imagenes');


-- =====================================================================
--  LISTO.
-- =====================================================================
