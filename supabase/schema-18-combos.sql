-- =====================================================================
--  Piel con Valen — los combos pasan a ser de Valen
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  HASTA HOY EL COMBO ESTABA ESCRITO EN EL CODIGO.
--
--  lib/combos.ts tiene "Rutina antiedad" con sus tres codigos y su 10%:
--  cambiarle el nombre, el descuento o uno de los productos pedia un
--  programador y un deploy. Es lo mismo que pasaba con los productos
--  hasta schema-14, y se arregla igual: la base manda y el archivo queda
--  de respaldo.
--
--  EL PRECIO SIGUE SIN GUARDARSE. El combo es la suma de lo que valen
--  hoy sus productos, menos el descuento, y eso se calcula al dibujar la
--  pagina. Guardar un precio de combo seria un numero mas que se queda
--  atras cada vez que Valen toca un precio o pone una oferta.
--
--  SON DOS TABLAS Y NO UNA CON UNA LISTA DE CODIGOS ADENTRO.
--  Con `codigos text[]` nada impide escribir un codigo que no existe, y
--  borrar un producto dejaria combos apuntando al vacio. Con la tabla
--  hija y su clave foranea, eso no se puede escribir: si Valen borra un
--  producto, sale tambien de los combos que lo usaban.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. EL COMBO
--
--    `slug` es la clave con la que viaja en el carrito guardado en el
--    telefono de la clienta (`combo-rutina-antiedad`). Por eso lo pone
--    el servidor a partir del nombre y no se toca despues: cambiarlo
--    vaciaria el pedido a medio armar de quien lo tenga abierto.
--
--    `publicado` arranca en FALSE, igual que en productos y galeria: un
--    combo se arma, se mira como quedo y recien despues sale a la web.
-- ---------------------------------------------------------------------
create table if not exists combos (
  id             uuid        primary key default gen_random_uuid(),
  slug           text        not null unique,
  nombre         text        not null,
  descripcion    text        not null default '',
  /* En porcentaje entero: 10 es 10%. La web lo divide por cien.
     Entero y no fraccion porque es lo que Valen escribe y lo que se
     anuncia; guardar 0,1 obligaba a traducir en las dos puntas. */
  descuento      integer     not null default 10,
  publicado      boolean     not null default false,
  orden          integer     not null default 0,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),

  constraint descuento_razonable check (descuento between 1 and 90)
);


-- ---------------------------------------------------------------------
-- 2. QUE PRODUCTOS LO FORMAN
--
--    `on delete cascade` en las dos puntas, y son dos cosas distintas:
--    si se borra el COMBO se van sus lineas, que no significan nada
--    sueltas; si se borra el PRODUCTO sale de los combos que lo usaban.
--
--    Lo segundo no deja combos rotos: el que quede con dos productos
--    sigue siendo un combo de dos, y si queda con uno la web no lo
--    muestra (un combo de un producto no es un combo).
-- ---------------------------------------------------------------------
create table if not exists combo_productos (
  combo_id      uuid    not null references combos(id)     on delete cascade,
  inventario_id uuid    not null references inventario(id) on delete cascade,
  /* El orden es el de la rutina: limpiar, tratar, proteger. Es lo que
     numera los pasos en la pagina. */
  orden         integer not null default 0,

  primary key (combo_id, inventario_id)
);

create index if not exists combo_productos_combo_idx
  on combo_productos (combo_id, orden);


-- ---------------------------------------------------------------------
-- 3. PERMISOS: REVOCAR PRIMERO, OTORGAR DESPUES
--
--    Supabase trae `default privileges` que le dan ALL a `anon` sobre
--    cada tabla nueva. Con la vista del catalogo eso ya abrio un agujero
--    una vez: cualquier visitante podia escribir. Aca se cierra antes de
--    dar nada.
--
--    La web publica NO lee estas tablas: lee la vista de mas abajo.
-- ---------------------------------------------------------------------
revoke all on table combos          from anon, authenticated;
revoke all on table combo_productos from anon, authenticated;

grant select, insert, update, delete on table combos          to authenticated;
grant select, insert, update, delete on table combo_productos to authenticated;

alter table combos          enable row level security;
alter table combo_productos enable row level security;

drop policy if exists "combos: solo la admin" on combos;
create policy "combos: solo la admin"
  on combos for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "combo_productos: solo la admin" on combo_productos;
create policy "combo_productos: solo la admin"
  on combo_productos for all
  to authenticated
  using (true)
  with check (true);


-- ---------------------------------------------------------------------
-- 4. LO QUE VE LA WEB
--
--    Devuelve un renglon por combo publicado, con los CODIGOS de sus
--    productos en orden. La web los busca en el catalogo publico que ya
--    tiene cargado y arma el precio; si alguno no esta —despublicado, sin
--    stock, borrado— el combo no se ofrece. Esa regla ya existe en
--    lib/combos.ts y no cambia.
--
--    `security_invoker = false`: la vista lee con los permisos de quien
--    la creo, asi la visitante ve los combos sin tener acceso a las
--    tablas. Es el mismo mecanismo que `productos_publicos`.
--
--    No devuelve ni costos ni margenes: aca solo hay nombres, codigos y
--    el descuento, que es lo que se anuncia.
-- ---------------------------------------------------------------------
drop view if exists combos_publicos;
create view combos_publicos with (security_invoker = false) as
select
  c.slug,
  c.nombre,
  c.descripcion,
  c.descuento,
  c.orden,
  coalesce(
    array_agg(i.codigo order by cp.orden, i.codigo) filter (where i.codigo is not null),
    '{}'
  ) as codigos
from combos c
join combo_productos cp on cp.combo_id = c.id
join inventario i       on i.id = cp.inventario_id
where c.publicado
group by c.id, c.slug, c.nombre, c.descripcion, c.descuento, c.orden;

/*
  La vista es de LECTURA Y NADA MAS.

  Una vista simple es actualizable en Postgres, y con los `default
  privileges` de Supabase eso ya dejo escribir a `anon` una vez
  (schema-16). Esta tiene un `group by`, asi que no es actualizable, pero
  los permisos se escriben igual de explicitos para no depender de ese
  detalle.
*/
revoke all on table combos_publicos from anon, authenticated;
grant select on table combos_publicos to anon, authenticated;


-- ---------------------------------------------------------------------
-- 5. EL COMBO QUE YA ESTABA, PASADO A LA BASE
--
--    "Rutina antiedad" venia de lib/combos.ts y esta hoy en la web. Se
--    carga aca para que no desaparezca al cambiar de fuente, y con sus
--    mismos tres productos y su mismo 10%.
--
--    `on conflict do nothing`: correr esto dos veces no lo duplica ni
--    pisa lo que Valen haya cambiado despues.
-- ---------------------------------------------------------------------
insert into combos (slug, nombre, descripcion, descuento, publicado, orden)
values (
  'rutina-antiedad',
  'Rutina antiedad',
  'Limpiar, tratar y cuidar el contorno. Tres pasos que apuntan a la elasticidad de la piel.',
  10,
  true,
  0
)
on conflict (slug) do nothing;

insert into combo_productos (combo_id, inventario_id, orden)
select c.id, i.id, x.orden
from combos c
join (values
  ('ARL-SMOO-80ML', 0),
  ('BOJ-REVI-30ML', 1),
  ('AHC-TIME-30ML', 2)
) as x(codigo, orden) on true
join inventario i on i.codigo = x.codigo
where c.slug = 'rutina-antiedad'
on conflict (combo_id, inventario_id) do nothing;


-- =====================================================================
--  LISTO.
--
--  Para comprobar los permisos, con la clave anonima:
--
--      npm run permisos
--
--  Tiene que seguir dando todo en OK: los combos se leen desde la web
--  por la vista, y las tablas no se tocan desde afuera del panel.
-- =====================================================================
