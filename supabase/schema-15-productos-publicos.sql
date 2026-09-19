-- =====================================================================
--  Piel con Valen — la vista publica del catalogo
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  ARREGLA UN ERROR DEL schema-14.
--
--  Ese archivo le revoco a `anon` el acceso a `inventario`, con buen
--  motivo: la tabla tiene el costo de compra y el margen, que son de la
--  casa. Pero la pagina publica lee con la clave anonima —es lo que usa
--  `clienteServidor()`—, asi que con la revocacion la consulta fallaba
--  y la web se caia al catalogo del codigo EN SILENCIO. Andaba, y
--  mostraba lo de siempre, asi que el error no se veia: lo que Valen
--  cargara en el panel no iba a aparecer nunca.
--
--  La salida no es devolverle el permiso sobre la tabla. Si `anon`
--  puede leer `inventario`, puede leer `costo` y `costo_usd`: basta con
--  pedirlos desde el navegador con la clave publica, que viaja en el
--  JavaScript de la pagina.
--
--  La salida es esta vista, que tiene SOLO las columnas publicas. El
--  costo no esta, asi que no hay consulta que lo saque. La eleccion de
--  columnas deja de depender de que el codigo se acuerde de no pedirlas.
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
    orden
  from inventario
  where publicado = true;

/*
  `security_invoker = false` es lo que hace que esto funcione.

  Con esa opcion la vista se ejecuta con los permisos de su dueño y no
  con los de quien consulta, asi que `anon` puede leer la vista aunque
  no pueda leer la tabla de abajo. Es justo el reparto que se busca:
  entra por la puerta chica, que solo da a las columnas publicas.

  Si alguna vez se pone en true, la vista deja de andar para las
  visitantes y la web vuelve a caer al respaldo sin avisar. Es el mismo
  error que este archivo viene a arreglar.
*/

grant select on productos_publicos to anon, authenticated;


-- =====================================================================
--  LISTO.
--
--  Para comprobar que quedo bien, desde el panel de Supabase:
--
--    select count(*) from productos_publicos;   -- tiene que dar 16
--
--  Y que el costo NO se pueda sacar por ahi:
--
--    select costo from productos_publicos;      -- tiene que fallar
-- =====================================================================
