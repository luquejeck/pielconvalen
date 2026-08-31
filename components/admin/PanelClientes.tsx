"use client";

import { useEffect, useState } from "react";
import { normalizarTelefono } from "@/lib/whatsapp";
import AvisoDuplicado from "./AvisoDuplicado";
import { IconoWhatsApp } from "../iconos";
import ResumenClienta from "./ResumenClienta";

type Cliente = {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento?: string;
  antecedentes?: string;
  notas?: string;
  /* Los calcula /api/clientes en una sola consulta: sin esto, la lista
     era un monton de nombres sin nada que los distinguiera. */
  visitas?: number;
  ultimaVisita?: string | null;
  proximo?: string | null;
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

/** Dias desde una fecha "YYYY-MM-DD" */
function diasDesde(fecha?: string | null) {
  if (!fecha) return null;
  return Math.floor(
    (Date.now() - new Date(`${fecha}T00:00:00`).getTime()) / 86400000
  );
}

/**
 * Como se cuenta el tiempo cuando el numero exacto no importa.
 * "hace 87 dias" obliga a hacer la cuenta; "hace 3 meses" ya es la
 * conclusion.
 */
function haceCuanto(fecha?: string | null) {
  const d = diasDesde(fecha);
  if (d === null) return null;
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  const meses = Math.floor(d / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

/** Iniciales para el circulito: dos letras leen mejor que una. */
function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
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
  /* Cuantas cosas ya cargadas hay cerca de esa fecha para esta clienta. */
  const [duplicados, setDuplicados] = useState(0);

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

          {/* Sus turnos y su plata, que hasta ahora la ficha no mostraba. */}
          <ResumenClienta clienteId={cliente.id} />

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
            {/*
              Lo que ya esté cargado de esta clienta por esos días. Es de
              acá que salió la duplicación real: se anotó la sesión a mano
              y después el cobro del turno generó la suya, así que la
              ficha decía que había venido dos veces el mismo día.
            */}
            <AvisoDuplicado
              clienteId={cliente.id}
              fecha={formSesion.fecha}
              onCambio={setDuplicados}
            />

            <button type="submit" disabled={guardandoSesion} className="boton-principal disabled:opacity-60">
              {guardandoSesion
                ? "Guardando…"
                : duplicados > 0
                  ? "Guardar igual"
                  : "Guardar sesión"}
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
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  /*
    Borrar una clienta se lleva puesto su historial de sesiones —la base
    lo borra en cascada— y desvincula sus turnos y sus pagos. No se puede
    deshacer, asi que el cartel dice exactamente que se pierde en vez de
    un "¿estas segura?" generico que nadie lee.
  */
  const borrar = async (c: Cliente) => {
    setBorrando(c.id);
    setError(null);

    const res = await fetch(`/api/clientes?id=${c.id}`, { method: "DELETE" });
    setBorrando(null);

    if (!res.ok) {
      setError("No se pudo eliminar. Probá de nuevo.");
      return;
    }

    setPorBorrar(null);
    setClientes((prev) => prev.filter((x) => x.id !== c.id));
  };

  /** Tres meses sin venir y sin turno: es a quien conviene escribirle. */
  const sinVenirHace = (c: Cliente) => {
    const d = diasDesde(c.ultimaVisita);
    return d !== null && d >= 90 && !c.proximo;
  };

  const dormidas = clientes.filter(sinVenirHace).length;

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

      {error && (
        <p className="rounded-chico bg-negativo-suave px-4 py-3 text-base text-negativo">
          {error}
        </p>
      )}

      {cargando ? (
        <p className="text-center text-tinta-suave">Cargando…</p>
      ) : clientes.length === 0 ? (
        /* Estado vacio con salida, no un renglon gris en el medio de la
           pantalla que no dice que hacer. */
        <div className="rounded-suave border border-borde bg-white px-6 py-12 text-center">
          <p className="text-lg font-semibold text-tinta">
            {busqueda ? "Ninguna coincide" : "Todavía no cargaste clientas"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-base text-tinta-suave">
            {busqueda
              ? "No hay ninguna con ese nombre."
              : "Acá vas a tener la ficha de cada una: su historial médico, las sesiones que se hizo y cuánto vino gastando."}
          </p>
          {!busqueda && (
            <button
              type="button"
              onClick={() => setNuevaCliente(true)}
              className="boton-principal mt-6"
            >
              Cargar la primera
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm text-tinta-suave">
              {clientes.length === 1 ? "1 clienta" : `${clientes.length} clientas`}
            </p>
            {/* Cuantas hace rato que no vienen: es el dato accionable de
                toda esta pantalla, y antes no figuraba en ningun lado. */}
            {dormidas > 0 && (
              <p className="text-sm font-medium text-vino">
                {dormidas} sin venir hace meses
              </p>
            )}
          </div>

          <ul className="space-y-2.5">
            {clientes.map((c) => {
              const e = edad(c.fecha_nacimiento);
              const dormida = sinVenirHace(c);

              return (
                <li key={c.id} className="tarjeta overflow-hidden">
                  <div className="flex items-stretch">
                    <button
                      onClick={() => setSeleccionada(c)}
                      className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-vino-suave"
                    >
                      {/* Dos iniciales leen mejor que una, y el circulito
                          se apaga si hace rato que no viene. */}
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold ${
                          dormida
                            ? "bg-crema-oscuro text-tinta-suave"
                            : "bg-vino text-crema"
                        }`}
                      >
                        {iniciales(c.nombre)}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-lg font-medium text-tinta">
                          {c.nombre}
                        </span>

                        {/* Cuando vino y cuantas veces. Antes decia el
                            telefono y la edad, que no ayudan a decidir
                            nada mirando la lista. */}
                        <span className="mt-0.5 block truncate text-base text-tinta-suave">
                          {c.visitas
                            ? `${c.visitas} ${c.visitas === 1 ? "visita" : "visitas"} · ${haceCuanto(c.ultimaVisita)}`
                            : "Sin visitas registradas"}
                          {e ? ` · ${e} años` : ""}
                        </span>

                        {c.proximo && (
                          <span className="mt-1.5 inline-block rounded-full bg-vino-suave px-2.5 py-0.5 text-sm font-medium text-vino">
                            Turno el {c.proximo.slice(8, 10)}/{c.proximo.slice(5, 7)}
                          </span>
                        )}
                        {dormida && (
                          <span className="mt-1.5 inline-block rounded-full bg-crema-oscuro px-2.5 py-0.5 text-sm text-tinta-suave">
                            Hace rato que no viene
                          </span>
                        )}
                      </span>

                      <span className="shrink-0 text-xl text-tinta-suave">›</span>
                    </button>

                    {/* Escribirle sin tener que entrar a la ficha */}
                    {c.telefono && (
                      <a
                        href={`https://wa.me/${normalizarTelefono(c.telefono)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Escribirle a ${c.nombre}`}
                        title="Escribirle por WhatsApp"
                        className="flex w-14 shrink-0 items-center justify-center border-l border-borde text-tinta-suave transition-colors hover:bg-vino-suave hover:text-vino"
                      >
                        <IconoWhatsApp className="h-5 w-5" />
                      </a>
                    )}
                  </div>

                  {porBorrar === c.id ? (
                    <div className="border-t border-borde bg-negativo-suave px-4 py-3.5">
                      <p className="text-base font-medium text-negativo">
                        ¿Eliminar a {c.nombre}?
                      </p>
                      <p className="mt-1 text-sm text-tinta">
                        Se borra su ficha y todo su historial de sesiones. Sus
                        turnos y sus pagos quedan, pero sin nombre. No se puede
                        deshacer.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => borrar(c)}
                          disabled={borrando === c.id}
                          className="min-h-11 rounded-full bg-negativo px-5 text-base font-medium text-white disabled:opacity-60"
                        >
                          {borrando === c.id ? "Eliminando…" : "Sí, eliminar"}
                        </button>
                        <button
                          onClick={() => setPorBorrar(null)}
                          className="min-h-11 rounded-full border border-borde bg-white px-5 text-base text-tinta-suave"
                        >
                          No, dejarla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end border-t border-borde px-4 py-2">
                      <button
                        onClick={() => setPorBorrar(c.id)}
                        className="rounded-full px-3 py-1 text-sm text-tinta-suave transition-colors hover:text-negativo"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
