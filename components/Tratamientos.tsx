"use client";

import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { IconoCheck, IconoReloj } from "./iconos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

export default function Tratamientos() {
  const { tratamientos, consultorio, irAReservar } = useReserva();

  /* Los que se muestran con precio. La consulta no va: no tiene numero. */
  const conPrecio = tratamientos.filter((t) => !esConsulta(t));

  /* De menor a mayor: la lista se recorre como una escalera. `slice`
     porque `sort` ordena en el lugar y `tratamientos` viene del contexto. */
  const porPrecio = conPrecio.slice().sort((a, b) => a.precio - b.precio);

  /*
    La duracion se muestra solo si TODOS duran lo mismo.

    Es lo que la hace decible en una sola linea arriba de la lista. Si
    algun dia Valen carga uno de media hora, la banda deja de afirmar
    algo que seria falso para esa fila y la duracion simplemente no
    aparece: mejor no decirla que decirla mal.
  */
  const duraciones = [...new Set(conPrecio.map((t) => t.duracion))];
  const duracionComun = duraciones.length === 1 ? duraciones[0] : null;

  /*
    "El mas completo" se calcula: es el que suma mas extras. Antes salia
    de la marca `destacado` de la base, y con dos tratamientos marcados
    la etiqueta aparecia tambien sobre la higiene mas simple, que es
    justo lo contrario de lo que dice.

    Y es UNO solo. Contando extras a secas, dos tratamientos empatados
    se llevaban los dos la etiqueta, y "el mas completo" deja de querer
    decir algo cuando hay dos. Hoy pasa: Full Glow y la higiene con
    microneedling y radiofrecuencia suman tres cada uno. El empate lo
    desempata el precio, que es el orden en que la clienta los lee igual.
  */
  const masCompleto = conPrecio.reduce<(typeof tratamientos)[number] | null>(
    (mejor, t) =>
      !mejor ||
      t.extras.length > mejor.extras.length ||
      (t.extras.length === mejor.extras.length && t.precio > mejor.precio)
        ? t
        : mejor,
    null
  );

  /*
    Los extras siempre en el mismo orden, alfabetico.

    En la base cada tratamiento los tiene en el orden en que se cargaron:
    una fila decia "Dermaplaning · Ácidos" y la de abajo "Ácidos ·
    Microneedling". Con el orden fijo, Ácidos cae siempre primero y lo
    que cambia de una fila a la otra salta a la vista.
  */
  const ordenar = (extras: string[]) =>
    extras.slice().sort((a, b) => a.localeCompare(b, "es"));

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
          La lista de precios, para mirar y no para elegir.

          Antes cada tarjeta tenia su boton "Reservar este" y el
          tratamiento viajaba elegido hasta el turno. Elegirlo de
          antemano es pedirle a la clienta una decision que no esta en
          condiciones de tomar: cual corresponde se sabe recien con la
          piel a la vista. Los precios siguen todos publicados —esconder
          lo que sale es lo que hace desconfiar—, pero el turno es uno
          solo y sale como consulta.

          UNA BASE, Y LO QUE SE LE SUMA.

          Lo que comparten todos —la limpieza completa y la duracion— se
          dice UNA vez, arriba. Debajo, una fila por tratamiento, ordenadas
          por precio: la lista se recorre como una escalera y cada peldaño
          agrega algo mas que el anterior.

          Todo en UNA tarjeta, con el cierre adentro. Antes eran tres
          piezas sueltas —la franja de arriba, la lista y una caja rosa
          aparte con el boton— sobre un fondo rosa casi del mismo tono, y
          de lejos se leia como una sola mancha. Ahora es un objeto:
          arriba lo que incluye, al medio los precios, abajo que hacer.
        */}
        <div className="tarjeta mx-auto mt-6 max-w-3xl overflow-hidden xl:max-w-4xl">
          <div className="border-b border-borde px-5 pt-5 pb-4 sm:px-7">
            <h3 className="rotulo-seccion text-sm">Todas incluyen</h3>
            <ul className="mt-2.5 flex flex-wrap gap-x-6 gap-y-2 text-lg leading-snug text-tinta">
              <li className="flex items-center gap-2.5">
                <IconoCheck className="h-5 w-5 shrink-0 text-vino" />
                La limpieza profunda completa
              </li>
              {duracionComun && (
                <li className="flex items-center gap-2.5">
                  <IconoReloj className="h-5 w-5 shrink-0 text-vino" />
                  {duracionComun}
                </li>
              )}
            </ul>
          </div>

          <ul className="divide-y divide-borde px-5 sm:px-7">
            {porPrecio.map((t) => {
              const esMasCompleto = t.id === masCompleto?.id;

              return (
                /* Grilla de dos columnas: el nombre y su precio
                   comparten renglon aunque arriba haya etiqueta, y los
                   extras usan el ancho entero, tambien bajo el precio. */
                <li
                  key={t.id}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-4"
                >
                  {/*
                    La etiqueta va ARRIBA del nombre y no pegada al
                    final. Pegada, en celular caia sola en un renglon
                    entre el nombre y sus extras, y parecia un error de
                    armado.
                  */}
                  {esMasCompleto && (
                    <p className="col-span-2 mb-2">
                      <span className="rounded-full bg-vino px-2.5 py-1 text-sm font-semibold text-white">
                        El más completo
                      </span>
                    </p>
                  )}

                  <h4 className="min-w-0 text-lg leading-snug font-semibold text-tinta">
                    {t.nombre}
                  </h4>

                  {/* Tabular: los precios quedan alineados entre si
                      aunque los nombres midan distinto. */}
                  <p className="text-xl leading-snug font-semibold tabular-nums text-vino">
                    {formatearPrecio(t.precio)}
                  </p>

                  {/*
                    Lo que suma, en etiquetas y no en texto corrido.

                    Es lo unico que distingue una fila de la otra, y como
                    texto gris de 16px era lo que menos se veia. En
                    etiquetas se cuentan de un vistazo: una, dos, tres.
                    El "+" va adentro de cada una porque cada una es algo
                    que se agrega.
                  */}
                  {t.extras.length > 0 && (
                    <ul className="col-span-2 mt-2.5 flex flex-wrap gap-1.5">
                      {ordenar(t.extras).map((extra) => (
                        <li
                          key={extra}
                          className="rounded-full bg-vino-suave px-3 py-1 text-base leading-tight font-medium text-vino"
                        >
                          {/* Para quien escucha la pagina, "+" no se lee:
                              la palabra va escondida y el signo queda de
                              adorno. */}
                          <span aria-hidden>+ </span>
                          <span className="sr-only">Suma </span>
                          {extra}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          {/*
            La unica puerta de entrada. Va con otro fondo porque la lista
            informa y esto es lo que se toca.

            Antes repetia, casi palabra por palabra, lo que se lee dos
            secciones mas arriba: que el turno entra como consulta y que
            Valen define el tratamiento al ver la piel. Aca alcanza con
            una linea.
          */}
          <div className="flex flex-col gap-4 border-t border-borde bg-crema px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <h3 className="text-xl font-semibold text-tinta">
                ¿Cuál te corresponde?
              </h3>
              <p className="mt-1 text-lg leading-snug text-tinta-suave">
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
        <p className="mx-auto mt-5 max-w-3xl text-center text-lg text-balance text-tinta-suave">
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
