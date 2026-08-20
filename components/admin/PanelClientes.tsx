"use client";

import { useEffect, useState } from "react";
import { normalizarTelefono } from "@/lib/whatsapp";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  antecedentes?: string;
  notas?: string;
};

type Sesion = {
  id: string;
  cliente_id: string;
  fecha: string;
  tratamiento: string;
  precio?: number;
  notas?: string;
};

const CAMPOS_FORM = {
  nombre: "",
  telefono: "",
  email: "",
  fecha_nacimiento: "",
  antecedentes: "",
  notas: "",
};

function edad(fechaNac?: string) {
  if (!fechaNac) return null;
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let e = hoy.getFullYear() - nac.getFullYear();
  if (hoy < new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate())) e--;
  return e;
}

function fmt(n?: number) {
  return n ? `$${n.toLocaleString("es-AR")}` : "—";
}

// ─── Formulario de cliente ────────────────────────────────────────────
function FormCliente({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Partial<Cliente>;
  onGuardar: (data: typeof CAMPOS_FORM) => Promise<void>;
  onCancelar: () => void;
}) {
  const [form, setForm] = useState({ ...CAMPOS_FORM, ...inicial });
  const [guardando, setGuardando] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    await onGuardar(form);
    setGuardando(false);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-tinta-suave">Nombre *</span>
          <input
            type="text"
            value={form.nombre}
            onChange={set("nombre")}
            required
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">Teléfono</span>
          <input
            type="tel"
            value={form.telefono}
            onChange={set("telefono")}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">Email</span>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
          />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-suave">Fecha de nacimiento</span>
          <input
            type="date"
            value={form.fecha_nacimiento}
            onChange={set("fecha_nacimiento")}
            className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm text-tinta-suave">Historial médico (alergias, medicamentos, condiciones de piel…)</span>
        <textarea
          rows={3}
          value={form.antecedentes}
          onChange={set("antecedentes")}
          className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
        />
      </label>
      <label className="block">
        <span className="text-sm text-tinta-suave">Notas generales</span>
        <textarea
          rows={2}
          value={form.notas}
          onChange={set("notas")}
          className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino"
        />
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={guardando} className="boton-principal disabled:opacity-60">
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="rounded-full border border-borde px-5 py-2.5 text-base text-tinta-suave hover:border-vino hover:text-vino">
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Ficha individual ─────────────────────────────────────────────────
function FichaCliente({ cliente, onVolver, onActualizar }: {
  cliente: Cliente;
  onVolver: () => void;
  onActualizar: (c: Cliente) => void;
}) {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [nuevaSesion, setNuevaSesion] = useState(false);
  const [formSesion, setFormSesion] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    tratamiento: "",
    precio: "",
    notas: "",
  });
  const [guardandoSesion, setGuardandoSesion] = useState(false);

  const cargarSesiones = async () => {
    setCargando(true);
    const res = await fetch(`/api/sesiones?cliente_id=${cliente.id}`);
    if (res.ok) setSesiones(await res.json());
    setCargando(false);
  };

  useEffect(() => { cargarSesiones(); }, [cliente.id]);

  const guardarCliente = async (data: typeof CAMPOS_FORM) => {
    const res = await fetch(`/api/clientes?id=${cliente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const actualizado = await res.json();
      onActualizar(actualizado);
      setEditando(false);
    }
  };

  const guardarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoSesion(true);
    await fetch("/api/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formSesion, cliente_id: cliente.id }),
    });
    setFormSesion({ fecha: new Date().toISOString().slice(0, 10), tratamiento: "", precio: "", notas: "" });
    setNuevaSesion(false);
    await cargarSesiones();
    setGuardandoSesion(false);
  };

  const eliminarSesion = async (id: string) => {
    if (!confirm("¿Eliminar esta sesión?")) return;
    await fetch(`/api/sesiones?id=${id}`, { method: "DELETE" });
    setSesiones((s) => s.filter((x) => x.id !== id));
  };

  const e = edad(cliente.fecha_nacimiento);

  return (
    <div>
      <button onClick={onVolver} className="mb-5 inline-flex items-center gap-1 text-sm text-tinta-suave hover:text-vino">
        ← Volver a clientas
      </button>

      {editando ? (
        <div className="tarjeta p-5">
          <h3 className="mb-4 text-lg font-semibold text-tinta">Editar datos</h3>
          <FormCliente inicial={cliente} onGuardar={guardarCliente} onCancelar={() => setEditando(false)} />
        </div>
      ) : (
        <div className="tarjeta p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-tinta">{cliente.nombre}</h2>
              {e && <p className="text-sm text-tinta-suave">{e} años</p>}
            </div>
            <button onClick={() => setEditando(true)} className="shrink-0 rounded-full border border-borde px-4 py-2 text-sm text-tinta-suave hover:border-vino hover:text-vino">
              Editar
            </button>
          </div>

          <div className="mt-4 grid gap-2 text-base sm:grid-cols-2">
            {cliente.telefono && (
              <a href={`https://wa.me/${normalizarTelefono(cliente.telefono)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-vino hover:underline">
                📱 {cliente.telefono}
              </a>
            )}
            {cliente.email && <p className="text-tinta-suave">✉️ {cliente.email}</p>}
          </div>

          {cliente.antecedentes && (
            <div className="mt-4 rounded-xl border border-vino/20 bg-vino-suave p-4">
              <p className="text-sm font-medium text-vino">Historial médico</p>
              <p className="mt-1 whitespace-pre-wrap text-base text-tinta">{cliente.antecedentes}</p>
            </div>
          )}

          {cliente.notas && (
            <div className="mt-3 rounded-xl border border-borde bg-crema-oscuro p-4">
              <p className="text-sm font-medium text-tinta-suave">Notas</p>
              <p className="mt-1 whitespace-pre-wrap text-base text-tinta">{cliente.notas}</p>
            </div>
          )}
        </div>
      )}

      {/* Sesiones */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-tinta">Historial de sesiones</h3>
          <button onClick={() => setNuevaSesion((v) => !v)} className="rounded-full border border-borde px-4 py-2 text-sm text-tinta-suave hover:border-vino hover:text-vino">
            {nuevaSesion ? "Cancelar" : "+ Nueva sesión"}
          </button>
        </div>

        {nuevaSesion && (
          <form onSubmit={guardarSesion} className="tarjeta mt-3 space-y-3 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm text-tinta-suave">Fecha</span>
                <input type="date" value={formSesion.fecha} onChange={(e) => setFormSesion((f) => ({ ...f, fecha: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
              </label>
              <label className="block">
                <span className="text-sm text-tinta-suave">Tratamiento *</span>
                <input type="text" required value={formSesion.tratamiento} onChange={(e) => setFormSesion((f) => ({ ...f, tratamiento: e.target.value }))}
                  placeholder="Ej: Limpieza profunda"
                  className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
              </label>
              <label className="block">
                <span className="text-sm text-tinta-suave">Precio</span>
                <input type="number" min="0" value={formSesion.precio} onChange={(e) => setFormSesion((f) => ({ ...f, precio: e.target.value }))}
                  placeholder="15000"
                  className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
              </label>
            </div>
            <label className="block">
              <span className="text-sm text-tinta-suave">Observaciones de la sesión</span>
              <textarea rows={2} value={formSesion.notas} onChange={(e) => setFormSesion((f) => ({ ...f, notas: e.target.value }))}
                placeholder="Reacción, productos usados, seguimiento…"
                className="mt-1 w-full rounded-xl border border-borde px-3 py-2.5 text-base outline-none focus:border-vino" />
            </label>
            <button type="submit" disabled={guardandoSesion} className="boton-principal disabled:opacity-60">
              {guardandoSesion ? "Guardando…" : "Guardar sesión"}
            </button>
          </form>
        )}

        {cargando ? (
          <p className="mt-4 text-center text-tinta-suave">Cargando…</p>
        ) : sesiones.length === 0 ? (
          <p className="mt-4 text-center text-tinta-suave">Sin sesiones registradas aún.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sesiones.map((s) => (
              <li key={s.id} className="rounded-2xl border border-borde bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-tinta">{s.tratamiento}</p>
                    <p className="text-sm text-tinta-suave">{s.fecha} · {fmt(s.precio)}</p>
                  </div>
                  <button onClick={() => eliminarSesion(s.id)} className="rounded-full p-1.5 text-tinta-suave hover:bg-vino-suave hover:text-vino" title="Eliminar">✕</button>
                </div>
                {s.notas && <p className="mt-2 text-sm text-tinta-suave">{s.notas}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────
export default function PanelClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState<Cliente | null>(null);
  const [nuevaCliente, setNuevaCliente] = useState(false);

  const cargar = async (q = "") => {
    setCargando(true);
    const res = await fetch(`/api/clientes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    if (res.ok) setClientes(await res.json());
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(t);
  }, [busqueda]);

  const crearCliente = async (data: typeof CAMPOS_FORM) => {
    const res = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const nueva = await res.json();
      setNuevaCliente(false);
      setSeleccionada(nueva);
      await cargar(busqueda);
    }
  };

  const actualizarEnLista = (actualizado: Cliente) => {
    setClientes((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)));
    setSeleccionada(actualizado);
  };

  if (seleccionada) {
    return (
      <FichaCliente
        cliente={seleccionada}
        onVolver={() => setSeleccionada(null)}
        onActualizar={actualizarEnLista}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Buscador + nueva */}
      <div className="flex gap-2">
        <input
          type="search"
          placeholder="Buscar clienta…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-borde px-4 text-base outline-none focus:border-vino"
        />
        <button onClick={() => setNuevaCliente((v) => !v)} className="boton-principal shrink-0">
          {nuevaCliente ? "Cancelar" : "+ Nueva"}
        </button>
      </div>

      {nuevaCliente && (
        <div className="tarjeta p-5">
          <h3 className="mb-4 text-lg font-semibold text-tinta">Nueva clienta</h3>
          <FormCliente onGuardar={crearCliente} onCancelar={() => setNuevaCliente(false)} />
        </div>
      )}

      {cargando ? (
        <p className="text-center text-tinta-suave">Cargando…</p>
      ) : clientes.length === 0 ? (
        <p className="text-center text-tinta-suave">
          {busqueda ? "Sin resultados." : "Aún no hay clientas cargadas."}
        </p>
      ) : (
        <ul className="space-y-2">
          {clientes.map((c) => {
            const e = edad(c.fecha_nacimiento);
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSeleccionada(c)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-borde bg-white px-4 py-3.5 text-left transition-colors hover:border-vino/40 hover:bg-vino-suave"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-vino/10 text-lg font-semibold text-vino">
                    {c.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-tinta">{c.nombre}</p>
                    <p className="truncate text-sm text-tinta-suave">
                      {[c.telefono, e ? `${e} años` : null].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                    </p>
                  </div>
                  <span className="shrink-0 text-tinta-suave">›</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
