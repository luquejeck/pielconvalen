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
      /*
        LA UNICA SECCION OSCURA DEL MEDIO DE LA PAGINA (19-10-2026).

        Hasta aca la portada eran once bloques crema y rosa alternados, y
        a la cuarta seccion la vista ya no distinguia una de otra. Esta es
        la que habla en primera persona, la que mas se parece a Valen, y
        en tinta —el mismo fondo del pie— se lee como una pausa.
      */
      className="seccion bg-tinta text-crema"
    >
      <div className="contenedor">
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl text-crema sm:text-5xl">Cómo trabajo</h2>
        </header>

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
        <ol className="relative mx-auto mt-10 grid max-w-2xl gap-8 md:max-w-none md:grid-cols-3 md:gap-10">
          <span
            aria-hidden
            className="absolute top-2 bottom-2 left-[1.375rem] w-px bg-crema/20 md:top-[1.375rem] md:right-[16%] md:bottom-auto md:left-[16%] md:h-px md:w-auto"
          />
          {pasos.map(({ titulo, texto }, i) => (
            <li
              key={i}
              className="relative flex gap-5 md:flex-col md:items-center md:gap-4 md:text-center"
            >
              <span
                aria-hidden
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-crema font-display text-lg font-semibold text-vino tabular-nums ring-8 ring-tinta"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0 pt-1.5 md:pt-0">
                {titulo && (
                  <h3 className="font-display text-xl font-semibold text-crema">
                    {titulo}
                  </h3>
                )}
                <p className="mt-1 text-lg leading-snug text-crema/75 md:mx-auto md:max-w-xs">
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
