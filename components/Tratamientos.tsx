"use client";

import { formatearPrecio, PASOS_BASE, TRATAMIENTOS } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import { IconoCheck } from "./iconos";

/** ["A", "B", "C"] -> "A, B y C" */
const unir = (items: string[]) =>
  new Intl.ListFormat("es-AR", { style: "long", type: "conjunction" }).format(
    items
  );

export default function Tratamientos() {
  const { tratamientoId, elegirYReservar } = useReserva();

  return (
    <section id="tratamientos" className="bg-crema-oscuro py-20 md:py-24">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Tratamientos
        </h2>

        {/* Los pasos base se explican UNA sola vez */}
        <div className="mx-auto mt-10 max-w-2xl rounded-suave bg-crema p-7 sm:p-8">
          <h3 className="text-xl font-semibold text-tinta">
            Todos incluyen estos 7 pasos
          </h3>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {PASOS_BASE.map((paso) => (
              <li key={paso} className="flex items-start gap-3 text-lg">
                <IconoCheck className="mt-1.5 h-4 w-4 shrink-0 text-vino" />
                <span>{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-12 text-center text-lg text-tinta-suave">
          La diferencia entre uno y otro es lo que se suma:
        </p>

        {/* Una fila por tratamiento: nombre, precio y que agrega */}
        <ul className="mx-auto mt-6 max-w-2xl divide-y divide-borde overflow-hidden rounded-suave border border-borde bg-crema">
          {TRATAMIENTOS.map((t) => {
            const activo = tratamientoId === t.id;

            return (
              <li
                key={t.id}
                className={`p-6 transition-colors sm:p-8 ${
                  activo ? "bg-vino-suave" : ""
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h3 className="text-xl font-semibold text-tinta sm:text-2xl">
                    {t.nombre}
                  </h3>
                  <p className="text-xl font-semibold whitespace-nowrap text-vino sm:text-2xl">
                    {formatearPrecio(t.precio)}
                  </p>
                </div>

                <p className="mt-2 text-lg text-tinta-suave">
                  {t.extras.length === 0 ? (
                    "Los 7 pasos base."
                  ) : (
                    <>
                      Los 7 pasos base{" "}
                      <span className="text-tinta">
                        + {unir(t.extras)}
                      </span>
                      .
                    </>
                  )}
                  {t.destacado && (
                    <span className="ml-2 text-vino">El más completo.</span>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-5 min-h-14 w-full rounded-full px-8 text-lg font-medium transition-colors sm:w-auto ${
                    activo
                      ? "bg-vino text-crema"
                      : "border border-vino text-vino hover:bg-vino hover:text-crema"
                  }`}
                >
                  {activo ? "Elegido ✓" : "Elegir este"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
