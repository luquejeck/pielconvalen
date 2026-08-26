-- =====================================================================
--  Piel con Valen — correcciones del control de agosto 2026
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  Nada de esto es obligatorio para que la web siga andando: el codigo
--  funciona con o sin este archivo. Corriendolo, dos cosas dejan de ser
--  frágiles.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. DESCONTAR STOCK EN UNA SOLA OPERACION
--
--    Antes la venta de un producto hacia tres viajes: insertar el
--    movimiento, leer `cantidad`, escribir `cantidad - 1`. Si el tercer
--    paso fallaba, la venta quedaba registrada y el stock no bajaba. Y
--    dos ventas al mismo tiempo pisaban la misma lectura, asi que se
--    perdia una resta.
--
--    Aca la resta la hace Postgres sobre la fila, con su propio candado:
--    no hay lectura previa que se pueda quedar vieja.
-- ---------------------------------------------------------------------
create or replace function descontar_stock(
  p_inventario_id uuid,
  p_unidades      integer default 1
)
returns integer
language sql
security invoker
as $$
  update inventario
     set cantidad = greatest(0, cantidad - p_unidades)
   where id = p_inventario_id
  returning cantidad;
$$;

revoke all on function descontar_stock(uuid, integer) from public, anon;
grant execute on function descontar_stock(uuid, integer) to authenticated;


-- ---------------------------------------------------------------------
-- 2. QUE UNA VISITANTE NO PUEDA LLENAR LA AGENDA
--
--    La politica "visitantes pueden pedir turno" deja que cualquiera con
--    la clave publica —que viaja en el JavaScript de la pagina— inserte
--    turnos pendientes sin limite. Con un script se ocupa la agenda
--    entera y Valen se queda sin horarios para vender.
--
--    Esto no lo cierra del todo (para eso hay que sacarle el permiso a
--    `anon` y que todo pase por /api/turnos), pero le pone tres frenos
--    baratos: solo fechas futuras, solo dentro de la ventana de reserva,
--    y nada de escribir precios ni tratamientos inventados.
-- ---------------------------------------------------------------------
drop policy if exists "visitantes pueden pedir turno" on turnos;
create policy "visitantes pueden pedir turno"
  on turnos for insert
  to anon
  with check (
    estado = 'pendiente'
    and fecha >= current_date
    and fecha <= current_date + interval '120 days'
    -- El telefono lo carga Valen desde el panel, nunca la visitante.
    and telefono is null
  );


-- ---------------------------------------------------------------------
-- 3. INDICE PARA LA BANDEJA DE PENDIENTES
--
--    El panel hoy mira un dia por vez. Cuando se sume la lista de
--    pedidos sin responder (tanda 2 del informe), esta es la consulta
--    que va a hacer todo el tiempo.
-- ---------------------------------------------------------------------
create index if not exists turnos_estado_fecha_idx
  on turnos (estado, fecha);


-- =====================================================================
--  LISTO.
-- =====================================================================
