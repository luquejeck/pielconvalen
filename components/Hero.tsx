import { CONSULTORIO } from "@/lib/config";
import { IconoPin, IconoReloj } from "./iconos";

export default function Hero() {
  return (
    <section id="inicio" className="bg-rosa/50">
      <div className="contenedor animar-entrada py-20 text-center md:py-28">
        <h1 className="text-4xl font-semibold text-tinta sm:text-5xl">
          {CONSULTORIO.profesional}
        </h1>

        <p className="mt-4 text-xl text-vino sm:text-2xl">
          Cosmetóloga · {CONSULTORIO.titulo}
        </p>

        <p className="mx-auto mt-8 max-w-xl text-2xl leading-snug text-tinta sm:text-3xl">
          {CONSULTORIO.eslogan}
        </p>

        <p className="mx-auto mt-6 max-w-lg text-lg text-tinta-suave">
          Tratamientos faciales personalizados en Caballito. Cada sesión se
          adapta a tu piel y a lo que necesita hoy.
        </p>

        <a href="#reservar" className="boton-principal mt-10">
          Reservar turno
        </a>

        <ul className="mt-10 flex flex-col items-center gap-3 text-base text-tinta-suave sm:flex-row sm:justify-center sm:gap-8">
          <li className="flex items-center gap-2">
            <IconoPin className="h-5 w-5 text-vino" />
            {CONSULTORIO.direccion}
          </li>
          <li className="flex items-center gap-2">
            <IconoReloj className="h-5 w-5 text-vino" />
            Sesiones de 1.5 a 2 horas
          </li>
        </ul>
      </div>
    </section>
  );
}
