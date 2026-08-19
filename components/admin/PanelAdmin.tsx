"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENDA } from "@/lib/config";
import {
  claveFecha,
  desdeClave,
  formatearFechaLarga,
  sumarDias,
} from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, TRATAMIENTOS } from "@/lib/tratamientos";

type EstadoTurno = "pendiente" | "confirmado" | "bloqueado";

type TurnoDB = {
  id: string;
  fecha: string;
  hora: string;
  estado: EstadoTurno;
  cliente: string | null;
  telefono: string | null;
  tratamiento: string | null;
  precio: number | null;
};

const ETIQUETAS: Record<EstadoTurno, { texto: string; clase: string }> = {
  pendiente: {
    texto: "A confirmar",
    clase: "bg-amber-100 text-amber-900 border-amber-300",
  },
  confirmado: {
    texto: "Confirmado",
    clase: "bg-vino-suave text-vino border-vino/30",
  },
  bloqueado: {
    texto: "Bloqueado",
    clase: "bg-crema-oscuro text-tinta-suave border-borde",
  },
};

export default function PanelAdmin() {
  const router = useRouter();
  const supabase = clienteNavegador();

  const [fecha, setFecha] = useState(() => claveFecha(new Date()));
  const [turnos, setTurnos] = useState<TurnoDB[]>([]);
  const [diaCerrado, setDiaCerrado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);

    const [{ data: filas }, { data: cerrado }] = await Promise.all([
      supabase.from("turnos").select("*").eq("fecha", fecha).order("hora"),
      supabase.from("dias_cerrados").select("fecha").eq("fecha", fecha).maybeSingle(),
    ]);

    setTurnos((filas as TurnoDB[]) ?? []);
    setDiaCerrado(Boolean(cerrado));
    setCargando(false);
  }, [fecha, supabase]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  /* ----------------------------- acciones ----------------------------- */

  const bloquear = async (hora: string) => {
    await supabase.from("turnos").insert({ fecha, hora, estado: "bloqueado" });
    await cargar();
  };

  const borrar = async (id: string) => {
    await supabase.from("turnos").delete().eq("id", id);
    await cargar();
  };

  const confirmar = async (id: string) => {
    await supabase.from("turnos").update({ estado: "confirmado" }).eq("id", id);
    await cargar();
  };

  const alternarDia = async () => {
    if (diaCerrado) {
      await supabase.from("dias_cerrados").delete().eq("fecha", fecha);
    } else {
      await supabase.from("dias_cerrados").insert({ fecha });
    }
    await cargar();
  };

  const salir = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const moverDia = (dias: number) =>
    setFecha(claveFecha(sumarDias(desdeClave(fecha), dias)));

  const turnoDe = (hora: string) => turnos.find((t) => t.hora === hora);
  const horasLibres = AGENDA.horarios.filter((h) => !turnoDe(h));

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-tinta">Agenda</h1>
        <button
          type="button"
          onClick={salir}
          className="rounded-full border border-borde px-5 py-2.5 text-base text-tinta-suave hover:border-vino hover:text-vino"
        >
          Salir
        </button>
      </header>

      {/* Navegacion por dia */}
      <div className="mt-7 flex items-center gap-3">
        <button
          type="button"
          onClick={() => moverDia(-1)}
          aria-label="Día anterior"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8249;
        </button>

        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="min-h-12 grow rounded-2xl border border-borde px-4 text-center text-lg outline-none focus:border-vino"
        />

        <button
          type="button"
          onClick={() => moverDia(1)}
          aria-label="Día siguiente"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borde text-2xl text-vino hover:bg-vino-suave"
        >
          &#8250;
        </button>
      </div>

      <p className="mt-4 text-lg text-tinta-suave">
        {formatearFechaLarga(fecha)}
        {fecha === claveFecha(new Date()) && " · hoy"}
      </p>

      {diaCerrado && (
        <p className="mt-5 rounded-2xl bg-crema-oscuro px-5 py-4 text-lg text-tinta">
          Este día está cerrado. No aparece en la web.
        </p>
      )}

      {/* Horarios */}
      <ul className="mt-6 space-y-3">
        {cargando ? (
          <li className="text-lg text-tinta-suave">Cargando…</li>
        ) : (
          AGENDA.horarios.map((hora) => {
            const turno = turnoDe(hora);

            return (
              <li
                key={hora}
                className={`rounded-2xl border p-5 ${
                  turno ? ETIQUETAS[turno.estado].clase : "border-borde bg-white"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-xl font-semibold">{hora}</span>
                  <span className="text-base">
                    {turno ? ETIQUETAS[turno.estado].texto : "Libre"}
                  </span>
                </div>

                {turno?.cliente && (
                  <p className="mt-2 text-lg">{turno.cliente}</p>
                )}
                {turno?.tratamiento && (
                  <p className="text-base opacity-80">
                    {turno.tratamiento}
                    {turno.precio ? ` · ${formatearPrecio(turno.precio)}` : ""}
                  </p>
                )}
                {turno?.telefono && (
                  <a
                    href={`https://wa.me/${turno.telefono.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base underline"
                  >
                    {turno.telefono}
                  </a>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {!turno && (
                    <button
                      type="button"
                      onClick={() => bloquear(hora)}
                      className="rounded-full border border-borde px-5 py-2.5 text-base hover:border-vino hover:text-vino"
                    >
                      Bloquear
                    </button>
                  )}

                  {turno?.estado === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => confirmar(turno.id)}
                      className="rounded-full bg-vino px-5 py-2.5 text-base text-crema"
                    >
                      Confirmar
                    </button>
                  )}

                  {turno && (
                    <button
                      type="button"
                      onClick={() => borrar(turno.id)}
                      className="rounded-full border border-borde bg-white/60 px-5 py-2.5 text-base hover:border-vino hover:text-vino"
                    >
                      {turno.estado === "bloqueado" ? "Liberar" : "Cancelar"}
                    </button>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>

      {/* Acciones del dia */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMostrarFormulario((v) => !v)}
          disabled={horasLibres.length === 0}
          className="rounded-full bg-vino px-6 py-3 text-base text-crema disabled:opacity-40"
        >
          {mostrarFormulario ? "Cerrar formulario" : "Cargar turno a mano"}
        </button>

        <button
          type="button"
          onClick={alternarDia}
          className="rounded-full border border-borde px-6 py-3 text-base text-tinta-suave hover:border-vino hover:text-vino"
        >
          {diaCerrado ? "Reabrir el día" : "Cerrar el día"}
        </button>
      </div>

      {mostrarFormulario && horasLibres.length > 0 && (
        <FormularioTurno
          fecha={fecha}
          horasLibres={horasLibres}
          onGuardado={async () => {
            setMostrarFormulario(false);
            await cargar();
          }}
        />
      )}
    </main>
  );
}

/* ---------------------------------------------------------------------- */

function FormularioTurno({
  fecha,
  horasLibres,
  onGuardado,
}: {
  fecha: string;
  horasLibres: string[];
  onGuardado: () => void;
}) {
  const supabase = clienteNavegador();
  const [hora, setHora] = useState(horasLibres[0]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tratamientoId, setTratamientoId] = useState(TRATAMIENTOS[0].id);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const tratamiento = TRATAMIENTOS.find((t) => t.id === tratamientoId)!;

    await supabase.from("turnos").insert({
      fecha,
      hora,
      estado: "confirmado",
      cliente: cliente.trim() || null,
      telefono: telefono.trim() || null,
      tratamiento: tratamiento.nombre,
      precio: tratamiento.precio,
    });

    setGuardando(false);
    onGuardado();
  };

  return (
    <form
      onSubmit={guardar}
      className="mt-5 rounded-suave border border-borde bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-base text-tinta-suave">Horario</span>
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          >
            {horasLibres.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">Tratamiento</span>
          <select
            value={tratamientoId}
            onChange={(e) => setTratamientoId(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          >
            {TRATAMIENTOS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombreCorto}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">Nombre</span>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          />
        </label>

        <label className="block">
          <span className="text-base text-tinta-suave">WhatsApp</span>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="5491122943672"
            className="mt-2 min-h-12 w-full rounded-2xl border border-borde px-4 text-lg outline-none focus:border-vino"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={guardando}
        className="boton-principal mt-6 w-full disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Guardar turno"}
      </button>
    </form>
  );
}
