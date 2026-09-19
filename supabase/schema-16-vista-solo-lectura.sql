-- =====================================================================
--  Piel con Valen — la vista publica pasa a ser de SOLO LECTURA
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  ARREGLA UN AGUJERO QUE ABRIO EL schema-15.
--
--  Con ese archivo, cualquiera con la clave publica —la que viaja en el
--  JavaScript de la pagina, o sea la que tiene cualquier visitante—
--  podia CREAR, EDITAR y BORRAR productos del catalogo. Se comprobo
--  insertando una fila con la clave anonima: entro.
--
--  POR QUE PASO, QUE ES LO QUE HAY QUE RECORDAR
--
--  1. Supabase trae `default privileges` que le dan ALL a `anon` y a
--     `authenticated` sobre cada objeto nuevo del esquema `public`. O
--     sea que la vista nacio con permiso de escritura para todos, sin
--     que nadie lo pidiera.
--
--  2. El `grant select` del schema-15 no arreglaba eso: un grant SUMA
--     permisos, no los recorta. Estaba dando algo que ya estaba dado.
--
--  3. La vista es `security_invoker = false`, asi que corre con los
--     permisos de su dueño. Eso es lo que buscabamos para leer, pero
--     tambien significa que ESQUIVA EL RLS de `inventario` al escribir:
--     la politica "solo autenticada" no llegaba a mirarse.
--
--  4. Y una vista simple sobre una tabla es actualizable en Postgres.
--     Sin decirlo, acepta insert, update y delete.
--
--  Los cuatro juntos hacen el agujero. La leccion es que en Supabase
--  hay que REVOCAR primero y recien despues otorgar: dar por sentado
--  que un objeto nuevo nace sin permisos es al reves de como funciona.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. PRIMERO SACAR TODO, DESPUES DAR LO JUSTO
-- ---------------------------------------------------------------------
revoke all on productos_publicos from anon, authenticated;

/* Leer, y nada mas. La web solo muestra el catalogo. */
grant select on productos_publicos to anon, authenticated;


-- ---------------------------------------------------------------------
-- 2. Y QUE NO SE PUEDA ESCRIBIR NI POR ERROR
--
--    Lo de arriba ya alcanza. Esto es el segundo cerrojo: aunque alguna
--    vez se vuelva a correr un `grant all` sobre el esquema —que es lo
--    que hacen varias recetas de Supabase que andan dando vueltas— la
--    regla deja la vista sin escritura igual.
--
--    Una regla DO INSTEAD NOTHING sobre las tres operaciones hace que
--    la vista deje de ser actualizable, que es lo que tendria que haber
--    sido desde el principio: esto es una ventana al catalogo, no una
--    puerta.
-- ---------------------------------------------------------------------
create or replace rule productos_publicos_sin_insert
  as on insert to productos_publicos do instead nothing;

create or replace rule productos_publicos_sin_update
  as on update to productos_publicos do instead nothing;

create or replace rule productos_publicos_sin_delete
  as on delete to productos_publicos do instead nothing;


-- ---------------------------------------------------------------------
-- 3. QUE `inventario` TAMPOCO ACEPTE ESCRITURA ANONIMA
--
--    El schema-14 ya le revoco todo a `anon`, asi que esto no deberia
--    cambiar nada. Va igual porque es barato y porque el mismo
--    `default privileges` que abrio la vista se aplica a cualquier
--    tabla nueva: dejarlo escrito es lo que evita repetir el error.
-- ---------------------------------------------------------------------
revoke all on table inventario from anon;


-- =====================================================================
--  COMO SE COMPRUEBA
--
--  Desde el panel no sirve: el SQL Editor corre como dueño y puede
--  todo. Hay que probarlo con la clave anonima, que es lo que hace
--  scripts/verificar-permisos.mjs:
--
--      npm run permisos
--
--  Tiene que dar las seis en OK.
-- =====================================================================
