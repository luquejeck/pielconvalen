import { pasosComoTrabajo, type Agenda } from "@/lib/config";
import TituloSeccion from "./TituloSeccion";

/**
 * "Cómo trabajo": tres pasos, en primera persona.
 *
 * Es lo único del sitio donde habla ella y no el catálogo, y por eso no
 * vive adentro de ninguna otra sección: primero estuvo arriba de la
 * lista de precios, donde partía los precios en dos, y después dentro de
 * la sección de Valen, donde empujaba el calendario media pantalla más
 * abajo.
 *
 * Ahora va SUELTO y DESPUES del módulo de reservas. La razón es de
 * orden, no de diseño: lo que está antes del calendario es lo que hay
 * que leer para animarse a reservar —la cara, la credencial, las tres
 * garantías—; esto es para quien bajó sin reservar y quiere saber cómo
 * se trabaja. Ponerlo antes le costaba media pantalla de scroll a todos
 * para servirle a algunos.
 */
export default function ComoTrabajo({ agenda }: { agenda: Agenda }) {
  const pasos = pasosComoTrabajo(agenda);
  if (pasos.length === 0) return null;

  return (
    <section
      id="como-trabajo"
      className="border-t border-borde bg-crema-oscuro py-12 md:py-14"
    >
      <div className="contenedor">
        {/* Mismo encabezado que el resto de las secciones. Antes esto
            era una etiqueta chica adentro de una tarjeta, y de todas las
            secciones de la pagina era la unica que no se anunciaba. */}
        <TituloSeccion titulo="Cómo trabajo" />

        <div className="tarjeta mx-auto mt-8 max-w-5xl px-6 py-7 sm:px-8 xl:max-w-6xl">
          {/*
            TRES PASOS QUE SE VEN COMO UN PROCESO, NO COMO TRES BLOQUES.

            Antes eran tres numeros sueltos en vino al 35%: tan palidos
            que no se leian, y sin nada que dijera que el 02 viene
            despues del 01. Tres parrafos con una cifra al costado.

            Ahora el numero va en un circulo —el mismo recurso que usan
            los iconos de "Que vas a notar", asi la pagina repite un
            gesto en vez de inventar uno por seccion— y en celular un
            riel vertical los encadena. El riel es lo que convierte una
            lista en una secuencia: se ve el orden antes de leer una
            palabra.

            En pantalla ancha el riel desaparece: ahi son tres columnas
            y el orden ya lo da la lectura de izquierda a derecha.
          */}
          <ol className="grid sm:grid-cols-3 sm:gap-8">
            {pasos.map(({ titulo, texto }, i) => (
              <li
                key={i}
                className="relative flex gap-4 pb-7 last:pb-0 sm:block sm:pb-0"
              >
                {/* El riel arranca debajo del circulo y llega hasta el
                    siguiente. En el ultimo no va: no lleva a ninguna
                    parte. */}
                {i < pasos.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute bottom-2 left-[22px] top-12 w-px bg-borde sm:hidden"
                  />
                )}

                <span
                  aria-hidden
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vino-suave text-lg font-semibold tabular-nums text-vino"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 sm:mt-4">
                  {titulo && (
                    <h3 className="text-xl font-semibold text-tinta">
                      {titulo}
                    </h3>
                  )}
                  <p
                    className={`text-lg leading-snug text-tinta-suave ${
                      titulo ? "mt-1.5" : ""
                    }`}
                  >
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
