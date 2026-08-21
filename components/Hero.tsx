import { CONSULTORIO } from "@/lib/config";
import FondoImagen from "./FondoImagen";
import { IconoPin, IconoReloj } from "./iconos";

export default function Hero() {
  return (
    <section id="inicio" className="relative isolate bg-crema-oscuro">
      <FondoImagen
        imagen="/imagenes/hero.jpg"
        intensidad={70}
        velo="bg-linear-to-b from-crema/60 via-crema/78 to-crema"
      />

      <div className="contenedor animar-entrada py-16 text-center md:py-20 xl:py-24">
        <h1 className="text-5xl font-semibold text-tinta sm:text-6xl xl:text-7xl">
          {CONSULTORIO.profesional}
        </h1>

        <p className="mt-4 text-lg font-medium text-vino sm:text-xl">
          Cosmetóloga · {CONSULTORIO.titulo}
        </p>

        <p className="mx-auto mt-6 max-w-2xl text-2xl leading-tight text-tinta-suave sm:text-3xl">
          {CONSULTORIO.eslogan}
        </p>


        <a href="#reservar" className="boton-principal mt-9">
          Reservar turno
        </a>

        <ul className="mt-8 flex flex-col items-center gap-1.5 text-lg text-tinta-suave sm:flex-row sm:justify-center sm:gap-6">
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
