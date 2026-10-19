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
      className="seccion border-t border-borde bg-crema-oscuro"
    >
      <div className="contenedor">
        <TituloSeccion titulo="Cómo trabajo" />

        {/*
          TRES PASOS UNIDOS POR UNA LINEA.

          Antes era una tarjeta blanca con renglones, igual a "Que vas a
          notar", y las dos secciones se leian como la misma. Son pasos en
          orden, asi que se dibujan como un recorrido: en celular, la
          linea baja por la izquierda; de 768 para arriba, cruza de lado a
          lado y cada paso cuelga de su numero.

          Va en <ol>: son pasos, y para quien escucha la pagina eso se
          anuncia solo.
        */}
        <ol className="relative mx-auto mt-8 grid max-w-2xl gap-8 md:max-w-none md:grid-cols-3 md:gap-10">
          <span
            aria-hidden
            className="absolute top-2 bottom-2 left-[1.375rem] w-px bg-borde md:top-[1.375rem] md:right-[16%] md:bottom-auto md:left-[16%] md:h-px md:w-auto"
          />
          {pasos.map(({ titulo, texto }, i) => (
            <li
              key={i}
              className="relative flex gap-5 md:flex-col md:items-center md:gap-4 md:text-center"
            >
              <span
                aria-hidden
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vino-suave font-display text-lg font-semibold text-vino tabular-nums ring-8 ring-crema-oscuro"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 pt-1.5 md:pt-0">
                {titulo && (
                  <h3 className="font-display text-xl font-semibold text-tinta">
                    {titulo}
                  </h3>
                )}
                <p className="mt-1 text-lg leading-snug text-tinta-suave md:mx-auto md:max-w-xs">
                  {texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
