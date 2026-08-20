-- =====================================================================
--  Piel con Valen — vinculación de clientas a turnos y movimientos
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

alter table turnos
  add column if not exists cliente_id uuid references clientes(id) on delete set null;

alter table movimientos
  add column if not exists cliente_id uuid references clientes(id) on delete set null;
