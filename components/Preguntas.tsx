import type { ConfiguracionWeb } from "@/lib/consultorio";

/**
 * Preguntas frecuentes, al final de todo.
 *
 * Es una seccion de consulta, no de recorrido: quien la necesita la
 * busca, y quien no, sigue de largo. Por eso va al fondo y por eso pesa
 * poco —titulo chico, renglones finos, todo cerrado— en vez de ocupar
 * una pantalla entera entre los precios y el modulo de reservas.
 *
 * Se usa <details> del propio navegador y no un acordeon armado a mano:
 * funciona sin JavaScript, el buscador del navegador encuentra el texto
 * de adentro aunque este cerrado, y los lectores de pantalla lo anuncian
 * solos.
 */
export default function Preguntas({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const { preguntas, contraindicaciones } = CONSULTORIO;
  if (preguntas.length === 0) return null;

  return (
    <section
      id="preguntas"
      className="border-t border-borde bg-crema-oscuro py-12 md:py-14"
    >
      <div className="contenedor">
        <div className="mx-auto max-w-3xl">
          {/* Titulo chico: aca abajo no compite con nada. */}
          <h2 className="text-2xl font-semibold text-tinta">
            Preguntas frecuentes
          </h2>

          {/* Un solo bloque con renglones divididos, en vez de una
              tarjeta por pregunta: la seccion mide la mitad. */}
          <ul className="mt-5 divide-y divide-borde border-y border-borde">
            {preguntas.map(({ pregunta, respuesta }) => (
              <li key={pregunta}>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 text-lg text-tinta marker:hidden hover:text-vino">
                    {pregunta}
                    <span
                      aria-hidden
                      className="shrink-0 text-xl text-vino transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-4 pr-8 text-lg leading-relaxed text-tinta-suave">
                    {respuesta}
                  </p>
                </details>
              </li>
            ))}

            {/*
              Las contraindicaciones son una fila mas del acordeon: cerrada
              ocupa un renglon, y abierta sigue siendo una lista.

              Probe ponerlas como una frase corrida para acortar y salia un
              parrafo de seis clausulas encadenadas, imposible de barrer con
              la vista. Mas corto no siempre es mas breve de leer.
            */}
            {contraindicaciones.length > 0 && (
              <li>
                <details className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 text-lg text-tinta marker:hidden hover:text-vino">
                    ¿Hay algo que tenga que avisarte antes?
                    <span
                      aria-hidden
                      className="shrink-0 text-xl text-vino transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>

                  <div className="pb-4 pr-8">
                    <p className="text-lg leading-relaxed text-tinta-suave">
                      Sí. Escribime antes de reservar si:
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {contraindicaciones.map((caso) => (
                        <li
                          key={caso}
                          className="flex items-start gap-2.5 text-lg leading-snug text-tinta-suave"
                        >
                          <span
                            aria-hidden
                            className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vino"
                          />
                          {caso}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-lg leading-relaxed text-tinta-suave">
                      No quiere decir que no puedas hacerte nada: lo vemos
                      juntas antes.
                    </p>
                  </div>
                </details>
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
