"use client";

import { GLOSARIO, esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import { CONSULTORIO } from "@/lib/config";
import TituloSeccion from "./TituloSeccion";

/** ["A", "B", "C"] -> "A, B y C" */
const unir = (items: string[]) =>
  new Intl.ListFormat("es-AR", { style: "long", type: "conjunction" }).format(
    items
  );

export default function Tratamientos() {
  const { tratamientos, agenda, tratamientoId, elegirYReservar } = useReserva();
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

  return (
    <section
      id="tratamientos"
      className="border-t border-borde bg-crema-oscuro py-16 md:py-20 xl:py-24"
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
        <div className="tarjeta mx-auto mt-14 max-w-4xl px-6 py-8 sm:px-8 xl:max-w-none">
          <h3 className="text-center text-lg font-semibold text-tinta">
            Todos incluyen estos {pasos.length} pasos
          </h3>
          <ol className="mx-auto mt-6 grid max-w-2xl gap-x-10 gap-y-4 sm:grid-cols-2 lg:max-w-3xl">
            {pasos.map((paso, i) => (
              <li key={paso} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vino-suave text-base font-semibold text-vino">
                  {i + 1}
                </span>
                <span className="text-base leading-snug">{paso}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Los nombres tecnicos se explican UNA sola vez, igual que los pasos.
            Repetirlos en cada tarjeta llenaba la pantalla de letra chica. */}
        <div className="tarjeta mx-auto mt-4 max-w-4xl px-6 py-8 sm:px-8 xl:max-w-none">
          <h3 className="text-center text-lg font-semibold text-tinta">
            Lo que se suma en algunos
          </h3>
          <dl className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-0">
            {extrasDelCatalogo.map((extra) => (
              <div
                key={extra}
                className="lg:border-l lg:border-borde lg:px-7 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              >
                <dt className="text-base font-semibold text-vino">{extra}</dt>
                <dd className="mt-1.5 text-base leading-snug text-tinta-suave">
                  {GLOSARIO[extra]}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <ul className="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-2 xl:max-w-none xl:grid-cols-3">
          {tratamientos.map((t) => {
            const activo = tratamientoId === t.id;
            const esMasCompleto = maxExtras > 0 && t.extras.length === maxExtras;

            return (
              <li
                key={t.id}
                className={`tarjeta relative flex flex-col px-6 py-6 transition-shadow ${
                  activo ? "ring-2 ring-vino" : ""
                }`}
              >
                {esMasCompleto && (
                  <span className="absolute right-5 top-5 rounded-full bg-vino px-3 py-1 text-xs font-semibold text-white">
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

                <div className="mt-3 grow">
                  <p className="text-base leading-snug text-tinta-suave">
                    {t.descripcion ? (
                      t.descripcion
                    ) : t.extras.length === 0 ? (
                      `Los ${pasos.length} pasos base.`
                    ) : (
                      <>
                        Los {pasos.length} pasos base{" "}
                        <span className="text-tinta">+ {unir(t.extras)}</span>.
                      </>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-5 w-full ${
                    activo ? "boton-principal" : "boton-suave"
                  }`}
                >
                  {activo
                    ? "Elegido ✓"
                    : esConsulta(t)
                      ? "Pedir la consulta"
                      : "Reservar este"}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Debajo de los precios, que es donde aparece la duda */}
        <p className="mt-6 text-center text-base text-tinta-suave">
          Se puede pagar con{" "}
          <span className="font-medium text-tinta">
            {CONSULTORIO.mediosDePago}
          </span>
          .
        </p>
      </div>
    </section>
  );
}
