"use client";

import { useCallback, useEffect, useState } from "react";
import type { Agenda } from "@/lib/config";
import {
  claveFecha,
  desdeClave,
  formatearFechaLarga,
  sumarDias,
} from "@/lib/fechas";
import { clienteNavegador } from "@/lib/supabase";
import { formatearPrecio, type Tratamiento } from "@/lib/tratamientos";

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

type Props = { tratamientos: Tratamiento[]; agenda: Agenda };

export default function PanelAdmin({ tratamientos, agenda }: Props) {
  const supabase = clienteNavegador();

  const [fecha, setFecha] = useState(() => claveFecha(new Date()));
  const [turnos, setTurnos] = useState<TurnoDB[]>([]);
  const [diaCerrado, setDiaCerrado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  /** id del turno que se esta reprogramando, si hay alguno */
  const [moviendo, setMoviendo] = useState<string | null>(null);

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

  const moverDia = (dias: number) =>
    setFecha(claveFecha(sumarDias(desdeClave(fecha), dias)));

  const turnoDe = (hora: string) => turnos.find((t) => t.hora === hora);
  const horasLibres = agenda.horarios.filter((h) => !turnoDe(h));

  return (
    <section>
      {/* Navegacion por dia */}
      <div className="flex items-center gap-3">
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
          agenda.horarios.map((hora) => {
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

                  {turno && turno.estado !== "bloqueado" && (
                    <button
                      type="button"
                      onClick={() =>
                        setMoviendo(moviendo === turno.id ? null : turno.id)
                      }
                      className="rounded-full border border-borde bg-white/60 px-5 py-2.5 text-base hover:border-vino hover:text-vino"
                    >
                      {moviendo === turno.id ? "Cerrar" : "Mover"}
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

                {turno && moviendo === turno.id && (
                  <FormularioMover
                    turno={turno}
                    agenda={agenda}
                    onListo={async () => {
                      setMoviendo(null);
                      await cargar();
                    }}
                  />
                )}
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
          tratamientos={tratamientos}
          onGuardado={async () => {
            setMostrarFormulario(false);
            await cargar();
          }}
        />
      )}
    </section>
  );
}

/* ---------------------------------------------------------------------- */

function FormularioTurno({
  fecha,
  horasLibres,
  tratamientos,
  onGuardado,
}: {
  fecha: string;
  horasLibres: string[];
  tratamientos: Tratamiento[];
  onGuardado: () => void;
}) {
  const supabase = clienteNavegador();
  const [hora, setHora] = useState(horasLibres[0]);
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [tratamientoId, setTratamientoId] = useState(tratamientos[0]?.id ?? "");
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const tratamiento = tratamientos.find((t) => t.id === tratamientoId);

    await supabase.from("turnos").insert({
      fecha,
      hora,
      estado: "confirmado",
      cliente: cliente.trim() || null,
      telefono: telefono.trim() || null,
      tratamiento: tratamiento?.nombre ?? null,
      precio: tratamiento?.precio ?? null,
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
            {tratamientos.map((t) => (
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

/* ---------------------------------------------------------------------- */

/**
 * Reprograma un turno conservando los datos de la clienta.
 * Antes habia que cancelarlo y volver a cargarlo a mano, con el riesgo
 * de perder el nombre y el telefono en el medio.
 */
function FormularioMover({
  turno,
  agenda,
  onListo,
}: {
  turno: TurnoDB;
  agenda: Agenda;
  onListo: () => void;
}) {
  const supabase = clienteNavegador();
  const [fecha, setFecha] = useState(turno.fecha);
  const [hora, setHora] = useState(turno.hora);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const mover = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const { error } = await supabase
      .from("turnos")
      .update({ fecha, hora })
      .eq("id", turno.id);

    setGuardando(false);

    if (error) {
      // 23505 = ya existe un turno en esa fecha y hora
      setError(
        error.code === "23505"
          ? "Ese horario ya está ocupado. Probá con otro."
          : "No se pudo mover el turno."
      );
      return;
    }

    onListo();
  };

  return (
    <form onSubmit={mover} className="mt-4 border-t border-current/15 pt-4">
      <p className="text-base">Mover a:</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
          className="min-h-12 grow rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
        />

        <select
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          className="min-h-12 rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
        >
          {agenda.horarios.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-2 text-base text-vino">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-3 min-h-12 w-full rounded-full bg-vino px-6 text-base text-white disabled:opacity-60"
      >
        {guardando ? "Moviendo…" : "Confirmar cambio"}
      </button>
    </form>
  );
}
