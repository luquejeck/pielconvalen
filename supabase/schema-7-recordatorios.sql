-- =====================================================================
--  Piel con Valen — recordatorios de turno
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

-- Marca cuando Valen ya le mando el recordatorio a esa clienta.
-- Sirve para no escribirle dos veces cuando revisa la lista varias veces.
alter table turnos
  add column if not exists recordado_en timestamptz default null;
