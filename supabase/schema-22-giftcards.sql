-- =====================================================================
--  Piel con Valen — giftcards
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  CORRER ESTO ANTES DE PUBLICAR EL CODIGO QUE LO USA. Al reves no se
--  rompe nada —el pedido de la giftcard igual sale por WhatsApp—, pero
--  no queda registrada y Valen no la ve en el panel.
--
--  EL CIRCUITO.
--    1. Quien regala arma la giftcard en /giftcard: que regala (un
--       tratamiento o un monto), para quien, de parte de quien y un
--       mensaje. Toca "Pedir por WhatsApp": la web la registra con un
--       codigo (G-4K7M9P) que tambien viaja en el mensaje.            nueva
--    2. Valen cobra por WhatsApp y la marca como cobrada en el panel.
--       Desde ahi le manda el link de la tarjeta, que quien regala le
--       reenvia a quien la recibe.                                   vigente
--    3. Quien la recibe saca turno y la usa. Valen, al cobrar el turno,
--       elige "Giftcard" como medio de pago y pone el codigo.          usada
--
--  LA PLATA ENTRA EN LA CAJA CUANDO SE USA, NO CUANDO SE VENDE. Es un
--  tratamiento pagado por adelantado: si entrara al venderse y otra vez
--  al atenderla, la Caja lo contaria dos veces, y la sesion "gratis"
--  bajaria el ticket promedio. Lo cobrado y sin usar se ve en el panel
--  de giftcards.
--
--  QUE SE GUARDA. Lo que dice la tarjeta —para quien, de parte de
--  quien, el mensaje— y lo que vale. Ningun telefono: eso llega por
--  WhatsApp, como en los pedidos.
-- =====================================================================

create table if not exists giftcards (
  id uuid primary key default gen_random_uuid(),

  /* El mismo codigo que va en el WhatsApp y en la tarjeta. Seis
     caracteres y no cuatro como los pedidos: este codigo VALE PLATA, y
     con seis hay casi 900 millones de combinaciones. Adivinar uno
     valido deja de ser posible. */
  codigo text not null unique check (codigo ~ '^G-[A-Z0-9]{6}$'),

  para    text not null check (char_length(para) between 1 and 60),
  de      text not null check (char_length(de) between 1 and 60),
  mensaje text check (mensaje is null or char_length(mensaje) <= 240),

  /* El nombre del tratamiento regalado, como estaba ese dia. Vacio =
     un monto para usar en el tratamiento que quiera. */
  tratamiento text check (tratamiento is null or char_length(tratamiento) <= 120),
  /* Lo que se pago, en pesos. En las de tratamiento, su precio de lista
     de ese momento. */
  monto integer not null check (monto > 0),

  /* nueva    -> registrada desde la web, todavia sin cobrar
     vigente  -> cobrada: la tarjeta ya se puede regalar y usar
     usada    -> se uso en un turno
     anulada  -> nunca se pago, o se cancelo */
  estado text not null default 'nueva'
    check (estado in ('nueva', 'vigente', 'usada', 'anulada')),

  medio_pago text,
  cobrada_el date,
  vence_el   date,
  usada_el   date,
  /* El turno en que se uso: deshacer ese cobro la devuelve a vigente. */
  turno_id uuid references turnos(id) on delete set null,

  creado_en timestamptz not null default now()
);

create index if not exists giftcards_estado_idx on giftcards (estado, creado_en desc);
create index if not exists giftcards_turno_idx on giftcards (turno_id);

alter table giftcards enable row level security;

/*
  PERMISOS: PRIMERO SE REVOCA TODO, DESPUES SE DA LO JUSTO.

  Los `default privileges` de Supabase le dan ALL a `anon` sobre cada
  tabla nueva. Un `grant` suma, no recorta: sin el revoke, cualquiera
  con la clave publica podria leer las giftcards —con sus codigos— y
  marcarse una como cobrada (schema-16).
*/
revoke all on table giftcards from anon, authenticated;

/* La visitante solo puede REGISTRAR una nueva, sin cobrar: no leer
   ninguna, ni cambiarla, ni registrarla ya cobrada. */
grant insert on table giftcards to anon;
drop policy if exists "visitantes registran su giftcard" on giftcards;
create policy "visitantes registran su giftcard"
  on giftcards for insert
  to anon
  with check (
    estado = 'nueva'
    and medio_pago is null
    and cobrada_el is null
    and vence_el is null
    and usada_el is null
    and turno_id is null
  );

/* Valen, logueada, las ve y las gestiona. */
grant select, insert, update, delete on table giftcards to authenticated;
drop policy if exists "la admin gestiona las giftcards" on giftcards;
create policy "la admin gestiona las giftcards"
  on giftcards for all
  to authenticated
  using (true)
  with check (true);


/*
  LA TARJETA, VISTA DESDE AFUERA: /giftcard/G-4K7M9P

  Quien la recibe abre el link y ve su tarjeta. Para eso la web tiene
  que poder leer UNA giftcard sabiendo su codigo, pero no listarlas: un
  `select` para `anon`, aunque sea con politica, deja pedir todas.

  Por eso es una funcion y no un permiso sobre la tabla: recibe un
  codigo y devuelve esa sola fila. Corre como dueña (security definer)
  para saltear el RLS, y justamente por eso no devuelve mas de lo que
  muestra la tarjeta: ni el medio de pago, ni el turno, ni fechas de
  cobro.

  Una giftcard que todavia no se cobro devuelve solo el estado. Si no,
  quien la pide podria reenviar la tarjeta completa antes de pagarla.
*/
create or replace function giftcard_publica(p_codigo text)
returns table (
  codigo      text,
  estado      text,
  para        text,
  de          text,
  mensaje     text,
  tratamiento text,
  monto       integer,
  vence_el    date
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.codigo,
    g.estado,
    case when g.estado in ('vigente', 'usada') then g.para end,
    case when g.estado in ('vigente', 'usada') then g.de end,
    case when g.estado in ('vigente', 'usada') then g.mensaje end,
    case when g.estado in ('vigente', 'usada') then g.tratamiento end,
    case when g.estado in ('vigente', 'usada') then g.monto end,
    case when g.estado in ('vigente', 'usada') then g.vence_el end
  from giftcards g
  where g.codigo = upper(trim(p_codigo))
  limit 1;
$$;

revoke all on function giftcard_publica(text) from public, anon, authenticated;
grant execute on function giftcard_publica(text) to anon, authenticated;


-- =====================================================================
--  LISTO.
--
--  Para comprobarlo, con la clave anonima:
--
--      npm run permisos
--
--  Tiene que dar todo en OK: prueba que con la clave publica se puede
--  registrar una giftcard nueva y ver la tarjeta por su codigo, pero no
--  listarlas, ni cambiarlas, ni registrarla ya cobrada.
-- =====================================================================
