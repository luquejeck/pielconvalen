import type { ConfiguracionWeb } from "@/lib/consultorio";
import TituloSeccion from "./TituloSeccion";

/**
 * Las dudas que frenan a quien nunca se hizo un tratamiento.
 *
 * Hasta ahora no habia donde resolverlas: la clienta que se preguntaba
 * si duele, o si podia salir maquillada, o escribia por WhatsApp para
 * preguntar —y esperaba— o se iba de la pagina. Las dos cosas cuestan
 * un turno.
 *
 * Va DESPUES de los tratamientos y ANTES de reservar, que es justo el
 * momento en que aparecen las dudas: ya sabe que quiere, todavia no se
 * anima.
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
      className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <TituloSeccion
          titulo="Antes de reservar"
          bajada="Las preguntas que más me hacen. Si te queda alguna, escribime."
        />

        <div className="mx-auto mt-14 max-w-3xl xl:max-w-4xl">
          <ul className="space-y-2.5">
            {preguntas.map(({ pregunta, respuesta }) => (
              <li key={pregunta}>
                <details className="tarjeta group px-5 py-1 sm:px-6">
                  {/*
                    El resumen es toda la fila y mide 60px de alto: en un
                    telefono hay que poder tocarlo sin apuntar. El signo
                    de la derecha gira al abrirse, para que se vea que
                    eso se despliega y no que se fue a otra pagina.
                  */}
                  <summary className="flex min-h-15 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-medium text-tinta marker:hidden">
                    {pregunta}
                    <span
                      aria-hidden
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino-suave text-xl text-vino transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="pb-4 pr-12 text-lg leading-relaxed text-tinta-suave">
                    {respuesta}
                  </p>
                </details>
              </li>
            ))}
          </ul>

          {/*
            Cuando conviene consultar antes. No es letra chica legal:
            es evitar que alguien se tome el colectivo hasta Caballito
            para que despues haya que suspenderle la sesion sobre la
            camilla. Va aparte y con otro fondo porque no es una duda
            mas: es lo unico de esta seccion que puede cambiar lo que
            hace a continuacion.
          */}
          {contraindicaciones.length > 0 && (
            <div className="mt-6 rounded-suave bg-crema-oscuro px-6 py-6 sm:px-8">
              <h3 className="text-xl font-semibold text-tinta">
                Escribime antes de reservar si…
              </h3>

              <ul className="mt-4 space-y-2.5">
                {contraindicaciones.map((caso) => (
                  <li
                    key={caso}
                    className="flex items-start gap-3 text-lg leading-snug text-tinta"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-vino"
                    />
                    {caso}
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-lg leading-relaxed text-tinta-suave">
                No quiere decir que no puedas hacerte nada. Quiere decir que lo
                vemos juntas antes, para elegir el tratamiento que te sirva y no
                perder el viaje.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
