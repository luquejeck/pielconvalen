import { pasosComoTrabajo, type Agenda } from "@/lib/config";

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
        <div className="tarjeta mx-auto max-w-5xl px-6 py-7 sm:px-8 xl:max-w-6xl">
          <h2 className="rotulo-seccion">Cómo trabajo</h2>

          <ol className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {pasos.map(({ titulo, texto }, i) => (
              <li key={i} className="flex gap-4 sm:block">
                {/* En celular el numero va al costado y en PC arriba:
                    arriba, en una sola columna, cada numero se comia un
                    renglon entero y el bloque terminaba mas alto que el
                    parrafo corrido que vino a reemplazar. */}
                <span
                  aria-hidden
                  className="w-7 shrink-0 text-2xl font-semibold tabular-nums leading-tight text-vino/35 sm:w-auto"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0">
                  {titulo && (
                    <h3 className="text-xl font-semibold text-tinta sm:mt-1">
                      {titulo}
                    </h3>
                  )}
                  <p
                    className={`text-lg leading-snug text-tinta-suave ${
                      titulo ? "mt-1.5" : "sm:mt-1"
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
