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

const nombreDe = (valor: number) =>
  DIAS.find((d) => d.valor === valor)?.nombre ?? "";

export default function EditorAgenda({ agenda }: { agenda: Agenda }) {
  const router = useRouter();
  const supabase = clienteNavegador();

  const [dias, setDias] = useState<number[]>(agenda.diasHabiles);

  /**
   * Los horarios de cada dia, por separado.
   *
   * Antes era una sola lista para toda la semana: si un dia entraba mas
   * tarde o el sabado cortaba al mediodia, no habia forma de decirlo.
   */
  const [horarios, setHorarios] = useState<Record<number, string[]>>({
    ...agenda.horariosPorDia,
  });

  const [anticipacion, setAnticipacion] = useState(
    String(agenda.anticipacionMinimaHs)
  );
  const [ventana, setVentana] = useState(String(agenda.ventanaDias));
  const [comoTrabajo, setComoTrabajo] = useState(agenda.comoTrabajo);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(
    null
  );

  const horasDe = (dia: number) => horarios[dia] ?? [];

  const alternarDia = (valor: number) => {
    if (dias.includes(valor)) {
      setDias(dias.filter((d) => d !== valor));
      return;
    }

    /*
      Un dia que se abre arranca con los horarios del primer dia que ya
      atiende: casi siempre se parecen y asi no hay que cargarlos de
      cero. Si es el primero de todos, arranca con uno solo.
    */
    const modelo = dias.length ? horasDe(dias[0]) : [];
    if (horasDe(valor).length === 0) {
      setHorarios({
        ...horarios,
        [valor]: modelo.length ? [...modelo] : ["10:00"],
      });
    }
    setDias([...dias, valor].sort((a, b) => a - b));
  };

  const cambiarHorario = (dia: number, i: number, valor: string) =>
    setHorarios((actuales) => ({
      ...actuales,
      [dia]: (actuales[dia] ?? []).map((h, j) => (j === i ? valor : h)),
    }));

  const quitarHorario = (dia: number, i: number) =>
    setHorarios((actuales) => ({
      ...actuales,
      [dia]: (actuales[dia] ?? []).filter((_, j) => j !== i),
    }));

  const agregarHorario = (dia: number) =>
    setHorarios((actuales) => ({
      ...actuales,
      [dia]: [...(actuales[dia] ?? []), "10:00"],
    }));

  /** Para no cargar seis horarios seis veces cuando la semana se repite. */
  const copiarALosDemas = (dia: number) =>
    setHorarios((actuales) => {
      const copia = { ...actuales };
      for (const otro of dias) {
        if (otro !== dia) copia[otro] = [...(actuales[dia] ?? [])];
      }
      return copia;
    });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();

    /*
      Un dia marcado sin ningun horario no es un dia de trabajo: en la web
      no aparece nunca y en el panel se lee como un dia vacio, que es
      justo lo contrario de lo que ella quiso decir. Se avisa en vez de
      guardarlo a medias.
    */
    const vacios = dias.filter((d) => horasDe(d).length === 0);
    if (vacios.length > 0) {
      setAviso({
        texto: `Marcaste ${vacios
          .map(nombreDe)
          .join(", ")} sin ningún horario. Agregale al menos uno o cerrá el día.`,
        error: true,
      });
      return;
    }

    setGuardando(true);
    setAviso(null);

    /* Las claves de un jsonb son texto, asi que el dia viaja como "1". */
    const porDia: Record<string, string[]> = {};
    for (const dia of dias) {
      porDia[String(dia)] = [...new Set(horasDe(dia))].sort();
    }

    const { error } = await supabase
      .from("agenda")
      .update({
        dias_habiles: [...dias].sort((a, b) => a - b),
        horarios_por_dia: porDia,
        /* La lista unica de antes se sigue escribiendo, con todas las
           horas de la semana: es de donde lee una version vieja del
           sitio si alguna vez hay que volver atras. */
        horarios: [...new Set(Object.values(porDia).flat())].sort(),
        anticipacion_horas: Number(anticipacion) || 0,
        ventana_dias: Number(ventana) || 30,
        como_trabajo: comoTrabajo.trim(),
      })
      .eq("id", 1);

    setGuardando(false);

    /*
      PGRST204 = la columna no existe todavia. Pasa una sola vez: cuando
      el sitio nuevo salio pero el SQL de la base no se corrio. Sin este
      aviso el guardado falla y no hay forma de saber por que.
    */
    const faltaMigracion =
      error?.code === "PGRST204" ||
      error?.message?.includes("horarios_por_dia") ||
      error?.message?.includes("como_trabajo");

    setAviso({
      texto: error
        ? faltaMigracion
          ? "Falta correr schema-12-agenda-por-dia.sql en Supabase."
          : "No se pudo guardar."
        : "Guardado.",
      error: Boolean(error),
    });
    if (!error) router.refresh();
  };

  return (
    <form onSubmit={guardar} className="space-y-6">
      {/* Dias y horarios: cada dia con los suyos */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">Días y horarios</h2>
        <p className="mt-1 text-base text-tinta-suave">
          Cada día tiene sus propios horarios: son las horas en que empieza
          cada turno. Abrí un día para cargarle los suyos.
        </p>

        <ul className="mt-4 space-y-3">
          {DIAS.map(({ valor, nombre }) => {
            const activo = dias.includes(valor);
            const horas = horasDe(valor);

            return (
              <li
                key={valor}
                className={`rounded-chico border px-4 py-3.5 ${
                  activo ? "border-vino bg-vino-suave" : "border-borde bg-white"
                }`}
              >
                {/*
                  El nombre y el boton, en un renglon que no se parte.
                  Con la cuenta de turnos al lado del nombre, en celular
                  "Miercoles 3 turnos" empujaba el boton al renglon de
                  abajo y la fila del dia quedaba desalineada con las
                  otras seis.
                */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-medium text-tinta">
                    {nombre}
                  </span>

                  <button
                    type="button"
                    onClick={() => alternarDia(valor)}
                    aria-pressed={activo}
                    aria-label={
                      activo
                        ? `Dejar de atender los ${nombre}`
                        : `Atender los ${nombre}`
                    }
                    className={`min-h-12 rounded-full px-5 text-base transition-colors ${
                      activo
                        ? "bg-vino text-white"
                        : "border border-borde bg-white text-tinta-suave"
                    }`}
                  >
                    {activo ? "Atendés" : "No atendés"}
                  </button>
                </div>

                {activo && (
                  <>
                    <p className="mt-1 text-base text-tinta-suave">
                      {horas.length === 1 ? "1 turno" : `${horas.length} turnos`}
                    </p>

                    <ul className="mt-3 space-y-2">
                      {horas.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <input
                            type="time"
                            value={h}
                            onChange={(e) =>
                              cambiarHorario(valor, i, e.target.value)
                            }
                            aria-label={`Horario del ${nombre}`}
                            className="min-h-12 grow rounded-2xl border border-borde bg-white px-4 text-base text-tinta outline-none focus:border-vino"
                          />
                          <button
                            type="button"
                            onClick={() => quitarHorario(valor, i)}
                            aria-label={`Quitar el turno de las ${h} del ${nombre}`}
                            className="min-h-12 rounded-full border border-borde bg-white px-5 text-base text-tinta-suave hover:border-vino hover:text-vino"
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>

                    {horas.length === 0 && (
                      <p className="mt-3 text-base text-tinta-suave">
                        Este día todavía no tiene horarios.
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => agregarHorario(valor)}
                        className="min-h-12 rounded-full border border-vino bg-white px-6 text-base text-vino hover:bg-vino hover:text-white"
                      >
                        Agregar horario
                      </button>

                      {/* Solo tiene sentido si hay otro dia adonde copiar */}
                      {dias.length > 1 && horas.length > 0 && (
                        <button
                          type="button"
                          onClick={() => copiarALosDemas(valor)}
                          className="min-h-12 rounded-full border border-borde bg-white px-6 text-base text-tinta-suave hover:border-vino hover:text-vino"
                        >
                          Copiar a los demás días
                        </button>
                      )}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
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

      {/* Como trabaja */}
      <section className="tarjeta px-5 py-5">
        <h2 className="text-xl font-semibold text-tinta">Cómo trabajás</h2>
        <p className="mt-1 text-base text-tinta-suave">
          Se muestra en la web, arriba de los precios. Contá con tus palabras
          cómo armás cada sesión: qué mirás antes de empezar y cómo cambia el
          tratamiento según lo que necesita y lo que pide cada clienta. Cada
          renglón es un párrafo.
        </p>
        <textarea
          value={comoTrabajo}
          onChange={(e) => setComoTrabajo(e.target.value)}
          rows={8}
          className="mt-3 w-full rounded-2xl border border-borde bg-white px-4 py-3 text-base leading-relaxed text-tinta outline-none focus:border-vino"
        />
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={guardando}
          className="min-h-13 rounded-full bg-vino px-8 text-base text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar cambios"}
        </button>
        {aviso && (
          <p
            className={`text-base ${
              aviso.error ? "font-medium text-vino" : "text-tinta-suave"
            }`}
          >
            {aviso.texto}
          </p>
        )}
      </div>
    </form>
  );
}
