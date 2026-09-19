-- =====================================================================
--  Piel con Valen — los productos pasan a ser de Valen
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  HASTA HOY HABIA DOS LISTAS QUE NADIE SINCRONIZABA.
--  Los 20 productos que se ven en la web viven en lib/productos.ts, o
--  sea en el codigo, y solo los edita un programador. La tabla
--  `inventario` es otra lista, escrita a mano, con el stock y el costo.
--  Nada las ata: `inventario.producto` es texto libre, asi que "Glow
--  Serum" en una tabla y "Glow Serum" en la otra son dos cosas que se
--  parecen y nada mas.
--
--  Despues de esto hay UNA lista. `inventario` pasa a ser el producto
--  entero —lo que se publica y lo que se guarda en el deposito— y la
--  web lo lee de aca. lib/productos.ts queda de RESPALDO: si la base no
--  responde o esta vacia, la web sigue mostrando los 20 de siempre en
--  vez de una pagina en blanco. Es el mismo trato que ya tienen los
--  tratamientos en lib/catalogo.ts.
--
--  LA TABLA SIGUE LLAMANDOSE `inventario` aunque ahora sea mas que eso.
--  Renombrarla obligaria a tocar la API, el panel y los datos que ya
--  tiene cargados Valen, y todo eso para que el nombre quede lindo.
--
--  NO TOCA STORAGE. Las fotos que suba Valen van al bucket `casos`, que
--  ya existe y ya tiene sus politicas. Cambiar politicas sobre
--  storage.objects es lo que una vez corto con "deadlock detected".
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. EL PRODUCTO COMPLETO
--
--    Las columnas que hasta ahora vivian en lib/productos.ts. Todas con
--    default, asi que las filas que Valen ya tenia cargadas siguen
--    siendo validas y no hay que rellenar nada a mano.
--
--    `publicado` arranca en FALSE a proposito, igual que en galeria: un
--    producto nuevo no sale a la web hasta que ella lo mire y lo
--    publique. Es el mecanismo que el catalogo ya usaba como `borrador`.
-- ---------------------------------------------------------------------
alter table inventario
  add column if not exists codigo          text,
  add column if not exists categoria       text,
  add column if not exists medida          text,
  add column if not exists descripcion     text    not null default '',
  add column if not exists beneficios      text[]  not null default '{}',
  add column if not exists foto            text,
  add column if not exists precio_anterior integer,
  add column if not exists publicado       boolean not null default false,
  add column if not exists destacado       boolean not null default false,
  add column if not exists orden           integer not null default 0,
  add column if not exists actualizado_en  timestamptz not null default now();

/*
  EL CODIGO ES UNICO, PERO PUEDE FALTAR.

  Unico porque es con lo que Valen los va a nombrar, y dos productos con
  el mismo codigo hacen que el seguimiento mienta. Puede faltar porque
  las filas que ella ya tiene cargadas entran sin codigo y no se les va
  a inventar uno desde SQL: se los pone la carga inicial, que sabe leer
  el nombre. El indice parcial permite las dos cosas.
*/
create unique index if not exists inventario_codigo_idx
  on inventario (codigo)
  where codigo is not null;

/* La web pide "los publicados, en orden de rutina" en cada visita. */
create index if not exists inventario_publicado_idx
  on inventario (publicado, categoria, orden);


-- ---------------------------------------------------------------------
-- 2. QUE LA VENTA SEPA QUE SE VENDIO
--
--    Este es el arreglo que hace posible todo el seguimiento por
--    producto. Hasta ahora el panel mandaba `inventario_id` al guardar
--    una venta, la API lo usaba para descontar stock Y LO TIRABA: nunca
--    se guardaba. El movimiento quedaba con una descripcion de texto y
--    un costo suelto, sin manera de saber a que producto pertenecia.
--
--    Por eso hoy no se puede contestar "cuanto gane con el Glow Serum".
--    Con la columna, se contesta con una suma.
--
--    `on delete set null` y no `cascade`: si Valen borra un producto
--    del catalogo, las ventas que ya hizo NO se borran. La plata que
--    entro entro, y un balance que cambia cuando se limpia el catalogo
--    no sirve para nada.
-- ---------------------------------------------------------------------
alter table movimientos
  add column if not exists inventario_id uuid references inventario(id) on delete set null,
  add column if not exists unidades      integer;

create index if not exists movimientos_inventario_idx
  on movimientos (inventario_id, fecha);

/*
  El nombre del producto, congelado en el movimiento.

  Parece redundante teniendo `inventario_id`, y no lo es: cuando Valen
  borre un producto el id queda en null y la venta se quedaria sin decir
  de que fue. Con esto, el flujo de caja sigue siendo legible para
  siempre. Es la misma razon por la que `costo` se congela.
*/
alter table movimientos
  add column if not exists producto_nombre text;


-- ---------------------------------------------------------------------
-- 3. REPONER STOCK
--
--    El espejo de descontar_stock(), que ya existe desde
--    schema-7-correcciones. Cuando Valen compra mercaderia, registra la
--    compra y las unidades entran al deposito en la misma operacion.
--
--    La resta la hace Postgres sobre la fila, con su candado: dos
--    reposiciones al mismo tiempo no se pisan. Sin esto habria que
--    leer, sumar y escribir, que es justo lo que se rompe cuando dos
--    cosas pasan juntas.
-- ---------------------------------------------------------------------
create or replace function sumar_stock(
  p_inventario_id uuid,
  p_unidades      integer default 1
)
returns integer
language sql
security invoker
as $$
  update inventario
     set cantidad = cantidad + greatest(0, p_unidades),
         actualizado_en = now()
   where id = p_inventario_id
  returning cantidad;
$$;

revoke all on function sumar_stock(uuid, integer) from public, anon;
grant execute on function sumar_stock(uuid, integer) to authenticated;


-- ---------------------------------------------------------------------
-- 4. QUE LA WEB PUEDA LEER LOS PUBLICADOS
--
--    `inventario` hoy es "solo autenticada" para todo, porque era una
--    tabla de deposito. Ahora tambien es el catalogo, y la visitante
--    tiene que poder verlo sin estar logueada.
--
--    SE PUBLICA LA FILA ENTERA Y ESO INCLUYE EL COSTO. Por eso la
--    lectura anonima NO va por RLS: va por la API del servidor, que
--    elige columnas. Aca solo se deja explicito que anon no toca nada,
--    que es como esta hoy, para que quede escrito y nadie lo afloje
--    "para que ande la web".
--
--    lib/catalogo-productos.ts lee con el cliente de servidor y
--    selecciona campos: el costo no sale nunca del servidor.
-- ---------------------------------------------------------------------
revoke all on table inventario from anon;


-- =====================================================================
--  LISTO.
--
--  Falta la carga inicial de los 20 productos que hoy estan en el
--  codigo. No se hace desde aca —necesita leer lib/productos.ts y
--  generar los codigos— sino con:
--
--      npm run productos:cargar
--
--  Ese comando es idempotente: se puede correr dos veces sin duplicar.
-- =====================================================================
