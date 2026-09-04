-- =====================================================================
--  Piel con Valen — videos propios en la galería
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
--
--  POR QUE UNA COLUMNA Y NO UNA TABLA NUEVA
--
--  Un video de la seccion "Cómo es una sesión" es exactamente lo mismo
--  que una foto de la galeria: un archivo en el bucket `casos`, con
--  titulo, orden y un interruptor de publicado. Lo unico que cambia es
--  con que etiqueta se muestra. Una tabla aparte seria la misma tabla
--  escrita dos veces, con su propia API y su propia pantalla en el
--  panel.
--
--  Las filas que ya existen quedan como 'foto', que es lo que son.
-- =====================================================================

alter table galeria
  add column if not exists tipo text not null default 'foto';

alter table galeria
  drop constraint if exists galeria_tipo_valido;

alter table galeria
  add constraint galeria_tipo_valido check (tipo in ('foto', 'video'));

-- La web pide siempre por tipo + publicado + orden, en ese orden.
create index if not exists galeria_tipo_idx
  on galeria (tipo, publicado, orden);

-- =====================================================================
--  LISTO.
-- =====================================================================
