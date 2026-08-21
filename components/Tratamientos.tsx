"use client";

import { GLOSARIO, esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import { CONSULTORIO } from "@/lib/config";
import Adorno from "./Adorno";

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

  return (
    <section
      id="tratamientos"
      className="border-t border-borde bg-crema-oscuro py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Tratamientos
        </h2>
        <Adorno className="mt-5" />

        {/*
          Los pasos base se explican UNA sola vez. Van numerados porque son
          una secuencia, no una lista suelta: se lee el orden en que pasan
          las cosas sobre la camilla.
        */}
        <div className="tarjeta mx-auto mt-10 max-w-4xl px-6 py-7 sm:px-8 xl:max-w-none">
          <h3 className="text-center text-lg font-semibold text-tinta">
            Todos incluyen estos {pasos.length} pasos
          </h3>
          <ol className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <div className="tarjeta mx-auto mt-4 max-w-4xl px-6 py-7 sm:px-8 xl:max-w-none">
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

            return (
              <li
                key={t.id}
                className={`tarjeta flex flex-col px-5 py-4 transition-colors ${
                  activo ? "border-vino bg-vino-suave" : ""
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h3 className="text-xl font-semibold text-tinta">
                    {t.nombre}
                  </h3>
                  <p className="text-xl font-semibold whitespace-nowrap text-vino">
                    {formatearPrecio(t.precio)}
                  </p>
                </div>

                <div className="mt-1 grow">
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
                    {t.destacado && (
                      <span className="ml-1 text-vino">El más completo.</span>
                    )}
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-3 min-h-12 w-full rounded-full px-6 text-base font-medium transition-colors ${
                    activo
                      ? "bg-vino text-crema"
                      : "border border-vino text-vino hover:bg-vino hover:text-crema"
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
