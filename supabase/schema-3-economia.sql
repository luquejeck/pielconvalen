-- =====================================================================
--  Piel con Valen — módulo de economía
--  Pegar en Supabase → SQL Editor → Run (una sola vez)
-- =====================================================================

create table if not exists movimientos (
  id          uuid primary key default gen_random_uuid(),
  fecha       date not null default current_date,
  tipo        text not null,        -- 'ingreso' | 'gasto' | 'compra_producto' | 'venta_producto'
  categoria   text not null,        -- ej: 'turno', 'insumo', 'producto', 'otro'
  descripcion text not null,
  monto       integer not null,     -- en pesos, sin decimales
  creado_en   timestamptz not null default now(),

  constraint tipo_valido check (tipo in ('ingreso', 'gasto', 'compra_producto', 'venta_producto'))
);

create index if not exists movimientos_fecha_idx on movimientos (fecha);

-- Solo Valen (autenticada) puede leer y escribir
alter table movimientos enable row level security;

drop policy if exists "solo autenticada puede ver movimientos" on movimientos;
create policy "solo autenticada puede ver movimientos"
  on movimientos for select
  to authenticated
  using (true);

drop policy if exists "solo autenticada puede insertar movimientos" on movimientos;
create policy "solo autenticada puede insertar movimientos"
  on movimientos for insert
  to authenticated
  with check (true);

drop policy if exists "solo autenticada puede actualizar movimientos" on movimientos;
create policy "solo autenticada puede actualizar movimientos"
  on movimientos for update
  to authenticated
  using (true);

drop policy if exists "solo autenticada puede borrar movimientos" on movimientos;
create policy "solo autenticada puede borrar movimientos"
  on movimientos for delete
  to authenticated
  using (true);
