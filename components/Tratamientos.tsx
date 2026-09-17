"use client";

import { esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import TituloSeccion from "./TituloSeccion";

/*
  LOS TONOS DE LAS CAPAS, de la mas clara a la mas intensa.

  Van escritos y no calculados: una mezcla lineal entre el crema y el
  vino pasa justo por el color del fondo de la seccion, y esa capa
  quedaba sin bordes, como un hueco en la pila. Estos saltan ese tramo:
  las dos primeras son mas claras que el fondo y las demas, mas oscuras.

  Cada tono trae sus colores de texto, medidos contra ese fondo. El salto
  de la cuarta a la quinta es donde el texto pasa a blanco: ahi la tinta
  deja de leerse bien y el blanco empieza a pasar 4,5:1.

    fondo     texto de la capa
    suave     los extras (4,5:1 o mas)
    precio    el numero (letra grande: alcanza con 3:1, todos pasan 5)
    acento    la etiqueta "El más completo"
*/
const TONOS = [
  { fondo: "#fdfbfc", texto: "#1d0f14", suave: "#6b525a", precio: "#7d0d46", acento: "#7d0d46" },
  { fondo: "#f7e8ee", texto: "#1d0f14", suave: "#6b525a", precio: "#7d0d46", acento: "#7d0d46" },
  { fondo: "#e3c3d1", texto: "#1d0f14", suave: "#5a4148", precio: "#7d0d46", acento: "#7d0d46" },
  { fondo: "#cf9ab3", texto: "#1d0f14", suave: "#3d2a31", precio: "#5d0a34", acento: "#5d0a34" },
  { fondo: "#a24a76", texto: "#ffffff", suave: "#fbeef4", precio: "#ffffff", acento: "#fbeef4" },
  { fondo: "#7d0d46", texto: "#ffffff", suave: "#f3dbe6", precio: "#ffffff", acento: "#f3dbe6" },
];

/*
  Que tono le toca a cada fila.

  Hoy son seis tratamientos y seis tonos, uno para cada uno. Si Valen
  carga menos, se reparten a lo largo de la escala y la ultima sigue
  siendo la mas intensa; si carga mas, se repiten los del medio. Asi la
  pila siempre arranca clara y termina en vino.
*/
function tonoDe(indice: number, total: number) {
  if (total <= 1) return TONOS[0];
  return TONOS[Math.round((indice * (TONOS.length - 1)) / (total - 1))];
}

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
    Los extras siempre en el mismo orden, alfabetico. En la base cada
    tratamiento los tiene en el orden en que se cargaron, y una fila
    decia "Dermaplaning · Ácidos" y la de abajo "Ácidos · Microneedling".
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
          bajada="Todos parten de la misma limpieza. La diferencia es lo que se suma."
        />

        {/*
          CAPAS.

          La bajada dice "todos parten de la misma limpieza, la
          diferencia es lo que se le suma". Esto lo dibuja: cada
          tratamiento es una capa apoyada sobre la anterior, y cada capa
          es un tono mas intensa, del crema al vino. El mas completo
          queda abajo de todo y en vino pleno, y se distingue sin
          necesidad de un cartel.

          Antes fue una lista de precios con renglones divididos y
          despues con etiquetas; las dos se leian como una planilla.

          Las capas se pisan 20px: la de abajo tapa el borde inferior de
          la de arriba, y por las esquinas redondeadas asoma el tono
          anterior. Cada una es `relative` para que se pinten en orden y
          ninguna deje ver el texto de la que tiene encima. El margen
          inferior de cada capa (pb-9) es mas grande que lo que se pisa,
          asi que el texto nunca queda tapado.

          La lista de precios es para mirar, no para elegir: cual
          corresponde se sabe recien con la piel a la vista. Por eso no
          hay un boton por capa, sino uno solo abajo.
        */}
        <ul className="mx-auto mt-8 max-w-3xl xl:max-w-4xl">
          {porPrecio.map((t, i) => {
            const tono = tonoDe(i, porPrecio.length);
            const esMasCompleto = t.id === masCompleto?.id;
            const esUltima = i === porPrecio.length - 1;

            return (
              <li
                key={t.id}
                style={{ backgroundColor: tono.fondo, color: tono.texto }}
                className={`relative flex items-baseline justify-between gap-4 rounded-suave px-5 pt-4 sm:px-8 sm:pt-5 ${
                  i > 0 ? "-mt-5" : ""
                } ${esUltima ? "pb-5 sm:pb-6" : "pb-9 sm:pb-10"}`}
              >
                <div className="min-w-0">
                  {esMasCompleto && (
                    <p
                      style={{ color: tono.acento }}
                      className="mb-1 font-display text-sm font-medium tracking-[0.16em] uppercase"
                    >
                      El más completo
                    </p>
                  )}

                  <h3 className="font-display text-lg leading-snug font-medium">
                    {t.nombre}
                  </h3>

                  {t.extras.length > 0 && (
                    <p
                      style={{ color: tono.suave }}
                      className="mt-1 text-base leading-snug"
                    >
                      {/* Para quien escucha la pagina, "+" no se lee: la
                          palabra va escondida y el signo queda de adorno. */}
                      <span aria-hidden>+ </span>
                      <span className="sr-only">Suma </span>
                      {ordenar(t.extras).join(" · ")}
                    </p>
                  )}
                </div>

                {/* Tabular: los precios quedan alineados entre si aunque
                    los nombres midan distinto. */}
                <p
                  style={{ color: tono.precio }}
                  className="shrink-0 font-display text-xl font-medium tabular-nums"
                >
                  {formatearPrecio(t.precio)}
                </p>
              </li>
            );
          })}
        </ul>

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

          <p className="mt-4 text-base leading-snug text-balance text-tinta-suave">
            {duracionComun && <>{duracionComun} por sesión · </>}
            {consultorio.mediosDePago}
          </p>
        </div>
      </div>
    </section>
  );
}
