"use client";

import Link from "next/link";
import {
  aSlug,
  motivoRecomendacion,
  recomendadoPara,
} from "@/lib/productos";
import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

export default function Tratamientos() {
  const { tratamientos, consultorio, irAReservar } = useReserva();

  /* Los que se muestran con precio. La consulta no va: no tiene numero. */
  const conPrecio = tratamientos.filter((t) => !esConsulta(t));

  /* De menor a mayor: la pila se recorre como una escalera. `slice`
     porque `sort` ordena en el lugar y `tratamientos` viene del contexto. */
  const porPrecio = conPrecio.slice().sort((a, b) => a.precio - b.precio);

  /*
    La duracion se muestra solo si TODOS duran lo mismo.

    Es lo que la hace decible en una sola linea. Si algun dia Valen carga
    uno de media hora, la linea deja de afirmar algo que seria falso para
    esa fila y la duracion simplemente no aparece: mejor no decirla que
    decirla mal.
  */
  const duraciones = [...new Set(conPrecio.map((t) => t.duracion))];
  const duracionComun = duraciones.length === 1 ? duraciones[0] : null;

  /*
    Los extras siempre en el mismo orden, alfabetico. En la base cada
    tratamiento los tiene en el orden en que se cargaron, y una fila
    decia "Dermaplaning · Ácidos" y la de abajo "Ácidos · Microneedling".
  */
  const ordenar = (extras: string[]) =>
    extras.slice().sort((a, b) => a.localeCompare(b, "es"));

  return (
    <section
      id="tratamientos"
      className="border-t border-borde bg-crema-oscuro py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <TituloSeccion
          titulo="Tratamientos"
          bajada="Todos parten de la misma limpieza. La diferencia es lo que se suma."
        />

        {/*
          UNA LISTA, NO UNA PILA DE CAPAS.

          Antes cada tratamiento era una capa apoyada sobre la anterior y
          cada capa un tono mas intensa, del crema al vino pleno. Se veia
          muy bien y era lo mas llamativo de la pagina: el ojo caia ahi
          antes que en la cara de Valen o en el calendario, que son las
          dos cosas que la pagina necesita que se miren.

          Ademas el degrade decia algo que no es cierto. Los tonos iban de
          menor a mayor precio, asi que el mas caro quedaba en vino pleno
          y parecia el recomendado. El que corresponde lo define Valen
          mirando la piel, y no el que mas sale.

          Queda una tabla de precios que se lee de un vistazo: nombre,
          que suma, y cuanto. Una fila por tratamiento, separadas por
          una linea fina. El unico color es el del precio.
        */}
        {/*
          EL AVISO DE LA CONSULTA, ACA Y NO EN EL FLUJO DE RESERVA.

          Antes vivia adentro del paso 1 del calendario, y ahi llegaba
          tarde: la clienta ya habia visto los precios, habia elegido
          cual queria, y recien en el ultimo tramo se enteraba de que no
          se elige por la web. Puesto arriba de la lista contesta la
          pregunta justo cuando aparece —"¿cual pido?"— y el calendario
          queda limpio, con un solo mensaje por paso.
        */}
        <p className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-chico border border-borde bg-papel px-4 py-3 text-lg leading-snug text-tinta">
          <span
            aria-hidden
            className="mt-0.5 h-5 w-1 shrink-0 rounded-full bg-vino"
          />
          <span>
            El turno se saca como <b>consulta</b>. Valen te mira la piel al
            llegar y ahí definen el tratamiento y el precio.
          </span>
        </p>

        {/*
          LA LISTA VA ADENTRO DE UNA TARJETA.

          Suelta sobre el fondo se veia sin terminar: dos lineas finas al
          aire en medio de una seccion que por lo demas esta vacia. La
          tarjeta blanca es el mismo recurso que usa el resto de la web
          para contener cosas, asi que la seccion deja de ser la excepcion.

          El nombre y el precio comparten renglon y estan alineados por la
          base, con el precio en tabular: leidos en columna, los numeros
          se comparan sin que el ojo tenga que buscarlos.
        */}
        <div className="mx-auto mt-8 max-w-2xl rounded-suave bg-papel p-5 shadow-suave sm:p-7">
          <ul className="divide-y divide-borde">
            {porPrecio.map((t) => (
              <li
                key={t.id}
                className="flex items-baseline justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <h3 className="font-display text-lg leading-snug font-medium text-tinta">
                    {t.nombre}
                  </h3>

                  {t.extras.length > 0 && (
                    <p className="mt-1 text-base leading-snug text-tinta-suave">
                      {/* Para quien escucha la pagina, "+" no se lee: la
                          palabra va escondida y el signo queda de adorno. */}
                      <span aria-hidden>+ </span>
                      <span className="sr-only">Suma </span>
                      {ordenar(t.extras).join(" · ")}
                    </p>
                  )}

                  {/*
                    EL CUIDADO EN CASA, en un renglon chico y sin boton.

                    Es el momento de mayor intencion: la clienta esta
                    mirando el tratamiento que le resuelve el problema.
                    Pero va discreto a proposito —texto chico, subrayado
                    fino, sin precio ni foto— porque esta seccion es para
                    decidir el turno, no para vender una crema. Un boton
                    de "Agregar" aca competiria con "Reservar", que es lo
                    unico que la pagina pide en este tramo.

                    Lo que se recomienda sale de los extras y no de una
                    tabla por nombre: los nombres los edita Valen desde el
                    panel y cambian.
                  */}
                  {(() => {
                    const sugerido = recomendadoPara(t.extras);
                    if (!sugerido) return null;

                    return (
                      <p className="mt-2 text-sm leading-snug text-tinta-suave">
                        {motivoRecomendacion(t.extras)}:{" "}
                        <Link
                          href={`/productos#${aSlug(sugerido.categoria)}`}
                          className="underline decoration-vino/40 underline-offset-4 transition-colors hover:text-vino hover:decoration-vino"
                        >
                          {sugerido.nombre} de {sugerido.marca}
                        </Link>
                      </p>
                    );
                  })()}
                </div>

                <p className="shrink-0 font-display text-lg font-semibold text-vino tabular-nums">
                  {formatearPrecio(t.precio)}
                </p>
              </li>
            ))}
          </ul>

          {/* La duracion y el pago, adentro de la tarjeta y separados por
              una linea: son condiciones de todos los renglones de arriba,
              no un dato suelto de la seccion. */}
          <p className="mt-5 border-t border-borde pt-4 text-center text-base leading-snug text-balance text-tinta-suave">
            {duracionComun && <>{duracionComun} por sesión · </>}
            {consultorio.mediosDePago}
          </p>
        </div>

        {/*
          EL CIERRE, EN TRES RENGLONES.

          Antes eran cinco bloques: un parrafo con la duracion y los
          medios de pago, un titulo "¿Cuál te corresponde?", otro parrafo
          que lo contestaba, y recien ahi el boton. Cuatro textos para
          decir una cosa —el tratamiento se elige en el consultorio— y
          para ofrecer un boton que ya estaba arriba en el encabezado.

          Queda la frase que importa, el boton, y debajo en chico los dos
          datos que hacen falta para animarse a reservar: cuanto dura y
          como se paga. La duracion solo aparece si TODOS duran lo mismo:
          el dia que Valen cargue uno de media hora, la linea dejaria de
          ser cierta y directamente no se muestra.
        */}
        <div className="mx-auto mt-9 max-w-xl text-center">
          <p className="text-lg leading-snug text-balance text-tinta-suave">
            Cuál te corresponde lo deciden al llegar, mirando tu piel.
          </p>

          <button
            type="button"
            onClick={irAReservar}
            className="boton-principal mt-5 w-full sm:w-auto sm:px-9"
          >
            Reservar turno
          </button>

        </div>
      </div>
    </section>
  );
}
