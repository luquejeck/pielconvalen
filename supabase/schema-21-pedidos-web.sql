-- =====================================================================
--  Piel con Valen — los pedidos de la tienda, registrados
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  CORRER ESTO ANTES DE PUBLICAR EL CODIGO QUE LO USA. Al reves no se
--  rompe nada —el pedido igual sale por WhatsApp—, pero no queda
--  registrado y Valen no lo ve en el panel.
--
--  PARA QUE.
--  Hasta ahora el pedido era solo un mensaje de WhatsApp: si a la
--  clienta no se le abria, o lo escribia distinto, no quedaba rastro.
--  Ahora, al tocar "Enviar pedido por WhatsApp", la web lo registra con
--  un codigo corto (P-4K7M) que tambien viaja en el mensaje. Valen lo ve
--  en el panel y lo cruza con el WhatsApp: doble validacion.
--
--  QUE SE GUARDA. Solo lo que se pidio: codigo, productos con su precio
--  de ese momento, total y estado. Ningun dato de la clienta —ni
--  nombre ni telefono—: eso llega por WhatsApp, como siempre.
-- =====================================================================

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  /* El mismo codigo que va en el mensaje de WhatsApp. */
  codigo text not null unique check (codigo ~ '^P-[A-Z0-9]{4,6}$'),
  /* [{ marca, nombre, cantidad, precio }] con el precio de ese momento:
     si Valen cambia un precio despues, el pedido dice lo que se pidio. */
  items jsonb not null,
  total integer not null default 0,
  /* nuevo      -> recien entrado, Valen todavia no lo cruzo
     recibido   -> le llego el WhatsApp con ese codigo
     no-llego   -> nunca llego el mensaje */
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'recibido', 'no-llego')),
  creado_en timestamptz not null default now()
);

create index if not exists pedidos_estado_idx on pedidos (estado, creado_en desc);

alter table pedidos enable row level security;

/*
  PERMISOS: PRIMERO SE REVOCA TODO, DESPUES SE DA LO JUSTO.

  Los `default privileges` de Supabase le dan ALL a `anon` sobre cada
  tabla nueva. Un `grant` suma, no recorta: sin el revoke, cualquiera
  con la clave publica podria leer y borrar los pedidos (schema-16).
*/
revoke all on table pedidos from anon, authenticated;

/* La visitante solo puede REGISTRAR un pedido nuevo: no leer ninguno,
   ni el suyo, ni cambiarlo ni borrarlo. */
grant insert on table pedidos to anon;
drop policy if exists "visitantes registran su pedido" on pedidos;
create policy "visitantes registran su pedido"
  on pedidos for insert
  to anon
  with check (estado = 'nuevo');

/* Valen, logueada, los ve y les cambia el estado. */
grant select, insert, update, delete on table pedidos to authenticated;
drop policy if exists "la admin gestiona los pedidos" on pedidos;
create policy "la admin gestiona los pedidos"
  on pedidos for all
  to authenticated
  using (true)
  with check (true);


-- =====================================================================
--  LISTO.
--
--  Para comprobarlo, con la clave anonima:
--
--      npm run permisos
--
--  Tiene que dar todo en OK: ahora ademas prueba que con la clave
--  publica NO se pueden leer ni borrar los pedidos.
-- =====================================================================
