"use client";

import Link from "next/link";
import { esConsulta, formatearPrecio, type Tratamiento } from "@/lib/tratamientos";
import Carrusel from "./Carrusel";
import { IconoBillete, IconoCheck, IconoReloj } from "./iconos";
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
    Los extras siempre en el mismo orden, alfabetico. En la base cada
    tratamiento los tiene en el orden en que se cargaron, y una fila
    decia "Dermaplaning · Ácidos" y la de abajo "Ácidos · Microneedling".
  */
  const ordenar = (extras: string[]) =>
    extras.slice().sort((a, b) => a.localeCompare(b, "es"));

  return (
    <section
      id="tratamientos"
      className="border-t border-borde bg-crema-oscuro seccion"
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
          PRUEBA: CADA TRATAMIENTO EN SU TARJETA, EN UNA FILA QUE SE DESLIZA.

          Es el mismo carrusel de los combos y los productos —la tarjeta
          vecina asomando igual a los dos lados, "1 de 6" abajo— para ver
          si la seccion se lee como parte de la misma web. Antes era una
          lista de precios adentro de una sola tarjeta.

          Toda la tarjeta se toca y abre la pagina de ese tratamiento, como
          las fichas de producto: el detalle —que es cada tecnica— vive
          ahi y no en la portada, que no tiene que crecer. Para reservar
          estan el boton del encabezado y el calendario, justo debajo.
        */}
        <div className="mt-8">
          <Carrusel etiqueta="Tratamientos" tipo="combos">
            {porPrecio.map((t) => (
              <TarjetaTratamiento key={t.id} tratamiento={t} extras={ordenar(t.extras)} />
            ))}
          </Carrusel>
        </div>

        {/*
          EL CIERRE: UN SOLO BOTON, Y DEBAJO COMO SE PAGA.

          Las tarjetas dicen "Ver detalle" y llevan a la pagina de cada
          tratamiento, asi que el unico "Reservar turno" de la seccion es
          este.

          La forma de pago va pegada debajo del boton, chica y con su
          icono, como las cuotas debajo del precio en Mercado Libre: se lee
          como una aclaracion del boton. Antes eran dos renglones grises
          sueltos —el pago y "Cuál te corresponde lo deciden al llegar"—
          y el segundo repetia lo que ya dice el aviso de arriba.
        */}
        <div className="mx-auto mt-8 flex max-w-xl flex-col items-center">
          <button
            type="button"
            onClick={irAReservar}
            className="boton-principal w-full sm:w-auto sm:px-9"
          >
            Reservar turno
          </button>
          <p className="mt-3 flex items-center gap-2 text-base text-tinta-suave">
            <IconoBillete className="h-5 w-5 shrink-0" />
            {consultorio.mediosDePago}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Un tratamiento, con la forma de las tarjetas de planes de Mercado
 * Pago: arriba que es y cuanto sale; abajo, que incluye; al pie, el
 * boton.
 *
 *   ═════════════════════════════   <- linea vino
 *   │ Higiene Facial Profunda    │
 *   │ $ 40.000 por sesión        │
 *   │ (o) 1.5 a 2 horas          │
 *   ├───────────────────────────┤
 *   │ ✓ Limpieza profunda        │
 *   │ ✓ Ácidos                   │
 *   │ [     Reservar turno     ] │
 *   └───────────────────────────┘
 *
 * BLANCA ENTERA, CON UNA LINEA VINO ARRIBA. Estuvo con el encabezado en
 * una franja vino suave y a Lucas no lo convencio: sobre el fondo
 * rosado de la seccion, rosa sobre rosa se veia lavado. La linea marca
 * el principio de cada tarjeta con un solo detalle de color, y los
 * tildes y el boton en vino la terminan de atar a la marca.
 *
 * TODA LA TARJETA SE TOCA y abre la pagina del tratamiento. El "Ver
 * detalle" del pie estira su `::after` sobre la tarjeta entera, como el
 * nombre en la ficha de producto: un link no puede envolver un titulo y
 * una lista, pero asi se toca en cualquier parte. El boton a la vista
 * dice que se puede tocar: a una clienta de sesenta no se le ocurre sola.
 *
 * Cada tratamiento dice su propia duracion: si Valen carga uno de media
 * hora, lo dice solo ese.
 */
function TarjetaTratamiento({
  tratamiento: t,
  extras,
}: {
  tratamiento: Tratamiento;
  extras: string[];
}) {
  return (
    <li className="flex">
      <article className="group relative flex w-full flex-col overflow-hidden rounded-suave border border-borde bg-papel transition-shadow duration-200 hover:shadow-suave">
        {/* El detalle de color: una linea vino arriba. La tarjeta es
            blanca entera; el recorte redondeado de la tarjeta le da la
            curva en las puntas. */}
        <span aria-hidden className="block h-1 bg-vino" />
        <header className="border-b border-borde px-5 pt-4 pb-4">
          <h3 className="font-display text-lg leading-snug font-semibold text-tinta">
            {t.nombre}
          </h3>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 leading-tight">
            <span className="font-display text-[1.75rem] font-semibold text-tinta tabular-nums">
              {formatearPrecio(t.precio)}
            </span>
            <span className="text-[0.9375rem] text-tinta-suave">por sesión</span>
          </p>
          {t.duracion && (
            <p className="mt-1 flex items-center gap-2 text-[0.9375rem] leading-snug text-tinta-suave">
              <IconoReloj className="h-4.5 w-4.5 shrink-0" />
              {t.duracion}
            </p>
          )}
        </header>

        <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
          {/* Todos parten de la limpieza profunda: va primera en todos, y
              despues lo que suma cada uno. */}
          <ul className="space-y-2 text-base leading-snug text-tinta">
            {["Limpieza profunda", ...extras].map((x) => (
              <li key={x} className="flex items-start gap-2.5">
                <IconoCheck className="mt-0.5 h-5 w-5 shrink-0 text-vino" />
                {x}
              </li>
            ))}
          </ul>

          {/* `mt-auto` lleva el boton al pie: en la fila todas las
              tarjetas miden lo que la mas larga, y asi los botones quedan
              alineados. El `pt-5` es el aire minimo con la lista. */}
          <div className="mt-auto pt-5">
            <Link
              href={`/tratamientos/${t.id}`}
              className="flex min-h-12 w-full items-center justify-center rounded-full border border-vino bg-papel font-display text-base font-semibold text-vino transition-colors after:absolute after:inset-0 after:rounded-suave group-hover:bg-vino group-hover:text-white"
            >
              Ver detalle
              <span className="sr-only">: {t.nombre}</span>
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}
