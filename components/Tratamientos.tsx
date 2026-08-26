"use client";

import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

export default function Tratamientos() {
  const { tratamientos, agenda, consultorio, tratamientoId, elegirYReservar } =
    useReserva();
  /* El glosario tambien se edita desde el panel: son las explicaciones
     en castellano de los nombres tecnicos. */
  const GLOSARIO = consultorio.glosario;
  const pasos = agenda.pasosBase;

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

  const consulta = tratamientos.find(esConsulta);

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
          Los pasos base se explican UNA sola vez. Van numerados porque son
          una secuencia, no una lista suelta: se lee el orden en que pasan
          las cosas sobre la camilla.
        */}
        <div className="tarjeta mx-auto mt-10 max-w-4xl px-6 py-8 sm:px-8 xl:max-w-none">
          {/* Mismo rotulo que el bloque de abajo: son un par y antes
              tenian dos titulos distintos, uno centrado y otro no. */}
          <h3 className="rotulo-seccion">
            Todos incluyen estos {pasos.length} pasos
          </h3>
          {/*
            En pantalla ancha los siete van en una sola fila, unidos por
            una linea: se ve de un saque que es un recorrido de principio
            a fin. Apilados al medio dejaban media tarjeta vacia a los
            costados. En celular vuelven a ser una lista, que es como se
            lee comodo en una columna angosta.
          */}
          <ol className="mt-8 grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-7">
            {pasos.map((paso, i) => (
              <li
                key={paso}
                className="relative flex items-center gap-3 lg:flex-col lg:items-center lg:gap-3 lg:text-center"
              >
                {/* Tramo de linea que une este paso con el anterior */}
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-1/2 top-4 hidden h-px w-full bg-borde lg:block"
                  />
                )}

                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino-suave text-lg font-semibold text-vino">
                  {i + 1}
                </span>
                <span className="text-lg leading-snug">
                  {paso}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/*
          Los nombres tecnicos se explican UNA sola vez, igual que los pasos.
          Repetirlos en cada tarjeta llenaba la pantalla de letra chica.

          Va sobre vino suave y no en otra tarjeta blanca: apilada debajo
          de la de los pasos, las dos se leian como una sola cosa partida
          al medio. Ademas el vino suave ya es el color de la ayuda en
          esta seccion —lo usa el bloque de "¿no sabes cual elegir?"— y
          esto es exactamente eso: la explicacion para quien no conoce
          los nombres.

          Cada nombre va en la MISMA ficha que despues aparece en las
          tarjetas de tratamiento. Asi esto se lee como lo que es: la
          referencia de esas fichas, no una lista suelta de terminos.
          Sobre el vino suave la ficha se invierte a blanco, porque la
          de las tarjetas usa justo este fondo.
        */}
        {extrasDelCatalogo.length > 0 && (
          <div className="mx-auto mt-4 max-w-4xl rounded-suave bg-vino-suave px-6 py-7 sm:px-8 xl:max-w-none">
            <h3 className="rotulo-seccion">Lo que se suma en algunos</h3>

            {/* Cada ficha arriba de su explicacion, nunca al lado: los
                nombres miden distinto y el texto arrancaba en tres
                sangrias diferentes. */}
            <dl className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-x-10">
              {extrasDelCatalogo.map((extra) => (
                <div key={extra}>
                  <dt>
                    <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-base font-semibold text-vino">
                      {extra}
                    </span>
                  </dt>
                  <dd className="mt-2.5 text-lg leading-snug text-tinta">
                    {GLOSARIO[extra]}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <ul className="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
          {tratamientos.filter((t) => !esConsulta(t)).map((t) => {
            const activo = tratamientoId === t.id;
            const esMasCompleto = maxExtras > 0 && t.extras.length === maxExtras;

            return (
              <li
                key={t.id}
                /*
                  El mas completo ocupa dos columnas: cierra la grilla, que
                  con cinco tarjetas dejaba un hueco, y de paso el que mas
                  suma es el que mas espacio ocupa.
                */
                className={`tarjeta relative flex flex-col px-6 py-6 transition-shadow ${
                  esMasCompleto ? "sm:col-span-2 xl:col-span-2" : ""
                } ${activo ? "ring-2 ring-vino" : ""}`}
              >
                {esMasCompleto && (
                  <span className="absolute right-5 top-5 rounded-full bg-vino px-3 py-1 text-sm font-semibold text-white">
                    El más completo
                  </span>
                )}

                {/* Nombre arriba y precio debajo, siempre. Cuando iban en
                    la misma linea, los nombres largos empujaban el precio
                    al renglon siguiente y cada tarjeta quedaba distinta. */}
                <h3
                  className={`text-xl font-semibold text-tinta ${
                    esMasCompleto ? "pr-28" : ""
                  }`}
                >
                  {t.nombre}
                </h3>

                <p className="mt-2 text-2xl font-semibold text-vino">
                  {formatearPrecio(t.precio)}
                </p>

                {/*
                  Lo que suma, en fichas y no en una frase. Los seis
                  decian "Los 7 pasos base + ..." y de lejos se leian
                  todos iguales; asi se ve de un vistazo que cada uno
                  agrega una ficha mas que el anterior.
                */}
                <div className="mt-4 grow">
                  {t.extras.length === 0 ? (
                    <p className="text-lg leading-snug text-tinta-suave">
                      Los {pasos.length} pasos base, completos.
                    </p>
                  ) : (
                    <>
                      <p className="text-lg leading-snug text-tinta-suave">
                        Suma:
                      </p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {t.extras.map((extra) => (
                          <li
                            key={extra}
                            className="rounded-full bg-vino-suave px-3 py-1 text-base font-medium text-vino"
                          >
                            {extra}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-5 w-full ${
                    activo ? "boton-principal" : "boton-suave"
                  }`}
                >
                  {activo ? "Elegido ✓" : "Reservar este"}
                </button>
              </li>
            );
          })}
        </ul>

        {/*
          La consulta va aparte y con otro fondo: no es un tratamiento
          mas de la lista, es la salida para quien no sabe cual elegir.
          Metida entre las otras seis, pasaba desapercibida justo para
          quien mas la necesita.
        */}
        {consulta && (
          <div className="mx-auto mt-3 max-w-5xl rounded-suave bg-vino-suave px-6 py-6 sm:px-8 xl:max-w-none">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-tinta">
                  ¿No sabés cuál elegir?
                </h3>
                <p className="mt-1.5 max-w-xl text-lg leading-snug text-tinta-suave">
                  {consulta.descripcion}
                </p>
              </div>

              <button
                type="button"
                onClick={() => elegirYReservar(consulta.id)}
                className="boton-principal shrink-0 whitespace-nowrap"
              >
                Pedir la consulta
              </button>
            </div>
          </div>
        )}

        {/* Debajo de los precios, que es donde aparece la duda */}
        <p className="mt-6 text-center text-lg text-tinta-suave">
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
