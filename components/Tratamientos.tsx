"use client";

import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

export default function Tratamientos() {
  const { tratamientos, consultorio, irAReservar } = useReserva();
  /* El glosario tambien se edita desde el panel: son las explicaciones
     en castellano de los nombres tecnicos. */
  const GLOSARIO = consultorio.glosario;

  const extrasDelCatalogo = [
    ...new Set(tratamientos.flatMap((t) => t.extras)),
  ].filter((extra) => GLOSARIO[extra]);

  /*
    "El mas completo" se calcula: es el que suma mas extras. Antes salia
    de la marca `destacado` de la base, y con dos tratamientos marcados
    la etiqueta aparecia tambien sobre la higiene mas simple, que es
    justo lo contrario de lo que dice.
  */
  const maxExtras = Math.max(...tratamientos.map((t) => t.extras.length));

  /*
    Cual es EL mas completo, uno solo.

    Con `maxExtras` a secas, dos tratamientos empatados en cantidad de
    extras se llevaban los dos la etiqueta, y "el mas completo" deja de
    querer decir algo cuando hay dos. Hoy pasa: Full Glow y la higiene
    con microneedling y radiofrecuencia suman tres cada uno.

    El empate lo desempata el precio, que es el orden en que la clienta
    los va a leer igual.
  */
  const masCompleto = tratamientos
    .filter((t) => !esConsulta(t))
    .reduce<(typeof tratamientos)[number] | null>(
      (mejor, t) =>
        !mejor ||
        t.extras.length > mejor.extras.length ||
        (t.extras.length === mejor.extras.length && t.precio > mejor.precio)
          ? t
          : mejor,
      null
    );

  return (
    <section
      id="tratamientos"
      className="border-t border-borde bg-crema-oscuro py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <TituloSeccion
          titulo="Tratamientos"
          bajada="Todos parten de la misma limpieza profunda. La diferencia es lo que se le suma."
        />

        {/*
          Los nombres tecnicos se explican UNA sola vez. Repetirlos en
          cada tarjeta llenaba la pantalla de letra chica.

          Va sobre vino suave y no en otra tarjeta blanca: apilada debajo
          de la de arriba, las dos se leian como una sola cosa partida al
          medio. Ademas el vino suave ya es el color de la ayuda en esta
          seccion —lo usa el bloque de abajo, el que lleva a reservar— y
          esto es exactamente eso: la explicacion para quien no conoce
          los nombres.

          Cada nombre va en la MISMA ficha que despues aparece en las
          tarjetas de tratamiento. Asi esto se lee como lo que es: la
          referencia de esas fichas, no una lista suelta de terminos.
          Sobre el vino suave la ficha se invierte a blanco, porque la
          de las tarjetas usa justo este fondo.
        */}
        {extrasDelCatalogo.length > 0 && (
          <details className="group mx-auto mt-4 max-w-4xl rounded-suave bg-vino-suave px-6 py-5 sm:px-8 xl:max-w-none">
            {/*
              Plegado, y abierto solo por quien lo necesita.

              Esto es una referencia, no un paso del recorrido: explica
              los tres nombres tecnicos que despues aparecen como fichas
              en las tarjetas. Desplegado ocupaba media pantalla de
              celular ENTRE el texto de Valen y la primera cifra, asi que
              habia que scrollear mil pixeles de explicaciones antes de
              ver un precio.

              Los tres nombres se leen igual con el bloque cerrado: lo
              unico que se guarda es la explicacion de cada uno. Quien ya
              sabe que es un peeling sigue de largo; quien no, toca.

              Es <details> del navegador, como las preguntas frecuentes:
              anda sin JavaScript y el buscador del navegador encuentra
              el texto de adentro aunque este cerrado.
            */}
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-2 marker:hidden">
              <h3 className="rotulo-seccion">Lo que se suma en algunos</h3>

              {/* Los nombres, siempre a la vista. Cerrado, esto ya dice
                  de que se trata sin obligar a abrirlo. */}
              <span className="text-lg text-tinta-suave">
                {extrasDelCatalogo.join(" · ")}
              </span>

              <span
                aria-hidden
                className="ml-auto text-xl text-vino transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>

            {/* Cada ficha arriba de su explicacion, nunca al lado: los
                nombres miden distinto y el texto arrancaba en tres
                sangrias diferentes. */}
            <dl className="mt-5 grid gap-5 lg:grid-cols-3 lg:gap-x-10">
              {extrasDelCatalogo.map((extra) => (
                <div key={extra}>
                  <dt>
                    <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-base font-semibold text-vino">
                      {extra}
                    </span>
                  </dt>
                  <dd className="mt-2 text-lg leading-snug text-tinta">
                    {GLOSARIO[extra]}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {/*
          La lista de precios, para mirar y no para elegir.

          Antes cada tarjeta tenia su boton "Reservar este" y el
          tratamiento viajaba elegido hasta el turno. Elegirlo de
          antemano es pedirle a la clienta una decision que no esta en
          condiciones de tomar: cual corresponde se sabe recien con la
          piel a la vista. Los precios siguen todos publicados —esconder
          lo que sale es lo que hace desconfiar—, pero el turno es uno
          solo y sale como consulta.
        */}
        {/*
          Una fila por tratamiento, no una tarjeta.

          Eran cinco tarjetas con nombre, precio y fichas de colores, y
          ocupaban una pantalla y media de celular para decir cinco
          nombres y cinco numeros. Puestos en renglones —nombre a la
          izquierda, precio a la derecha— se comparan de un vistazo, que
          es lo unico que se hace con una lista de precios: mirar la
          diferencia entre uno y el siguiente.

          Lo que suma cada uno pasa de fichas a texto corrido debajo del
          nombre. Los nombres son los mismos del bloque de arriba, asi
          que la referencia sigue funcionando.
        */}
        <ul className="tarjeta mx-auto mt-5 max-w-3xl divide-y divide-borde px-5 sm:px-7 xl:max-w-4xl">
          {tratamientos.filter((t) => !esConsulta(t)).map((t) => {
            const esMasCompleto = maxExtras > 0 && t.id === masCompleto?.id;

            return (
              <li
                key={t.id}
                className="flex items-baseline justify-between gap-4 py-4"
              >
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-tinta">
                    {t.nombre}
                    {/* El espacio va escrito: sin el, el nombre y la
                        etiqueta quedan pegados para un lector de
                        pantalla ("Full GlowEl mas completo"). */}
                    {esMasCompleto && (
                      <>
                        {" "}
                        <span className="whitespace-nowrap rounded-full bg-vino px-2.5 py-0.5 align-middle text-sm font-semibold text-white">
                          El más completo
                        </span>
                      </>
                    )}
                  </h3>

                  <p className="mt-0.5 text-base leading-snug text-tinta-suave">
                    {t.extras.length === 0
                      ? "La limpieza profunda completa"
                      : `Suma ${t.extras.join(" · ")}`}
                  </p>
                </div>

                {/* `shrink-0` y tabular: los precios quedan alineados entre
                    si aunque los nombres midan distinto. */}
                <p className="shrink-0 text-xl font-semibold tabular-nums text-vino">
                  {formatearPrecio(t.precio)}
                </p>
              </li>
            );
          })}
        </ul>

        {/*
          La unica puerta de entrada, y por eso va aparte y con otro
          fondo: la lista de arriba informa, esto es lo que se toca.

          Antes era "la salida para quien no sabe cual elegir", una
          opcion entre siete. Ahora es como se saca el turno siempre, asi
          que lo primero que hace el bloque es decirlo: nadie tiene que
          quedarse buscando el boton de un tratamiento que ya no esta.
        */}
        <div className="mx-auto mt-3 max-w-5xl rounded-suave bg-vino-suave px-6 py-5 sm:px-8 xl:max-w-none">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {/*
                Antes esto repetia, casi palabra por palabra, lo que ahora
                se lee dos secciones mas arriba: que el turno entra como
                consulta y que Valen define el tratamiento al ver la piel.
                Con el modulo de reservas movido al principio, decirlo de
                nuevo aca solo suma renglones.
              */}
              <h3 className="text-xl font-semibold text-tinta">
                ¿Cuál te corresponde?
              </h3>
              <p className="mt-1.5 max-w-xl text-lg leading-snug text-tinta-suave">
                Lo deciden juntas al llegar, mirando tu piel.
              </p>
            </div>

            <button
              type="button"
              onClick={irAReservar}
              className="boton-principal shrink-0 whitespace-nowrap"
            >
              Reservar turno
            </button>
          </div>
        </div>

        {/* Debajo de los precios, que es donde aparece la duda */}
        <p className="mt-5 text-center text-lg text-tinta-suave">
          Se puede pagar con{" "}
          <span className="font-medium text-tinta">
            {consultorio.mediosDePago}
          </span>
          .
        </p>
      </div>
    </section>
  );
}
