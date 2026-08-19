"use client";

import { formatearPrecio, TRATAMIENTOS } from "@/lib/tratamientos";
import { useReserva } from "./ReservaContext";
import { IconoCheck } from "./iconos";

export default function Tratamientos() {
  const { tratamientoId, elegirYReservar } = useReserva();

  return (
    <section id="tratamientos" className="bg-crema-oscuro py-20 md:py-28">
      <div className="contenedor">
        <header className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-vino/70">
            Tratamientos
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-tinta md:text-5xl">
            Elegí tu protocolo
          </h2>
          <p className="mt-5 text-base leading-relaxed text-tinta-suave">
            Todos parten de la Higiene Facial Profunda y suman pasos según el
            objetivo. Si tenés dudas sobre cuál te conviene, escribime y lo
            definimos juntas.
          </p>
        </header>

        <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TRATAMIENTOS.map((t) => {
            const activo = tratamientoId === t.id;
            return (
              <li
                key={t.id}
                className={`flex flex-col rounded-suave border bg-crema p-7 transition-all ${
                  activo
                    ? "border-vino shadow-lg shadow-vino/10"
                    : "border-borde hover:border-vino/30 hover:shadow-md"
                } ${t.destacado ? "lg:col-span-1" : ""}`}
              >
                {t.destacado && (
                  <span className="mb-4 inline-flex w-fit rounded-full bg-vino px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-crema">
                    Más completo
                  </span>
                )}

                <h3 className="font-display text-2xl leading-tight text-tinta">
                  {t.nombre}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
                  {t.descripcion}
                </p>

                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-3xl text-vino">
                    {formatearPrecio(t.precio)}
                  </span>
                  <span className="text-xs text-tinta-suave">· {t.duracion}</span>
                </div>

                <ul className="mt-6 space-y-2.5 border-t border-borde pt-6">
                  {t.pasos.map((paso) => (
                    <li
                      key={paso}
                      className="flex items-start gap-2.5 text-sm text-tinta"
                    >
                      <IconoCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-vino/70" />
                      <span>{paso}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => elegirYReservar(t.id)}
                  className={`mt-8 w-full rounded-full px-6 py-3.5 text-sm font-medium transition-colors ${
                    activo
                      ? "bg-vino text-crema"
                      : "border border-vino/30 text-vino hover:bg-vino hover:text-crema"
                  }`}
                >
                  {activo ? "Seleccionado ✓" : "Reservar este"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
