"use client";

import { useEffect, useState } from "react";

type Movimiento = {
  id: string;
  fecha: string;
  tipo: "ingreso" | "gasto" | "compra_producto" | "venta_producto";
  categoria: string;
  descripcion: string;
  monto: number;
};

const TIPOS = [
  { valor: "ingreso", label: "Ingreso por turno", color: "text-emerald-700 bg-emerald-50" },
  { valor: "venta_producto", label: "Venta de producto", color: "text-blue-700 bg-blue-50" },
  { valor: "gasto", label: "Gasto / egreso", color: "text-red-700 bg-red-50" },
  { valor: "compra_producto", label: "Compra de producto", color: "text-orange-700 bg-orange-50" },
];

const CATEGORIAS: Record<string, string[]> = {
  ingreso: ["Turno facial", "Turno corporal", "Otro turno"],
  venta_producto: ["Crema", "Sérum", "Mascarilla", "Otro producto"],
  gasto: ["Alquiler", "Servicios", "Marketing", "Transporte", "Otro"],
  compra_producto: ["Insumos", "Equipamiento", "Productos reventa", "Otro"],
};

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

function formatoMes(mes: string) {
  const [anio, m] = mes.split("-");
  const nombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${nombres[parseInt(m) - 1]} ${anio}`;
}

function colorTipo(tipo: string) {
  return TIPOS.find((t) => t.valor === tipo)?.color ?? "text-tinta-suave bg-crema-oscuro";
}

function labelTipo(tipo: string) {
  return TIPOS.find((t) => t.valor === tipo)?.label ?? tipo;
}

function signo(tipo: string) {
  return tipo === "gasto" || tipo === "compra_producto" ? -1 : 1;
}

export default function PanelEconomia() {
  const [mes, setMes] = useState(mesActual());
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tipo: "ingreso" as Movimiento["tipo"],
    categoria: "Turno facial",
    descripcion: "",
    monto: "",
  });

  const cargar = async (m: string) => {
    setCargando(true);
    const res = await fetch(`/api/movimientos?mes=${m}`);
    if (res.ok) setMovimientos(await res.json());
    setCargando(false);
  };

  useEffect(() => { cargar(mes); }, [mes]);

  const handleTipo = (tipo: Movimiento["tipo"]) => {
    setForm((f) => ({ ...f, tipo, categoria: CATEGORIAS[tipo][0] }));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.monto || isNaN(Number(form.monto))) return;
    setGuardando(true);
    await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, monto: parseInt(form.monto) }),
    });
    setForm((f) => ({ ...f, descripcion: "", monto: "" }));
    setMostrarForm(false);
    await cargar(mes);
    setGuardando(false);
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    await fetch(`/api/movimientos?id=${id}`, { method: "DELETE" });
    setMovimientos((prev) => prev.filter((m) => m.id !== id));
  };

  // Resumen
  const ingresos = movimientos.filter((m) => signo(m.tipo) > 0).reduce((s, m) => s + m.monto, 0);
  const gastos = movimientos.filter((m) => signo(m.tipo) < 0).reduce((s, m) => s + m.monto, 0);
  const neto = ingresos - gastos;

  const fmt = (n: number) => `$${n.toLocaleString("es-AR")}`;

  return (
    <div className="space-y-6">
      {/* Selector de mes */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            const [a, m] = mes.split("-").map(Number);
            const prev = new Date(a, m - 2, 1);
            setMes(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="rounded-full border border-borde px-4 py-2 text-sm hover:border-vino hover:text-vino"
        >←</button>
        <span className="text-lg font-semibold text-tinta">{formatoMes(mes)}</span>
        <button
          onClick={() => {
            const [a, m] = mes.split("-").map(Number);
            const next = new Date(a, m, 1);
            setMes(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`);
          }}
          className="rounded-full border border-borde px-4 py-2 text-sm hover:border-vino hover:text-vino"
        >→</button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">Ingresos</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-800">{fmt(ingresos)}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Gastos</p>
          <p className="mt-1 text-2xl font-semibold text-red-800">{fmt(gastos)}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${neto >= 0 ? "border-vino/20 bg-vino-suave" : "border-red-200 bg-red-50"}`}>
          <p className="text-sm text-tinta-suave">Ganancia neta</p>
          <p className={`mt-1 text-2xl font-semibold ${neto >= 0 ? "text-vino" : "text-red-700"}`}>{fmt(neto)}</p>
        </div>
      </div>

      {/* Botón nuevo movimiento */}
      <button
        onClick={() => setMostrarForm((v) => !v)}
        className="boton-principal"
      >
        {mostrarForm ? "Cancelar" : "+ Nuevo movimiento"}
      </button>

      {/* Formulario */}
      {mostrarForm && (
        <form onSubmit={guardar} className="tarjeta space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {TIPOS.map((t) => (
              <button
                key={t.valor}
                type="button"
                onClick={() => handleTipo(t.valor as Movimiento["tipo"])}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  form.tipo === t.valor ? t.color + " ring-2 ring-offset-1 ring-current" : "border border-borde text-tinta-suave"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-tinta-suave">Fecha</span>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
            <label className="block">
              <span className="text-sm text-tinta-suave">Categoría</span>
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              >
                {(CATEGORIAS[form.tipo] ?? []).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-tinta-suave">Descripción</span>
              <input
                type="text"
                value={form.descripcion}
                onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                placeholder="Ej: limpieza profunda, sérum vitamina C…"
                required
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
            <label className="block">
              <span className="text-sm text-tinta-suave">Monto (pesos)</span>
              <input
                type="number"
                min="0"
                value={form.monto}
                onChange={(e) => setForm((f) => ({ ...f, monto: e.target.value }))}
                placeholder="15000"
                required
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
              />
            </label>
          </div>

          <button type="submit" disabled={guardando} className="boton-principal disabled:opacity-60">
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </form>
      )}

      {/* Lista */}
      {cargando ? (
        <p className="text-center text-tinta-suave">Cargando…</p>
      ) : movimientos.length === 0 ? (
        <p className="text-center text-tinta-suave">Sin movimientos este mes.</p>
      ) : (
        <ul className="space-y-2">
          {movimientos.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-borde bg-white px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorTipo(m.tipo)}`}>
                    {labelTipo(m.tipo)}
                  </span>
                  <span className="text-xs text-tinta-suave">{m.fecha} · {m.categoria}</span>
                </div>
                <span className="mt-0.5 truncate text-base text-tinta">{m.descripcion}</span>
              </div>
              <span className={`shrink-0 text-lg font-semibold ${signo(m.tipo) > 0 ? "text-emerald-700" : "text-red-700"}`}>
                {signo(m.tipo) > 0 ? "+" : "-"}{fmt(m.monto)}
              </span>
              <button
                onClick={() => eliminar(m.id)}
                className="shrink-0 rounded-full p-1.5 text-tinta-suave hover:bg-red-50 hover:text-red-600"
                title="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
