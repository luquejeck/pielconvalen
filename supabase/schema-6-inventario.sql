-- =====================================================================
--  Piel con Valen — inventario de productos de reventa
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

-- Campo costo en movimientos (para calcular margen real de cada venta)
alter table movimientos
  add column if not exists costo integer default null;

-- Tabla de inventario
create table if not exists inventario (
  id            uuid primary key default gen_random_uuid(),
  marca         text not null,
  producto      text not null,
  costo         integer not null default 0,   -- precio de compra
  precio_venta  integer not null default 0,   -- precio al público
  cantidad      integer not null default 0,
  creado_en     timestamptz not null default now()
);

alter table inventario enable row level security;

drop policy if exists "inventario: solo autenticada" on inventario;
create policy "inventario: solo autenticada"
  on inventario for all to authenticated using (true) with check (true);
