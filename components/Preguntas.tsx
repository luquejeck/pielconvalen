import type { ConfiguracionWeb } from "@/lib/consultorio";
import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";
import TituloSeccion from "./TituloSeccion";

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
      className="border-t border-borde bg-crema-oscuro seccion"
    >
      <div className="contenedor">
        <div className="mx-auto max-w-3xl">
          {/* El mismo encabezado que las demas. Antes era un h2 chico y
              alineado a la izquierda: la seccion se leia como una nota al
              pie y no como una parte mas de la pagina. */}
          <TituloSeccion titulo="Preguntas frecuentes" />

          {/* Un solo bloque con renglones divididos, en vez de una
              tarjeta por pregunta: la seccion mide la mitad. */}
          <ul className="mt-8 divide-y divide-borde border-y border-borde">
            {preguntas.map(({ pregunta, respuesta }) => (
              <li key={pregunta}>
                <details className="pregunta group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-medium text-tinta marker:hidden transition-colors hover:text-vino [&::-webkit-details-marker]:hidden">
                    {pregunta}
                    <MasMenos />
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
                <details className="pregunta group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-medium text-tinta marker:hidden transition-colors hover:text-vino [&::-webkit-details-marker]:hidden">
                    ¿Hay algo que tenga que avisarte antes?
                    <MasMenos />
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

          {/* La salida para quien no encontro su respuesta: en vez de
              irse, que pregunte. Abre WhatsApp con el saludo escrito. */}
          <div className="mt-8 flex flex-col items-center gap-3 tarjeta px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="text-lg leading-snug text-tinta">
              <span className="font-semibold">¿Te quedó otra duda?</span>{" "}
              Preguntame, te respondo yo.
            </p>
            <a
              href={linkWhatsAppSimple(undefined, CONSULTORIO.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-principal compacto shrink-0"
            >
              <IconoWhatsApp className="h-5 w-5" />
              Escribile a Valen
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** El + que se vuelve − al abrir: dos rayitas, la vertical se acuesta. */
function MasMenos() {
  return (
    <span
      aria-hidden
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde text-vino transition-colors group-open:border-vino group-open:bg-vino group-open:text-white"
    >
      <span className="absolute h-0.5 w-3.5 rounded-full bg-current" />
      <span className="absolute h-3.5 w-0.5 rounded-full bg-current transition-transform duration-300 group-open:rotate-90" />
    </span>
  );
}
