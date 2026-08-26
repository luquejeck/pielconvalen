"use client";

import { useCallback, useEffect, useState } from "react";
import BuscadorCliente from "./BuscadorCliente";
import { MEDIOS_DE_PAGO } from "./FormularioCobro";
import TabGastosFijos from "./TabGastosFijos";

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
  medio_pago?: string | null;
};

type ItemInventario = {
  id: string;
  marca: string;
  producto: string;
  costo: number;
  precio_venta: number;
  cantidad: number;
};

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
                <div className="w-full rounded-t-sm bg-borde" style={{ height: "4px" }} />
              ) : (
                <>
                  <div
                    className="w-full rounded-b-sm bg-vino/70"
                    style={{ height: `${alturaTrat}%` }}
                    title={`Tratamientos: ${fmt(v.tratamientos)}`}
                  />
                  <div
                    className="w-full rounded-t-sm bg-vino/35"
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
function TabDashboard({
  todos,
  onRegistrar,
}: {
  todos: Movimiento[];
  onRegistrar: () => void;
}) {
  const mes = mesActual();
  const delMes = todos.filter((m) => m.fecha.startsWith(mes));

  /*
    Cero movimientos se dice, no se disimula. Antes en este caso el panel
    cargaba doce movimientos de ejemplo y mostraba numeros que no eran de
    Valen: ingresos, ticket promedio y un grafico de seis meses, todo
    inventado, con la aclaracion en letra chiquita al final de la
    pantalla.
  */
  if (todos.length === 0) {
    return (
      <div className="rounded-2xl border border-borde bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold text-tinta">
          Todavía no registraste movimientos
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-suave">
          Cuando cargues tu primera venta o tu primer gasto, acá vas a ver los
          ingresos del mes, el ticket promedio y la evolución.
        </p>
        <button
          type="button"
          onClick={onRegistrar}
          className="boton-principal mt-6"
        >
          Registrar el primero
        </button>
      </div>
    );
  }

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
        <div className="col-span-2 rounded-2xl bg-positivo p-5 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">Ingresos totales</p>
          <p className="mt-1 text-3xl font-bold">{fmt(totalIngresos)}</p>
          <div className="mt-3 flex gap-4 text-xs text-white/70">
            <span>Tratamientos <strong className="text-white">{fmt(ingresosTrat)}</strong></span>
            <span>Productos <strong className="text-white">{fmt(ingresosProd)}</strong></span>
          </div>
        </div>
        <div className="rounded-2xl border border-negativo/25 bg-negativo-suave p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-negativo/80">Gastos</p>
          <p className="mt-1 text-2xl font-bold text-negativo">{fmt(totalGastos)}</p>
        </div>
        {/* Si el mes cierra en perdida se invierte la tarjeta: que salte a la vista. */}
        <div className={`rounded-2xl border p-4 ${neto >= 0 ? "border-positivo/25 bg-positivo-suave" : "border-negativo bg-negativo"}`}>
          <p className={`text-xs font-medium uppercase tracking-wide ${neto >= 0 ? "text-positivo/80" : "text-white/75"}`}>
            {neto >= 0 ? "Ganancia neta" : "Pérdida del mes"}
          </p>
          <p className={`mt-1 text-2xl font-bold ${neto >= 0 ? "text-positivo" : "text-white"}`}>{fmt(neto)}</p>
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
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-vino/35" />Productos</span>
          </div>
        </div>
        <GraficoBarras movimientos={todos} />
      </div>
    </div>
  );
}

// ─── Tab: Ingresos ────────────────────────────────────────────────────
type TratamientoDB = { id: string; nombre: string; precio: number };
type ProductoDB = { id: string; marca: string; producto: string; costo: number; precio_venta: number; cantidad: number };

const CATEGORIAS_GASTO = ["Insumos / descartables", "Equipamiento", "Alquiler", "Marketing", "Transporte", "Cursos / formación", "Otro"];

function TabIngresos({ onGuardado }: { onGuardado: () => void }) {
  const [tipo, setTipo] = useState<"tratamiento" | "producto" | "gasto">("tratamiento");
  const [tratamientos, setTratamientos] = useState<TratamientoDB[]>([]);
  const [productos, setProductos] = useState<ProductoDB[]>([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  const [clienteId, setClienteId] = useState<string | null>(null);
  const [selTratamiento, setSelTratamiento] = useState<TratamientoDB | null>(null);
  const [selProducto, setSelProducto] = useState<ProductoDB | null>(null);
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: "",
    monto: "",
    costo: "",
  });
  /* La web promete efectivo, transferencia y Mercado Pago, y el panel no
     registraba ninguno: sin ese dato no se puede cuadrar la caja contra
     lo que efectivamente entro al banco. */
  const [medioPago, setMedioPago] = useState(MEDIOS_DE_PAGO[0]);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* Las rutas ahora pueden contestar 401 con un objeto de error. Sin el
     chequeo, eso entraba como si fuera la lista y el `.map` de abajo
     reventaba la pantalla entera. */
  const listaDe = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  useEffect(() => {
    void Promise.all([
      listaDe("/api/tratamientos"),
      listaDe("/api/inventario"),
    ]).then(([tratos, prods]) => {
      setTratamientos(tratos);
      setProductos(prods);
      setCargandoCatalogo(false);
    });
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const elegirTratamiento = (id: string) => {
    const t = tratamientos.find((x) => x.id === id) ?? null;
    setSelTratamiento(t);
    if (t) setForm((f) => ({ ...f, monto: String(t.precio), descripcion: t.nombre }));
  };

  const elegirProducto = (id: string) => {
    const p = productos.find((x) => x.id === id) ?? null;
    setSelProducto(p);
    if (p) setForm((f) => ({ ...f, monto: String(p.precio_venta), costo: String(p.costo), descripcion: `${p.producto} — ${p.marca}` }));
  };

  const cambiarTipo = (t: "tratamiento" | "producto" | "gasto") => {
    setTipo(t);
    setSelTratamiento(null);
    setSelProducto(null);
    setForm({ fecha: form.fecha, descripcion: "", monto: "", costo: "" });
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const tipoAPI = tipo === "tratamiento" ? "ingreso" : tipo === "producto" ? "venta_producto" : "gasto";
    const categoriaAPI = tipo === "tratamiento"
      ? (selTratamiento?.nombre ?? "Tratamiento")
      : tipo === "producto"
        ? (selProducto?.producto ?? "Producto")
        : form.descripcion.split(" ")[0]; // primera palabra como categoría de gasto

    const res = await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: form.fecha,
        tipo: tipoAPI,
        categoria: categoriaAPI,
        descripcion: form.descripcion,
        monto: parseInt(form.monto),
        /*
          El costo del producto se calculaba, se ponia en el formulario
          y despues se mandaba `null` fijo. Resultado: el "Margen bruto"
          del dashboard daba cero con datos reales —los unicos
          movimientos con costo eran los doce de ejemplo escritos en el
          codigo— y en el flujo de caja no aparecia nunca la linea
          "Costo · Margen".
        */
        costo: tipo === "producto" ? (selProducto?.costo ?? null) : null,
        medio_pago: tipo !== "gasto" ? medioPago : null,
        cliente_id: tipo !== "gasto" ? clienteId : null,
        inventario_id: selProducto?.id ?? null,
      }),
    });

    setGuardando(false);
    if (!res.ok) {
      setError("No se pudo guardar. Revisá tu conexión.");
      return;
    }

    // El nombre se guarda antes de limpiar la seleccion, si no el aviso queda sin producto.
    setAviso(
      tipo === "gasto"
        ? "Gasto registrado."
        : tipo === "producto" && selProducto
          ? `Venta registrada. Stock de ${selProducto.producto} actualizado.`
          : "Venta registrada."
    );
    setSelTratamiento(null);
    setSelProducto(null);
    setForm((f) => ({ ...f, descripcion: "", monto: "", costo: "" }));
    setClienteId(null);
    setTimeout(() => setAviso(null), 3000);

    // El stock del desplegable y el del panel se refrescan juntos.
    setProductos(await listaDe("/api/inventario"));
    onGuardado();
  };

  if (cargandoCatalogo) return <p className="text-center text-tinta-suave">Cargando catálogo…</p>;

  return (
    <div className="rounded-2xl border border-borde bg-white p-5">
      <h3 className="mb-4 text-base font-semibold text-tinta">
        {tipo === "gasto" ? "Registrar gasto" : "Registrar venta"}
      </h3>

      {/* Tipo */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => cambiarTipo("tratamiento")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tipo === "tratamiento" ? "bg-vino text-white" : "border border-borde text-tinta-suave"}`}>
          Tratamiento
        </button>
        <button type="button" onClick={() => cambiarTipo("producto")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tipo === "producto" ? "bg-vino text-white" : "border border-borde text-tinta-suave"}`}>
          Venta de producto
        </button>
        <button type="button" onClick={() => cambiarTipo("gasto")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${tipo === "gasto" ? "bg-tinta text-crema" : "border border-borde text-tinta-suave"}`}>
          Gasto / Costo
        </button>
      </div>

      <form onSubmit={guardar} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Fecha</span>
          <input type="date" value={form.fecha} onChange={set("fecha")}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
        </label>

        {/* Selector desde la DB */}
        {tipo === "tratamiento" ? (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Tratamiento *</span>
            {tratamientos.length === 0 ? (
              <p className="mt-1 rounded-xl border border-vino/20 bg-vino-suave px-3 py-2.5 text-sm text-vino">
                No tenés tratamientos cargados. Agregá uno desde la pestaña Tratamientos.
              </p>
            ) : (
              <select
                required
                value={selTratamiento?.id ?? ""}
                onChange={(e) => elegirTratamiento(e.target.value)}
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              >
                <option value="" disabled>Seleccioná un tratamiento…</option>
                {tratamientos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre} — ${t.precio.toLocaleString("es-AR")}</option>
                ))}
              </select>
            )}
          </label>
        ) : tipo === "producto" ? (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Producto *</span>
            {productos.length === 0 ? (
              <p className="mt-1 rounded-xl border border-vino/20 bg-vino-suave px-3 py-2.5 text-sm text-vino">
                No tenés productos en inventario. Agregá uno desde la pestaña Inventario.
              </p>
            ) : (
              <select
                required
                value={selProducto?.id ?? ""}
                onChange={(e) => elegirProducto(e.target.value)}
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              >
                <option value="" disabled>Seleccioná un producto…</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.cantidad === 0}>
                    {p.producto} ({p.marca}) — ${p.precio_venta.toLocaleString("es-AR")} · Stock: {p.cantidad}
                    {p.cantidad === 0 ? " ❌ Sin stock" : ""}
                  </option>
                ))}
              </select>
            )}
            {selProducto && selProducto.cantidad <= 2 && selProducto.cantidad > 0 && (
              <p className="mt-1 text-xs text-vino">⚠️ Quedan solo {selProducto.cantidad} unidades.</p>
            )}
          </label>
        ) : (
          /* Gasto: no hay nada que elegir del catálogo */
          null
        )}

        {/* Categoría de gasto */}
        {tipo === "gasto" && (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Categoría del gasto</span>
            <select
              value={form.descripcion || CATEGORIAS_GASTO[0]}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
            >
              {CATEGORIAS_GASTO.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        )}

        {/* Clienta solo para ingresos */}
        {tipo !== "gasto" && (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Clienta (opcional)</span>
            <BuscadorCliente key={tipo} onSeleccionar={(c) => setClienteId(c?.id ?? null)} />
          </label>
        )}

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">
            {tipo === "gasto" ? "Detalle del gasto *" : "Observaciones"}
          </span>
          <input type="text" value={tipo === "gasto" ? form.descripcion : form.descripcion} onChange={set("descripcion")}
            required={tipo === "gasto"}
            placeholder={tipo === "gasto" ? "Ej: Agujas 30G caja x100, Ácido hialurónico…" : "Notas adicionales…"}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">
            {tipo === "gasto" ? "Monto gastado *" : "Precio cobrado *"}
          </span>
          <input type="number" min="0" required value={form.monto} onChange={set("monto")}
            placeholder={tipo === "gasto" ? "5000" : "28000"}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
        </label>

        {tipo !== "gasto" && (
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-tinta-suave">Cómo pagó</span>
            <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}
              className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino">
              {MEDIOS_DE_PAGO.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        )}

        {aviso && (
          <p className="rounded-xl bg-vino-suave px-4 py-2.5 text-sm text-vino">
            ✓ {aviso}
          </p>
        )}
        {error && <p className="rounded-xl bg-vino-suave px-4 py-2.5 text-sm text-vino">{error}</p>}

        <button type="submit" disabled={guardando} className="boton-principal w-full disabled:opacity-60">
          {guardando ? "Guardando…" : tipo === "gasto" ? "Registrar gasto" : "Registrar venta"}
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
      {error && <p className="mt-3 rounded-xl bg-vino-suave px-3 py-2 text-sm text-vino">{error}</p>}
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

      {/* Lista de productos — tarjetas en mobile, tabla en desktop */}
      {items.length === 0 ? (
        <p className="rounded-2xl border border-borde bg-white px-4 py-8 text-center text-tinta-suave">
          Sin productos cargados aún.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const margen = item.precio_venta - item.costo;
            const margenPct = item.precio_venta > 0 ? Math.round((margen / item.precio_venta) * 100) : 0;
            const stockBajo = item.cantidad <= 2;

            if (editando?.id === item.id) {
              return (
                <li key={item.id}>
                  <FormProducto
                    form={form} setForm={setForm} guardando={guardando} error={errorGuardar}
                    onSubmit={guardar} onCancelar={cancelar}
                  />
                </li>
              );
            }

            return (
              <li key={item.id} className="rounded-2xl border border-borde bg-white p-4">
                {/* Nombre y marca */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-tinta">{item.producto}</p>
                    <p className="text-xs text-tinta-suave">{item.marca}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${stockBajo ? "bg-vino text-crema" : "bg-crema-oscuro text-tinta-suave"}`}>
                    Stock: {item.cantidad}{stockBajo ? " ⚠️" : ""}
                  </span>
                </div>

                {/* Números en grilla 3 columnas */}
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-crema-oscuro p-3">
                  <div>
                    <p className="text-xs text-tinta-suave">Costo</p>
                    <p className="font-medium text-tinta">{fmt(item.costo)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tinta-suave">Venta</p>
                    <p className="font-medium text-tinta">{fmt(item.precio_venta)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tinta-suave">Margen</p>
                    <p className="font-medium text-vino">{margenPct}%</p>
                  </div>
                </div>

                {/* Acciones */}
                {confirmarElimId === item.id ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-vino/20 bg-vino-suave px-3 py-2">
                    <p className="flex-1 text-sm text-vino">¿Eliminar?</p>
                    <button onClick={() => eliminar(item.id)}
                      className="rounded-full bg-vino px-3 py-1 text-xs text-crema">Sí</button>
                    <button onClick={() => setConfirmarElimId(null)}
                      className="rounded-full border border-vino/25 px-3 py-1 text-xs text-vino">No</button>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => { setEditando(item); setNuevo(false); setForm({ marca: item.marca, producto: item.producto, costo: String(item.costo), precio_venta: String(item.precio_venta), cantidad: String(item.cantidad) }); }}
                      className="rounded-full border border-borde px-4 py-1.5 text-xs text-tinta-suave hover:border-vino hover:text-vino">
                      Editar
                    </button>
                    <button onClick={() => setConfirmarElimId(item.id)}
                      className="rounded-full border border-borde px-4 py-1.5 text-xs text-tinta-suave hover:border-vino/40 hover:text-vino">
                      Eliminar
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
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
    ingreso: "text-positivo bg-positivo-suave",
    venta_producto: "text-positivo bg-positivo-suave",
    gasto: "text-negativo bg-negativo-suave",
    compra_producto: "text-negativo bg-negativo-suave",
  };

  return (
    <div className="space-y-4">
      {/* Selector de mes */}
      <div className="flex items-center gap-3">
        <button onClick={() => setMes(mesAnterior(mes))} className="rounded-full border border-borde px-3 py-1.5 text-sm hover:border-vino hover:text-vino">←</button>
        <span className="font-semibold text-tinta">{formatoMes(mes)}</span>
        <button onClick={() => setMes(mesSiguiente(mes))} className="rounded-full border border-borde px-3 py-1.5 text-sm hover:border-vino hover:text-vino">→</button>
        <span className={`ml-auto text-sm font-semibold ${saldo >= 0 ? "text-positivo" : "text-negativo"}`}>
          Saldo: {fmt(saldo)}
        </span>
      </div>

      {/*
        Para el contador y para el monotributo. Hasta ahora no habia forma
        de sacar los numeros del panel: habia que copiarlos a mano de la
        pantalla.
      */}
      {delMes.length > 0 && (
        <a
          href={`/api/movimientos/exportar?mes=${mes}`}
          download
          className="inline-flex min-h-11 items-center rounded-full border border-borde px-5 text-sm text-tinta-suave hover:border-vino hover:text-vino"
        >
          Bajar {formatoMes(mes)} en planilla
        </a>
      )}

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
                    <span className="text-xs text-tinta-suave">
                      {m.fecha} · {m.categoria}
                      {m.medio_pago ? ` · ${m.medio_pago}` : ""}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-tinta">{m.descripcion}</p>
                  {m.costo && (
                    <p className="text-xs text-tinta-suave">Costo: {fmt(m.costo)} · Margen: {fmt(m.monto - m.costo)}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`text-base font-semibold ${esIngreso(m.tipo) ? "text-positivo" : "text-negativo"}`}>
                    {esIngreso(m.tipo) ? "+" : "-"}{fmt(m.monto)}
                  </span>
                  <button
                    onClick={() => setConfirmarId(confirmarId === m.id ? null : m.id)}
                    className="rounded-full px-3 py-1 text-xs text-tinta-suave hover:bg-vino-suave hover:text-vino"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {/* Confirmación inline */}
              {confirmarId === m.id && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-vino/20 bg-vino-suave px-3 py-2.5">
                  <p className="flex-1 text-sm text-vino">¿Eliminar este movimiento?</p>
                  <button
                    onClick={() => { onEliminar(m.id); setConfirmarId(null); }}
                    className="rounded-full bg-vino px-3 py-1 text-xs font-medium text-crema"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    onClick={() => setConfirmarId(null)}
                    className="rounded-full border border-vino/25 px-3 py-1 text-xs text-vino"
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
type Tab = "dashboard" | "ingresos" | "inventario" | "fijos" | "flujo";

const TABS: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "ingresos", label: "Registrar venta/gasto" },
  { id: "inventario", label: "Inventario" },
  { id: "fijos", label: "Gastos fijos" },
  { id: "flujo", label: "Flujo de caja" },
];

/**
 * Desde que fecha traer movimientos.
 *
 * Antes se pedian TODOS, siempre, y se filtraban en el navegador. Al
 * segundo año eso son miles de filas viajando cada vez que se abre la
 * pestaña. La ventana cubre lo que la pantalla necesita: los seis meses
 * del grafico, y el mes que se este mirando en el flujo de caja si es
 * mas viejo que eso.
 */
function inicioVentana(mes: string): string {
  const hoy = new Date();
  const seisMeses = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);

  const [anio, m] = mes.split("-").map(Number);
  const elegido = new Date(anio, m - 1, 1);

  const desde = elegido < seisMeses ? elegido : seisMeses;
  return `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function PanelEconomia() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [inventario, setInventario] = useState<ItemInventario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mes, setMes] = useState(mesActual());

  const desde = inicioVentana(mes);

  const cargarMovimientos = useCallback(async () => {
    const res = await fetch(`/api/movimientos?desde=${desde}`);
    if (!res.ok) {
      setError("No se pudieron traer los movimientos.");
      return;
    }
    /*
      Lo que devuelve la base es lo que se muestra, aunque sean cero.
      Antes, con la lista vacia, el panel cargaba doce movimientos
      ficticios y mostraba "Ingresos totales $127.000" en una tarjeta
      verde grande, con la aclaracion en letra de 12px al final de todo.
      Una pantalla de plata no puede mostrar plata inventada.
    */
    setMovimientos(await res.json());
    setError(null);
  }, [desde]);

  const cargarInventario = useCallback(async () => {
    const res = await fetch("/api/inventario");
    if (res.ok) setInventario(await res.json());
  }, []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    void Promise.all([cargarMovimientos(), cargarInventario()]).finally(() => {
      if (vigente) setCargando(false);
    });
    return () => {
      vigente = false;
    };
  }, [cargarMovimientos, cargarInventario]);

  const eliminarMovimiento = async (id: string) => {
    const res = await fetch(`/api/movimientos?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
    } else {
      setError("No se pudo borrar el movimiento.");
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

      {tab === "dashboard" && (
        <TabDashboard
          todos={movimientos}
          onRegistrar={() => setTab("ingresos")}
        />
      )}
      {/* Una venta de producto descuenta stock: hay que refrescar las dos cosas. */}
      {tab === "ingresos" && (
        <TabIngresos
          onGuardado={async () => {
            await Promise.all([cargarMovimientos(), cargarInventario()]);
          }}
        />
      )}
      {tab === "inventario" && <TabInventario items={inventario} onActualizar={cargarInventario} />}
      {tab === "fijos" && (
        <TabGastosFijos mes={mes} onVolcado={() => void cargarMovimientos()} />
      )}
      {tab === "flujo" && <TabFlujo todos={movimientos} mes={mes} setMes={setMes} onEliminar={eliminarMovimiento} />}

      {error && (
        <p className="mt-6 rounded-xl bg-negativo-suave px-4 py-3 text-sm text-negativo">
          {error}
        </p>
      )}
    </div>
  );
}
