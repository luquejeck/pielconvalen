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
      className="border-t border-borde bg-crema-oscuro py-16 md:py-20"
    >
      <div className="contenedor">
        {/* Mismo encabezado que el resto de las secciones. Antes esto
            era una etiqueta chica adentro de una tarjeta, y de todas las
            secciones de la pagina era la unica que no se anunciaba. */}
        <TituloSeccion titulo="Cómo trabajo" />

        {/*
          LA MISMA FORMA QUE "QUE VAS A NOTAR".

          Las dos secciones dicen lo mismo estructuralmente: tres cosas
          cortas, cada una con un rotulo y su explicacion. Que una fuera
          tres columnas con numeros al costado y la otra una tarjeta de
          renglones divididos hacia que se leyeran como partes de dos
          sitios distintos.

          Ahora comparten todo: la tarjeta, el circulo de 44px, la linea
          que separa cada fila y el titulo en negrita seguido de su texto
          en el mismo renglon. Lo unico que cambia es lo que va adentro
          del circulo —ahi un icono, aca el numero del paso— porque estos
          tres SI tienen orden.

          Va en <ol> y no en <div> justo por eso: son pasos, y para quien
          escucha la pagina eso se anuncia solo.
        */}
        <ol className="tarjeta mx-auto mt-6 max-w-2xl divide-y divide-borde px-5 sm:px-7 xl:max-w-3xl">
          {pasos.map(({ titulo, texto }, i) => (
            <li key={i} className="flex items-center gap-4 py-4">
              <span
                aria-hidden
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-vino-suave text-lg font-semibold tabular-nums text-vino"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <p className="text-lg leading-snug text-tinta-suave">
                {titulo && (
                  <span className="font-semibold text-tinta">{titulo}.</span>
                )}{" "}
                {texto}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
