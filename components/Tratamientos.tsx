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
    <section id="tratamientos" className="bg-crema-oscuro py-12 md:py-16">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Tratamientos
        </h2>

        {/* Los pasos base se explican UNA sola vez */}
        <div className="mx-auto mt-6 max-w-3xl rounded-suave bg-crema px-6 py-5">
          <h3 className="text-lg font-semibold text-tinta">
            Todos incluyen estos 7 pasos
          </h3>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {PASOS_BASE.map((paso) => (
              <li key={paso} className="flex items-start gap-2 text-base">
                <IconoCheck className="mt-1.5 h-3.5 w-3.5 shrink-0 text-vino" />
                <span>{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-lg text-tinta-suave">
          La diferencia entre uno y otro es lo que se suma:
        </p>

        {/* Una tarjeta por tratamiento. En PC van de a dos para no
            obligar a scrollear de más. */}
        <ul className="mx-auto mt-4 grid max-w-3xl gap-3 lg:grid-cols-2">
          {TRATAMIENTOS.map((t) => {
            const activo = tratamientoId === t.id;

            return (
              <li
                key={t.id}
                className={`flex flex-col rounded-suave border px-5 py-4 transition-colors ${
                  activo
                    ? "border-vino bg-vino-suave"
                    : "border-borde bg-crema"
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

                <p className="mt-1 grow text-base leading-snug text-tinta-suave">
                  {t.extras.length === 0 ? (
                    "Los 7 pasos base."
                  ) : (
                    <>
                      Los 7 pasos base{" "}
                      <span className="text-tinta">+ {unir(t.extras)}</span>.
                    </>
                  )}
                  {t.destacado && (
                    <span className="ml-1 text-vino">El más completo.</span>
                  )}
                </p>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-3 min-h-12 w-full rounded-full px-6 text-base font-medium transition-colors ${
                    activo
                      ? "bg-vino text-crema"
                      : "border border-vino text-vino hover:bg-vino hover:text-crema"
                  }`}
                >
                  {activo ? "Elegido ✓" : "Reservar este"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
