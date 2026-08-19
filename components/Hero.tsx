import { CONSULTORIO } from "@/lib/config";
import { IconoFlecha, IconoPin, IconoReloj } from "./iconos";

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-linear-to-b from-rosa via-crema to-crema"
    >
      {/* Halos decorativos */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-rosa-medio/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 top-40 h-64 w-64 rounded-full bg-vino-suave/60 blur-3xl"
      />

      <div className="contenedor relative animar-entrada py-20 md:py-32">
        <p className="mb-5 text-[11px] uppercase tracking-[0.3em] text-vino/70">
          Caballito · CABA
        </p>

        <h1 className="font-display text-[2.6rem] leading-[1.05] tracking-tight text-tinta sm:text-6xl md:text-7xl">
          {CONSULTORIO.profesional}
          <span className="mt-2 block text-2xl font-light text-vino sm:text-3xl md:text-4xl">
            {CONSULTORIO.titulo}
          </span>
        </h1>

        <p className="mt-8 max-w-md font-display text-2xl italic leading-snug text-tinta-suave sm:text-3xl">
          «{CONSULTORIO.eslogan}»
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#reservar"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-vino px-8 py-4 text-base font-medium text-crema shadow-lg shadow-vino/20 transition-all hover:bg-vino-oscuro hover:shadow-xl active:scale-[0.98]"
          >
            Reservar Turno
            <IconoFlecha className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>

          <a
            href="#tratamientos"
            className="inline-flex items-center justify-center rounded-full border border-vino/25 px-8 py-4 text-base text-vino transition-colors hover:bg-vino-suave"
          >
            Ver tratamientos
          </a>
        </div>

        <dl className="mt-14 flex flex-wrap gap-x-8 gap-y-3 text-sm text-tinta-suave">
          <div className="flex items-center gap-2">
            <IconoPin className="h-4 w-4 text-vino/60" />
            <dd>{CONSULTORIO.direccion}</dd>
          </div>
          <div className="flex items-center gap-2">
            <IconoReloj className="h-4 w-4 text-vino/60" />
            <dd>Sesiones de 1.5 a 2 hs</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
