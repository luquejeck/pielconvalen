"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Agenda } from "@/lib/config";
import { clienteNavegador } from "@/lib/supabase";

const DIAS = [
  { valor: 1, nombre: "Lunes" },
  { valor: 2, nombre: "Martes" },
  { valor: 3, nombre: "Miércoles" },
  { valor: 4, nombre: "Jueves" },
  { valor: 5, nombre: "Viernes" },
  { valor: 6, nombre: "Sábado" },
  { valor: 0, nombre: "Domingo" },
];

export default function EditorAgenda({ agenda }: { agenda: Agenda }) {
  const router = useRouter();
  const supabase = clienteNavegador();

  const [dias, setDias] = useState<number[]>(agenda.diasHabiles);
  const [horarios, setHorarios] = useState<string[]>(agenda.horarios);
  const [anticipacion, setAnticipacion] = useState(
    String(agenda.anticipacionMinimaHs)
  );
  const [ventana, setVentana] = useState(String(agenda.ventanaDias));
  const [pasos, setPasos] = useState(agenda.pasosBase.join("\n"));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const alternarDia = (valor: number) =>
    setDias((actuales) =>
      actuales.includes(valor)
        ? actuales.filter((d) => d !== valor)
        : [...actuales, valor].sort()
    );

  const cambiarHorario = (i: number, valor: string) =>
    setHorarios((actuales) => actuales.map((h, j) => (j === i ? valor : h)));

  const quitarHorario = (i: number) =>
    setHorarios((actuales) => actuales.filter((_, j) => j !== i));

  const agregarHorario = () =>
    setHorarios((actuales) => [...actuales, "10:00"]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);

    const { error } = await supabase
      .from("agenda")
      .update({
        dias_habiles: dias,
        horarios: [...horarios].sort(),
        anticipacion_horas: Number(anticipacion) || 0,
        ventana_dias: Number(ventana) || 30,
        pasos_base: pasos
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean),
      })
      .eq("id", 1);

    setGuardando(false);
    setMensaje(error ? "No se pudo guardar." : "Guardado.");
    if (!error) router.refresh();
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {/* Dias */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">Días que atendés</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {DIAS.map(({ valor, nombre }) => {
            const activo = dias.includes(valor);
            return (
              <button
                key={valor}
                type="button"
                onClick={() => alternarDia(valor)}
                aria-pressed={activo}
                className={`min-h-12 rounded-full px-5 text-base transition-colors ${
                  activo
                    ? "bg-vino text-white"
                    : "border border-borde bg-white text-tinta-suave"
                }`}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      </section>

      {/* Horarios */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">
          Horarios de cada día
        </h2>
        <p className="mt-1 text-base text-tinta-suave">
          Son las horas en que empieza cada turno. Hoy hay {horarios.length} por
          día.
        </p>

        <ul className="mt-4 space-y-2">
          {horarios.map((h, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="time"
                value={h}
                onChange={(e) => cambiarHorario(i, e.target.value)}
                className="min-h-12 grow rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
              />
              <button
                type="button"
                onClick={() => quitarHorario(i)}
                aria-label={`Quitar el turno de las ${h}`}
                className="min-h-12 rounded-full border border-borde px-5 text-base text-tinta-suave hover:border-vino hover:text-vino"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={agregarHorario}
          className="mt-3 min-h-12 rounded-full border border-vino px-6 text-base text-vino hover:bg-vino hover:text-white"
        >
          Agregar horario
        </button>
      </section>

      {/* Reglas */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">Reglas de reserva</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-base text-tinta">
              Anticipación mínima (horas)
            </span>
            <input
              type="number"
              min={0}
              value={anticipacion}
              onChange={(e) => setAnticipacion(e.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base outline-none focus:border-vino"
            />
            <span className="text-sm text-tinta-suave">
              No se puede reservar con menos tiempo que este
            </span>
          </label>

          <label className="block">
            <span className="text-base text-tinta">
              Se puede reservar hasta (días)
            </span>
            <input
              type="number"
              min={1}
              value={ventana}
              onChange={(e) => setVentana(e.target.value)}
              className="mt-1.5 min-h-12 w-full rounded-2xl border border-borde bg-white px-4 text-base outline-none focus:border-vino"
            />
            <span className="text-sm text-tinta-suave">
              Cuántos días hacia adelante se abre la agenda
            </span>
          </label>
        </div>
      </section>

      {/* Pasos base */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">
          Pasos que incluyen todos los tratamientos
        </h2>
        <p className="mt-1 text-base text-tinta-suave">Uno por renglón.</p>
        <textarea
          value={pasos}
          onChange={(e) => setPasos(e.target.value)}
          rows={8}
          className="mt-3 w-full rounded-2xl border border-borde bg-white px-4 py-3 text-base text-tinta outline-none focus:border-vino"
        />
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={guardando}
          className="min-h-13 rounded-full bg-vino px-8 text-base text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {mensaje && <p className="text-base text-tinta-suave">{mensaje}</p>}
      </div>
    </form>
  );
}
