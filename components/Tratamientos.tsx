"use client";

import { GLOSARIO, esConsulta, formatearPrecio } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import { IconoCheck } from "./iconos";

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
    <section id="tratamientos" className="bg-crema-oscuro py-12 md:py-16">
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Tratamientos
        </h2>

        {/* Los pasos base se explican UNA sola vez */}
        <div className="tarjeta mx-auto mt-6 max-w-4xl px-6 py-5 xl:max-w-none">
          <h3 className="text-lg font-semibold text-tinta">
            Todos incluyen estos {pasos.length} pasos
          </h3>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {pasos.map((paso) => (
              <li key={paso} className="flex items-start gap-2 text-base">
                <IconoCheck className="mt-1.5 h-3.5 w-3.5 shrink-0 text-vino" />
                <span>{paso}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Los nombres tecnicos se explican UNA sola vez, igual que los pasos.
            Repetirlos en cada tarjeta llenaba la pantalla de letra chica. */}
        <div className="tarjeta mx-auto mt-3 max-w-4xl px-6 py-5 xl:max-w-none">
          <h3 className="text-lg font-semibold text-tinta">
            Lo que se suma en algunos
          </h3>
          <ul className="mt-3 grid gap-x-6 gap-y-2 lg:grid-cols-3">
            {extrasDelCatalogo.map((extra) => (
              <li key={extra} className="text-base leading-snug text-tinta-suave">
                <span className="font-medium text-tinta">{extra}:</span>{" "}
                {GLOSARIO[extra]}
              </li>
            ))}
          </ul>
        </div>

        {/* Una tarjeta por tratamiento. En PC van de a dos para no
            obligar a scrollear de más. */}
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
      </div>
    </section>
  );
}
