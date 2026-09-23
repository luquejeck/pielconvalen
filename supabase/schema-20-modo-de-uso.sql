-- =====================================================================
--  Piel con Valen — "Cómo se usa" en cada producto
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  CORRER ESTO ANTES DE PUBLICAR EL CODIGO QUE LO USA.
--
--  El panel guarda el producto entero, y desde este cambio manda
--  tambien `modo_uso`. Si el codigo llega a la web antes que esta
--  columna, crear un producto nuevo desde el panel falla. Al reves no
--  pasa nada: la columna nueva no molesta al codigo de hoy.
--
--  POR QUE HACE FALTA.
--  La pagina de cada producto cuenta para que sirve, pero no como se
--  usa, y es lo primero que pregunta quien no conoce la cosmetica
--  coreana: ¿de dia o de noche?, ¿antes o despues de la crema?, ¿se
--  enjuaga? Una o dos frases, que Valen puede editar desde el panel.
-- =====================================================================

alter table inventario add column if not exists modo_uso text;

/*
  La vista publica suma la columna AL FINAL: `create or replace view`
  solo deja agregar columnas despues de las que ya tenia.
*/
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
    cantidad,
    modo_uso
  from inventario
  where publicado = true;

/*
  Los permisos, explicitos como siempre: primero se revoca todo y
  recien despues se da solo lectura. Un `grant` suma, no recorta, y los
  `default privileges` de Supabase le dan ALL a `anon` (schema-16).
*/
revoke all on table productos_publicos from anon, authenticated;
grant select on table productos_publicos to anon, authenticated;

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
--  Tiene que seguir dando todo en OK: la vista se puede leer y no se
--  puede escribir, y el costo sigue sin salir.
-- =====================================================================
