-- =====================================================================
--  Piel con Valen — el estilo de la giftcard
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  Quien regala puede elegirle el papel a la tarjeta en /giftcard
--  ("Personalizar estilo", opcional). Se guarda el id del estilo
--  —"vino", "rosa", "durazno"...— y la tarjeta, la imagen y el PDF
--  lo dibujan. Los estilos viven en lib/estilos-giftcard.ts.
--
--  SE PUEDE CORRER ANTES O DESPUES DEL CODIGO. Sin esto, la web registra
--  la giftcard igual, sin el estilo, y la tarjeta sale vino.
-- =====================================================================

/* Vacio = la vino de siempre. Un id que el codigo ya no conoce tambien
   se dibuja vino: por eso no hay una lista cerrada aca. */
alter table giftcards
  add column if not exists estilo text
  check (estilo is null or estilo ~ '^[a-z-]{1,30}$');

/*
  LA TARJETA VISTA DESDE AFUERA AHORA TRAE EL ESTILO.

  Es la misma funcion de schema-22 con una columna mas. Cambiar lo que
  devuelve una funcion obliga a borrarla y crearla de nuevo; los
  permisos se vuelven a dar abajo.
*/
drop function if exists giftcard_publica(text);

create function giftcard_publica(p_codigo text)
returns table (
  codigo      text,
  estado      text,
  para        text,
  de          text,
  mensaje     text,
  tratamiento text,
  monto       integer,
  vence_el    date,
  estilo      text
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
    case when g.estado in ('vigente', 'usada') then g.vence_el end,
    case when g.estado in ('vigente', 'usada') then g.estilo end
  from giftcards g
  where g.codigo = upper(trim(p_codigo))
  limit 1;
$$;

revoke all on function giftcard_publica(text) from public, anon, authenticated;
grant execute on function giftcard_publica(text) to anon, authenticated;

-- =====================================================================
--  LISTO. Para comprobarlo: npm run permisos (tiene que dar todo OK).
-- =====================================================================
