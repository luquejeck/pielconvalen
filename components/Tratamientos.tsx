"use client";

import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

export default function Tratamientos() {
  const { tratamientos, agenda, consultorio, irAReservar } = useReserva();
  /* El glosario tambien se edita desde el panel: son las explicaciones
     en castellano de los nombres tecnicos. */
  const GLOSARIO = consultorio.glosario;

  /*
    Un renglon del panel = un paso. Los vacios se descartan para que un
    Enter de mas no abra un hueco en la web.

    Cada renglon puede venir como "Titulo | texto". La barra es opcional:
    sin ella el paso queda solo con su texto, que es como estaban
    escritos los tres originales. Se parte en la PRIMERA barra nada mas,
    asi que el texto puede llevar todas las que quiera.
  */
  const comoTrabajo = agenda.comoTrabajo
    .split("\n")
    .map((renglon) => renglon.trim())
    .filter(Boolean)
    .map((renglon) => {
      const barra = renglon.indexOf("|");
      if (barra === -1) return { titulo: null, texto: renglon };
      return {
        titulo: renglon.slice(0, barra).trim() || null,
        texto: renglon.slice(barra + 1).trim(),
      };
    });

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
          Como trabaja ella, con sus palabras.

          Aca antes habia siete pasos numerados, iguales para todo el
          mundo. Prometian lo contrario de lo que pasa en la camilla: no
          hay una receta que se repita sesion tras sesion, hay una piel
          que se mira antes de empezar y un tratamiento que se arma con
          eso y con lo que la clienta pide. Una lista numerada dice
          "protocolo"; un texto en primera persona dice "te miro a vos".

          Se lee como un parrafo y no como una ficha tecnica: es la unica
          parte de la seccion donde habla ella y no el catalogo.
        */}
        {comoTrabajo.length > 0 && (
          <div className="tarjeta mx-auto mt-8 max-w-4xl px-6 py-7 sm:px-8 xl:max-w-none">
            {/* Mismo rotulo que el bloque de abajo: son un par y antes
                tenian dos titulos distintos, uno centrado y otro no. */}
            <h3 className="rotulo-seccion">Cómo trabajo</h3>

            {/*
              Tres tiempos, no tres parrafos.

              Antes esto era un bloque de texto corrido de media pantalla
              de alto: todo cierto, y todo del mismo peso, asi que no
              habia por donde entrar. Adentro habia tres momentos bien
              distintos —te miro, armo la sesion, por eso ninguna se
              repite— que quedaban enterrados en el medio del renglon.

              Separados y numerados se leen de un vistazo aunque no se
              lea una palabra: se ve que son tres pasos y en que orden
              van. El numero grande y palido es el mismo recurso que usan
              las tarjetas de video, asi la pagina repite un gesto en vez
              de inventar uno nuevo en cada seccion.

              Una columna por paso y no tres renglones largos: la linea
              corta es lo que hace que esto deje de leerse como un texto
              legal.
            */}
            {/*
              En celular el numero va a la izquierda y en PC arriba.

              Arriba, en una sola columna, cada numero se comia un
              renglon entero: tres numeros, tres renglones, y el bloque
              terminaba MAS alto que el parrafo corrido que vino a
              reemplazar. De costado no cuesta nada de alto y ademas
              arma la sangria que separa un paso del otro.

              En pantalla ancha son tres columnas de verdad, y ahi el
              numero arriba funciona: encabeza su columna.
            */}
            <ol className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
              {comoTrabajo.map(({ titulo, texto }, i) => (
                <li key={i} className="flex gap-4 sm:block">
                  <span
                    aria-hidden
                    className="w-7 shrink-0 text-2xl font-semibold tabular-nums leading-tight text-vino/35 sm:w-auto"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    {titulo && (
                      <h4 className="text-xl font-semibold text-tinta sm:mt-1">
                        {titulo}
                      </h4>
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
        )}

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
          <div className="mx-auto mt-4 max-w-4xl rounded-suave bg-vino-suave px-6 py-6 sm:px-8 xl:max-w-none">
            <h3 className="rotulo-seccion">Lo que se suma en algunos</h3>

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
          </div>
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
        <ul className="mx-auto mt-5 grid max-w-5xl gap-3 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
          {tratamientos.filter((t) => !esConsulta(t)).map((t) => {
            const esMasCompleto = maxExtras > 0 && t.extras.length === maxExtras;

            return (
              <li
                key={t.id}
                /*
                  El mas completo ocupa dos columnas: cierra la grilla, que
                  con cinco tarjetas dejaba un hueco, y de paso el que mas
                  suma es el que mas espacio ocupa.
                */
                className={`tarjeta relative flex flex-col px-6 py-5 ${
                  esMasCompleto ? "sm:col-span-2 xl:col-span-2" : ""
                }`}
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

                <p className="mt-1 text-2xl font-semibold text-vino">
                  {formatearPrecio(t.precio)}
                </p>

                {/*
                  Lo que suma, en fichas y no en una frase. Los seis
                  decian "Los 7 pasos base + ..." y de lejos se leian
                  todos iguales; asi se ve de un vistazo que cada uno
                  agrega una ficha mas que el anterior.
                */}
                <div className="mt-3 grow">
                  {t.extras.length === 0 ? (
                    <p className="text-lg leading-snug text-tinta-suave">
                      La limpieza profunda completa.
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
              <h3 className="text-xl font-semibold text-tinta">
                El turno se saca como consulta
              </h3>
              <p className="mt-1.5 max-w-xl text-lg leading-snug text-tinta-suave">
                No hace falta que elijas: Valen te mira la piel al llegar y
                ahí definen juntas cuál de estos te corresponde y cuánto sale.
                Sin compromiso.
              </p>
            </div>

            <button
              type="button"
              onClick={irAReservar}
              className="boton-principal shrink-0 whitespace-nowrap"
            >
              Pedir un turno
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
