"use client";

import { useEffect, useState } from "react";
import BuscadorCliente from "./BuscadorCliente";

// ─── Tipos ────────────────────────────────────────────────────────────
type Movimiento = {
  id: string;
  fecha: string;
  tipo: "ingreso" | "gasto" | "compra_producto" | "venta_producto";
  categoria: string;
  descripcion: string;
  monto: number;
  costo?: number;
  cliente_id?: string | null;
};

type ItemInventario = {
  id: string;
  marca: string;
  producto: string;
  costo: number;
  precio_venta: number;
  cantidad: number;
};

// ─── Datos simulados (se usan cuando no hay datos reales) ─────────────
const DEMO_MOVIMIENTOS: Movimiento[] = [
  { id: "d1", fecha: "2026-08-19", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Limpieza profunda + Dermaplaning", monto: 28000, costo: 3500 },
  { id: "d2", fecha: "2026-08-18", tipo: "venta_producto", categoria: "Producto", descripcion: "Sérum vitamina C La Roche-Posay", monto: 22000, costo: 12000 },
  { id: "d3", fecha: "2026-08-17", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Microneedling facial", monto: 45000, costo: 5000 },
  { id: "d4", fecha: "2026-08-16", tipo: "gasto", categoria: "Insumos", descripcion: "Ácido hialurónico + agujas descartables", monto: 18000 },
  { id: "d5", fecha: "2026-08-15", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Higiene facial profunda", monto: 22000, costo: 2800 },
  { id: "d6", fecha: "2026-08-14", tipo: "venta_producto", categoria: "Producto", descripcion: "Crema hidratante FPS50", monto: 15000, costo: 8500 },
  { id: "d7", fecha: "2026-08-13", tipo: "gasto", categoria: "Gastos fijos", descripcion: "Alquiler del gabinete", monto: 35000 },
  { id: "d8", fecha: "2026-08-12", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Peeling enzimático", monto: 32000, costo: 4000 },
  { id: "d9", fecha: "2026-07-30", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Limpieza + Hidratación", monto: 25000, costo: 3000 },
  { id: "d10", fecha: "2026-07-25", tipo: "venta_producto", categoria: "Producto", descripcion: "Mascarilla Biocelulosa", monto: 8500, costo: 4200 },
  { id: "d11", fecha: "2026-07-20", tipo: "ingreso", categoria: "Tratamiento", descripcion: "Microneedling + PRP", monto: 58000, costo: 7000 },
  { id: "d12", fecha: "2026-07-15", tipo: "gasto", categoria: "Marketing", descripcion: "Publicidad Instagram", monto: 12000 },
];

const DEMO_INVENTARIO: ItemInventario[] = [
  { id: "i1", marca: "La Roche-Posay", producto: "Sérum vitamina C 10%", costo: 12000, precio_venta: 22000, cantidad: 4 },
  { id: "i2", marca: "Bioderma", producto: "Crema hidratante FPS50", costo: 8500, precio_venta: 15000, cantidad: 7 },
  { id: "i3", marca: "Vichy", producto: "Mascarilla Biocelulosa", costo: 4200, precio_venta: 8500, cantidad: 12 },
  { id: "i4", marca: "Neutrogena", producto: "Contorno de ojos", costo: 6800, precio_venta: 13000, cantidad: 3 },
  { id: "i5", marca: "Avène", producto: "Eau Thermale spray", costo: 3200, precio_venta: 7000, cantidad: 8 },
];

// ─── Helpers ──────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;
const esIngreso = (t: string) => t === "ingreso" || t === "venta_producto";
const esTratamiento = (m: Movimiento) => m.tipo === "ingreso";
const esProducto = (m: Movimiento) => m.tipo === "venta_producto";

function mesActual() {
  const h = new Date();
  return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, "0")}`;
}

function formatoMes(mes: string) {
  const [a, m] = mes.split("-");
  const nombres = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  return `${nombres[parseInt(m) - 1]} ${a}`;
}

function mesAnterior(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function mesSiguiente(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Gráfico de barras (CSS puro) ─────────────────────────────────────
function GraficoBarras({ movimientos }: { movimientos: Movimiento[] }) {
  const meses: Record<string, { tratamientos: number; productos: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses[k] = { tratamientos: 0, productos: 0 };
  }

  movimientos.forEach((m) => {
    const k = m.fecha.slice(0, 7);
    if (!meses[k]) return;
    if (esTratamiento(m)) meses[k].tratamientos += m.monto;
    if (esProducto(m)) meses[k].productos += m.monto;
  });

  const maximo = Math.max(...Object.values(meses).map((v) => v.tratamientos + v.productos), 1);

  return (
    <div className="mt-2 flex h-40 items-end gap-1.5 sm:gap-2">
      {Object.entries(meses).map(([mes, v]) => {
        const total = v.tratamientos + v.productos;
        const alturaTrat = (v.tratamientos / maximo) * 100;
        const alturaProd = (v.productos / maximo) * 100;
        return (
          <div key={mes} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-col-reverse items-stretch" style={{ height: "120px" }}>
              {total === 0 ? (
                <div className="w-full rounded-t-sm bg-gray-100" style={{ height: "4px" }} />
              ) : (
                <>
                  <div
                    className="w-full rounded-b-sm bg-vino/70"
                    style={{ height: `${alturaTrat}%` }}
                    title={`Tratamientos: ${fmt(v.tratamientos)}`}
                  />
                  <div
                    className="w-full rounded-t-sm bg-dorado/80"
                    style={{ height: `${alturaProd}%` }}
                    title={`Productos: ${fmt(v.productos)}`}
                  />
                </>
              )}
            </div>
            <span className="text-center text-xs text-tinta-suave">{formatoMes(mes).slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────
function TabDashboard({ todos }: { todos: Movimiento[] }) {
  const mes = mesActual();
  const delMes = todos.filter((m) => m.fecha.startsWith(mes));

  const ingresosTrat = delMes.filter(esTratamiento).reduce((s, m) => s + m.monto, 0);
  const ingresosProd = delMes.filter(esProducto).reduce((s, m) => s + m.monto, 0);
  const totalIngresos = ingresosTrat + ingresosProd;
  const totalGastos = delMes.filter((m) => !esIngreso(m.tipo)).reduce((s, m) => s + m.monto, 0);
  const neto = totalIngresos - totalGastos;

  const sesionesTot = delMes.filter(esTratamiento).length;
  const ticketPromedio = sesionesTot > 0 ? Math.round(ingresosTrat / sesionesTot) : 0;

  const margenBruto = delMes
    .filter((m) => esIngreso(m.tipo) && m.costo)
    .reduce((s, m) => s + m.monto - (m.costo ?? 0), 0);

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium uppercase tracking-wide text-tinta-suave">
        {formatoMes(mes)}
      </p>

      {/* Cards principales */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 rounded-2xl bg-vino p-5 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Ingresos totales</p>
          <p className="mt-1 text-3xl font-bold">{fmt(totalIngresos)}</p>
          <div className="mt-3 flex gap-4 text-xs text-white/70">
            <span>Tratamientos <strong className="text-white">{fmt(ingresosTrat)}</strong></span>
            <span>Productos <strong className="text-white">{fmt(ingresosProd)}</strong></span>
          </div>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Gastos</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{fmt(totalGastos)}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${neto >= 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Ganancia neta</p>
          <p className={`mt-1 text-2xl font-bold ${neto >= 0 ? "text-emerald-700" : "text-red-600"}`}>{fmt(neto)}</p>
        </div>
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-borde bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Ticket promedio</p>
          <p className="mt-1 text-xl font-bold text-tinta">{fmt(ticketPromedio)}</p>
          <p className="text-xs text-tinta-suave">{sesionesTot} sesiones</p>
        </div>
        <div className="rounded-2xl border border-borde bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Margen bruto</p>
          <p className="mt-1 text-xl font-bold text-tinta">{fmt(margenBruto)}</p>
          <p className="text-xs text-tinta-suave">con costos registrados</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-2xl border border-borde bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-tinta">Evolución mensual</p>
          <div className="flex gap-3 text-xs text-tinta-suave">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-vino/70" />Tratamientos</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-dorado/80" />Productos</span>
          </div>
        </div>
        <GraficoBarras movimientos={todos} />
      </div>
    </div>
  );
}

// ─── Tab: Ingresos ────────────────────────────────────────────────────
const CATEGORIAS_INGRESO = ["Limpieza profunda", "Dermaplaning", "Microneedling", "Peeling", "Hidratación", "Otro tratamiento"];
const CATEGORIAS_PRODUCTO = ["Sérum", "Crema hidratante", "Protector solar", "Mascarilla", "Contorno de ojos", "Otro producto"];

function TabIngresos({ onGuardado }: { onGuardado: () => void }) {
  const [tipo, setTipo] = useState<"tratamiento" | "producto">("tratamiento");
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    clienteNombre: "",
    categoria: CATEGORIAS_INGRESO[0],
    descripcion: "",
    monto: "",
    costo: "",
  });
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const cambiarTipo = (t: "tratamiento" | "producto") => {
    setTipo(t);
    setForm((f) => ({ ...f, categoria: t === "tratamiento" ? CATEGORIAS_INGRESO[0] : CATEGORIAS_PRODUCTO[0] }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: form.fecha,
        tipo: tipo === "tratamiento" ? "ingreso" : "venta_producto",
        categoria: form.categoria,
        descripcion: form.descripcion || form.categoria,
        monto: parseInt(form.monto),
        costo: form.costo ? parseInt(form.costo) : null,
        cliente_id: clienteId,
      }),
    });
    setGuardando(false);
    setOk(true);
    setForm((f) => ({ ...f, descripcion: "", monto: "", costo: "" }));
    setClienteId(null);
    setTimeout(() => setOk(false), 3000);
    onGuardado();
  };

  return (
    <div className="rounded-2xl border border-borde bg-white p-5">
      <h3 className="mb-4 text-base font-semibold text-tinta">Registrar nueva venta</h3>

      {/* Tipo */}
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => cambiarTipo("tratamiento")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tipo === "tratamiento" ? "bg-vino text-white" : "border border-borde text-tinta-suave"}`}
        >
          Tratamiento (servicio)
        </button>
        <button
          type="button"
          onClick={() => cambiarTipo("producto")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tipo === "producto" ? "bg-vino text-white" : "border border-borde text-tinta-suave"}`}
        >
          Producto (retail)
        </button>
      </div>

      <form onSubmit={guardar} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Fecha</span>
            <input type="date" value={form.fecha} onChange={set("fecha")}
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Categoría</span>
            <select value={form.categoria} onChange={set("categoria")}
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino">
              {(tipo === "tratamiento" ? CATEGORIAS_INGRESO : CATEGORIAS_PRODUCTO).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Clienta (opcional)</span>
          <BuscadorCliente
            key={tipo}
            onSeleccionar={(c) => { setClienteId(c?.id ?? null); }}
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Descripción</span>
          <input type="text" value={form.descripcion} onChange={set("descripcion")}
            placeholder={tipo === "tratamiento" ? "Ej: Limpieza profunda + vitamina C" : "Ej: Sérum La Roche-Posay 30ml"}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Precio cobrado *</span>
            <input type="number" min="0" required value={form.monto} onChange={set("monto")}
              placeholder="28000"
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Costo de insumos (opcional)</span>
            <input type="number" min="0" value={form.costo} onChange={set("costo")}
              placeholder="3500"
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
          </label>
        </div>

        {ok && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">✓ Venta registrada correctamente.</p>}

        <button type="submit" disabled={guardando} className="boton-principal w-full disabled:opacity-60">
          {guardando ? "Guardando…" : "Registrar venta"}
        </button>
      </form>
    </div>
  );
}

// ─── Formulario de producto (fuera del componente para evitar remounts) ──
const FORM_INV_VACIO = { marca: "", producto: "", costo: "", precio_venta: "", cantidad: "" };
type FormInvState = typeof FORM_INV_VACIO;

function FormProducto({
  form,
  setForm,
  guardando,
  error,
  onSubmit,
  onCancelar,
}: {
  form: FormInvState;
  setForm: React.Dispatch<React.SetStateAction<FormInvState>>;
  guardando: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancelar: () => void;
}) {
  const set = (k: keyof FormInvState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-borde bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Marca</span>
          <input type="text" required value={form.marca} onChange={set("marca")} placeholder="La Roche-Posay"
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-sm outline-none focus:border-vino" />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Producto</span>
          <input type="text" required value={form.producto} onChange={set("producto")} placeholder="Sérum vitamina C"
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-sm outline-none focus:border-vino" />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Costo</span>
          <input type="number" min="0" required value={form.costo} onChange={set("costo")} placeholder="12000"
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-sm outline-none focus:border-vino" />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Precio de venta</span>
          <input type="number" min="0" required value={form.precio_venta} onChange={set("precio_venta")} placeholder="22000"
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-sm outline-none focus:border-vino" />
        </label>
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Cantidad en stock</span>
          <input type="number" min="0" required value={form.cantidad} onChange={set("cantidad")} placeholder="5"
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-sm outline-none focus:border-vino" />
        </label>
      </div>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={guardando} className="boton-principal disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar}
          className="rounded-full border border-borde px-5 py-2.5 text-sm text-tinta-suave hover:border-vino hover:text-vino">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Tab: Inventario ──────────────────────────────────────────────────
function TabInventario({ items, onActualizar }: { items: ItemInventario[]; onActualizar: () => void }) {
  const [editando, setEditando] = useState<ItemInventario | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [form, setForm] = useState(FORM_INV_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);

  const cancelar = () => { setEditando(null); setNuevo(false); setForm(FORM_INV_VACIO); setErrorGuardar(null); };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorGuardar(null);
    const payload = {
      marca: form.marca,
      producto: form.producto,
      costo: parseInt(form.costo),
      precio_venta: parseInt(form.precio_venta),
      cantidad: parseInt(form.cantidad),
    };
    try {
      const res = editando
        ? await fetch(`/api/inventario?id=${editando.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/inventario", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorGuardar(err.error ?? "No se pudo guardar. Revisá tu conexión.");
        return;
      }
      cancelar();
      await onActualizar();
    } catch {
      setErrorGuardar("Error de red. Intentá de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const [confirmarElimId, setConfirmarElimId] = useState<string | null>(null);

  const eliminar = async (id: string) => {
    await fetch(`/api/inventario?id=${id}`, { method: "DELETE" });
    setConfirmarElimId(null);
    onActualizar();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-tinta-suave">{items.length} productos</p>
        <button onClick={() => { setNuevo((v) => !v); setEditando(null); setForm(FORM_INV_VACIO); setErrorGuardar(null); }}
          className="rounded-full border border-borde px-4 py-2 text-sm text-tinta-suave hover:border-vino hover:text-vino">
          {nuevo ? "Cancelar" : "+ Agregar producto"}
        </button>
      </div>

      {nuevo && (
        <FormProducto
          form={form} setForm={setForm} guardando={guardando} error={errorGuardar}
          onSubmit={guardar} onCancelar={cancelar}
        />
      )}

      {/* Tabla responsive */}
      <div className="overflow-x-auto rounded-2xl border border-borde bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-borde bg-crema-oscuro text-left text-xs font-medium uppercase tracking-wide text-tinta-suave">
              <th className="px-4 py-3">Marca / Producto</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Venta</th>
              <th className="px-4 py-3">Margen</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {items.map((item) => {
              const margen = item.precio_venta - item.costo;
              const margenPct = item.precio_venta > 0 ? Math.round((margen / item.precio_venta) * 100) : 0;
              const stockBajo = item.cantidad <= 2;

              if (editando?.id === item.id) {
                return (
                  <tr key={item.id}>
                    <td colSpan={6} className="px-4 py-3">
                      <FormProducto
                        form={form} setForm={setForm} guardando={guardando} error={errorGuardar}
                        onSubmit={guardar} onCancelar={cancelar}
                      />
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.id} className="hover:bg-crema/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-tinta">{item.producto}</p>
                    <p className="text-xs text-tinta-suave">{item.marca}</p>
                  </td>
                  <td className="px-4 py-3 text-tinta">{fmt(item.costo)}</td>
                  <td className="px-4 py-3 font-medium text-tinta">{fmt(item.precio_venta)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-emerald-700">{fmt(margen)}</span>
                    <span className="ml-1 text-xs text-tinta-suave">({margenPct}%)</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${stockBajo ? "text-red-600" : "text-tinta"}`}>
                      {item.cantidad} {stockBajo && "⚠️"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {confirmarElimId === item.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => eliminar(item.id)}
                          className="rounded-full bg-red-600 px-3 py-1 text-xs text-white">Sí</button>
                        <button onClick={() => setConfirmarElimId(null)}
                          className="rounded-full border border-borde px-3 py-1 text-xs text-tinta-suave">No</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setEditando(item); setNuevo(false); setForm({ marca: item.marca, producto: item.producto, costo: String(item.costo), precio_venta: String(item.precio_venta), cantidad: String(item.cantidad) }); }}
                          className="rounded-full border border-borde px-3 py-1 text-xs hover:border-vino hover:text-vino">
                          Editar
                        </button>
                        <button onClick={() => setConfirmarElimId(item.id)}
                          className="rounded-full border border-borde px-3 py-1 text-xs hover:border-red-300 hover:text-red-600">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-tinta-suave">Sin productos cargados aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Flujo de caja ───────────────────────────────────────────────
function TabFlujo({ todos, mes, setMes, onEliminar }: {
  todos: Movimiento[];
  mes: string;
  setMes: (m: string) => void;
  onEliminar: (id: string) => void;
}) {
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const delMes = todos.filter((m) => m.fecha.startsWith(mes));
  const saldo = delMes.reduce((s, m) => s + (esIngreso(m.tipo) ? m.monto : -m.monto), 0);

  const ETIQUETAS: Record<string, string> = {
    ingreso: "Tratamiento",
    venta_producto: "Producto",
    gasto: "Gasto",
    compra_producto: "Compra",
  };
  const COLORES: Record<string, string> = {
    ingreso: "text-emerald-700 bg-emerald-50",
    venta_producto: "text-blue-700 bg-blue-50",
    gasto: "text-red-700 bg-red-50",
    compra_producto: "text-orange-700 bg-orange-50",
  };

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMes(mesAnterior(mes))} className="rounded-full border border-borde px-3 py-1.5 text-sm hover:border-vino hover:text-vino">←</button>
        <span className="font-semibold text-tinta">{formatoMes(mes)}</span>
        <button onClick={() => setMes(mesSiguiente(mes))} className="rounded-full border border-borde px-3 py-1.5 text-sm hover:border-vino hover:text-vino">→</button>
        <span className={`ml-auto text-sm font-semibold ${saldo >= 0 ? "text-emerald-700" : "text-red-600"}`}>
          Saldo: {fmt(saldo)}
        </span>
      </div>

      {/* Lista */}
      {delMes.length === 0 ? (
        <p className="text-center text-tinta-suave">Sin movimientos este mes.</p>
      ) : (
        <ul className="space-y-2">
          {delMes.map((m) => (
            <li key={m.id} className="rounded-2xl border border-borde bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORES[m.tipo] ?? "bg-crema-oscuro text-tinta-suave"}`}>
                      {ETIQUETAS[m.tipo] ?? m.tipo}
                    </span>
                    <span className="text-xs text-tinta-suave">{m.fecha} · {m.categoria}</span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-tinta">{m.descripcion}</p>
                  {m.costo && (
                    <p className="text-xs text-tinta-suave">Costo: {fmt(m.costo)} · Margen: {fmt(m.monto - m.costo)}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`text-base font-semibold ${esIngreso(m.tipo) ? "text-emerald-700" : "text-red-600"}`}>
                    {esIngreso(m.tipo) ? "+" : "-"}{fmt(m.monto)}
                  </span>
                  <button
                    onClick={() => setConfirmarId(confirmarId === m.id ? null : m.id)}
                    className="rounded-full px-3 py-1 text-xs text-tinta-suave hover:bg-red-50 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Confirmación inline */}
              {confirmarId === m.id && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                  <p className="flex-1 text-sm text-red-700">¿Eliminar este movimiento?</p>
                  <button
                    onClick={() => { onEliminar(m.id); setConfirmarId(null); }}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setConfirmarId(null)}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────
type Tab = "dashboard" | "ingresos" | "inventario" | "flujo";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ingresos", label: "Registrar venta" },
  { id: "inventario", label: "Inventario" },
  { id: "flujo", label: "Flujo de caja" },
];

export default function PanelEconomia() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mes, setMes] = useState(mesActual());

  const cargarMovimientos = async () => {
    const res = await fetch("/api/movimientos");
    if (res.ok) {
      const data: Movimiento[] = await res.json();
      setMovimientos(data.length > 0 ? data : DEMO_MOVIMIENTOS);
    }
  };

  const cargarInventario = async () => {
    const res = await fetch("/api/inventario");
    if (res.ok) {
      setInventario(await res.json());
    }
  };

  const cargarTodo = async () => {
    setCargando(true);
    await Promise.all([cargarMovimientos(), cargarInventario()]);
    setCargando(false);
  };

  useEffect(() => { cargarTodo(); }, []);

  const eliminarMovimiento = async (id: string) => {
    if (id.startsWith("d")) {
      alert("Este es un dato de ejemplo y no se puede eliminar. Registrá tu primera venta real para reemplazarlos.");
      return;
    }
    if (!confirm("¿Eliminar este movimiento?")) return;
    const res = await fetch(`/api/movimientos?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } else {
      alert("No se pudo eliminar. Intentá de nuevo.");
    }
  };

  if (cargando) return <p className="text-center text-tinta-suave">Cargando…</p>;

  return (
    <div style={{ fontFamily: "var(--font-admin)" }}>
      {/* Tabs */}
      <div className="-mx-5 overflow-x-auto px-5">
        <div className="mb-5 flex gap-2 pb-1" style={{ width: "max-content" }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                tab === id ? "bg-tinta text-white" : "border border-borde text-tinta-suave hover:border-tinta hover:text-tinta"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "dashboard" && <TabDashboard todos={movimientos} />}
      {tab === "ingresos" && <TabIngresos onGuardado={cargarMovimientos} />}
      {tab === "inventario" && <TabInventario items={inventario} onActualizar={cargarInventario} />}
      {tab === "flujo" && <TabFlujo todos={movimientos} mes={mes} setMes={setMes} onEliminar={eliminarMovimiento} />}

      {movimientos === DEMO_MOVIMIENTOS && (
        <p className="mt-6 text-center text-xs text-tinta-suave">
          * Datos de ejemplo. Los reales aparecerán cuando registres tu primera venta.
        </p>
      )}
    </div>
  );
}
