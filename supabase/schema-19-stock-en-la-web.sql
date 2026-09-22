-- =====================================================================
--  Piel con Valen — que la web sepa cuanto queda
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  HOY LA WEB VENDE LO QUE NO HAY.
--
--  El catalogo publico nunca supo del stock: `cantidad` no esta en la
--  vista, asi que un producto publicado se ofrece igual con cinco
--  unidades que con cero. Al 22-09-2026 hay OCHO productos publicados
--  con una sola unidad —las cinco mascarillas JM Solution, el Peach 77%,
--  el Rice Milk y la Dynasty Cream—: el dia que se venda uno, la web lo
--  sigue ofreciendo y la clienta lo pide para recibir un "uy, ya no me
--  queda".
--
--  CUANTAS QUEDAN NO ES UN DATO DE LA CASA.
--  Lo que no puede salir de `inventario` es el costo y el margen, y eso
--  sigue afuera de la vista. Las unidades son justo lo contrario: le
--  sirven a la clienta —"queda uno" apura la decision— y cualquier
--  tienda las muestra.
-- =====================================================================

create or replace view productos_publicos
with (security_invoker = false) as
  select
    id,
    codigo,
    marca,
    producto,
    categoria,
    medida,
    precio_venta,
    precio_anterior,
    descripcion,
    beneficios,
    foto,
    destacado,
    orden,
    /* Lo unico que se suma. El costo y el costo en dolares siguen sin
       estar: no hay consulta publica que los pueda sacar. */
    cantidad
  from inventario
  where publicado = true;

/*
  `create or replace` mantiene los permisos que ya tenia la vista, pero
  se vuelven a escribir explicitos por la misma razon de siempre: los
  `default privileges` de Supabase le dan ALL a `anon` sobre los objetos
  nuevos del esquema, y una vez eso dejo escribir el catalogo a
  cualquiera que entrara a la web (schema-16).
*/
revoke all on table productos_publicos from anon, authenticated;
grant select on table productos_publicos to anon, authenticated;

/*
  Y las reglas que la dejan de solo lectura, de schema-16. Se repiten
  porque `create or replace view` las conserva, pero si algun dia la
  vista se borra y se vuelve a crear sin esto, la puerta queda abierta.
*/
create or replace rule productos_publicos_sin_insert
  as on insert to productos_publicos do instead nothing;
create or replace rule productos_publicos_sin_update
  as on update to productos_publicos do instead nothing;
create or replace rule productos_publicos_sin_delete
  as on delete to productos_publicos do instead nothing;


-- =====================================================================
--  LISTO.
--
--  Para comprobarlo, con la clave anonima:
--
--      npm run permisos
--
--  Tiene que seguir dando todo en OK, y ahora ademas la prueba mira que
--  `cantidad` salga y que `costo` siga bloqueado.
-- =====================================================================
