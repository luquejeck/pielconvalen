-- =====================================================================
--  Piel con Valen — el historial de stock
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  HASTA HOY EL STOCK CAMBIABA SIN DEJAR RASTRO.
--
--  Las compras quedaban registradas —como gasto en `movimientos`— y las
--  ventas tambien —como ingreso—. Pero el +/- del panel, el AJUSTE,
--  cambiaba el numero y no quedaba en ningun lado por que. Justo los
--  ajustes son los que mas importa poder mirar despues: si Valen cuenta
--  3 Glow Serum y el sistema dice 5, sin historial no hay forma de saber
--  si vendio sin registrar, si se rompio uno o si conto mal.
--
--  Esta tabla guarda CADA cambio de stock de cada producto, venga de
--  donde venga, con su motivo.
--
--  VA APARTE DE `movimientos`, A PROPOSITO.
--  `movimientos` es la caja: cada fila es plata que entro o salio. Un
--  ajuste no es plata, y meterlo ahi ensuciaria el flujo de caja con
--  lineas en cero. Aca solo se miran unidades. Una compra y una venta
--  aparecen en los dos lados —plata en uno, unidades en el otro— y
--  quedan atadas por `movimiento_id`.
-- =====================================================================

create table if not exists movimientos_stock (
  id               uuid        primary key default gen_random_uuid(),
  inventario_id    uuid        references inventario(id) on delete set null,
  /* Positivo entra, negativo sale. */
  cantidad         integer     not null,
  motivo           text        not null,
  /* El por que de un ajuste, en palabras de Valen. */
  nota             text,
  /* La fila de plata que lo acompaña, si la hubo: compras y ventas. */
  movimiento_id    uuid        references movimientos(id) on delete set null,
  /* Cuanto quedo despues. Permite leer el historial sin recalcular. */
  stock_resultante integer,
  /* Congelado, como en `movimientos`: si se borra el producto, la
     linea del historial sigue diciendo de que era. */
  producto_nombre  text,
  fecha            date        not null default current_date,
  creado_en        timestamptz not null default now(),

  constraint motivo_valido check (motivo in ('compra', 'venta', 'ajuste', 'inicial'))
);

create index if not exists movimientos_stock_producto_idx
  on movimientos_stock (inventario_id, creado_en desc);


-- ---------------------------------------------------------------------
-- PERMISOS: REVOCAR PRIMERO, OTORGAR DESPUES
--
-- Supabase trae `default privileges` que le dan ALL a `anon` sobre cada
-- tabla nueva. Con la vista del catalogo eso ya abrio un agujero una
-- vez: cualquier visitante podia escribir. Aca se cierra antes de dar
-- nada. Esta tabla es solo del panel: la web publica no la lee nunca.
-- ---------------------------------------------------------------------
revoke all on table movimientos_stock from anon, authenticated;
grant select, insert on table movimientos_stock to authenticated;

alter table movimientos_stock enable row level security;

drop policy if exists "historial de stock: solo la admin" on movimientos_stock;
create policy "historial de stock: solo la admin"
  on movimientos_stock for all
  to authenticated
  using (true)
  with check (true);

/*
  Sin update ni delete, a proposito: un historial que se puede editar
  no es un historial. Si una linea esta mal, se corrige con otra linea
  —un ajuste en sentido contrario, con su nota—, igual que en un libro
  de cuentas.
*/


-- ---------------------------------------------------------------------
-- EL PUNTO DE PARTIDA
--
-- El stock que hay hoy entro con un recuento directo (npm run
-- stock:cargar, ya retirado), sin movimientos. Para que el historial de cada
-- producto arranque en el numero correcto, se deja una linea "inicial"
-- con lo que tiene cada uno ahora.
--
-- Solo se crea si el producto todavia no tiene historial, asi correr
-- este archivo dos veces no duplica el punto de partida.
-- ---------------------------------------------------------------------
insert into movimientos_stock (inventario_id, cantidad, motivo, nota, stock_resultante, producto_nombre)
select
  i.id,
  i.cantidad,
  'inicial',
  'Recuento del 19-09-2026',
  i.cantidad,
  i.marca || ' ' || i.producto
from inventario i
where i.cantidad > 0
  and not exists (
    select 1 from movimientos_stock m where m.inventario_id = i.id
  );


-- =====================================================================
--  LISTO.
--
--  Para comprobar los permisos, con la clave anonima:
--
--      npm run permisos
--
--  Tiene que seguir dando todo en OK. El historial no se puede leer ni
--  escribir desde la web publica.
-- =====================================================================
