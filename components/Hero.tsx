import { CONSULTORIO } from "@/lib/config";
import FondoImagen from "./FondoImagen";
import { IconoPin, IconoReloj } from "./iconos";

export default function Hero() {
  return (
    <section id="inicio" className="relative isolate bg-crema-oscuro">
      {/*
        La foto baja a la mitad de intensidad y se desatura: antes competia
        con el titulo y traia su propio color, distinto al del resto de la
        pagina. Ahora es atmosfera, no imagen.
      */}
      <FondoImagen
        imagen="/imagenes/hero.jpg"
        intensidad={38}
        filtro="saturate(0.72) contrast(0.95)"
        velo="bg-linear-to-b from-crema/72 via-crema/82 to-crema"
      />

      <div className="contenedor animar-entrada py-16 text-center md:py-20 xl:py-24">
        <h1 className="text-5xl font-semibold text-tinta sm:text-6xl xl:text-7xl">
          {CONSULTORIO.profesional}
        </h1>

        {/*
          La credencial en versalitas espaciadas. Es la misma informacion
          de antes, formateada como rotulo: da el aire editorial sin sumar
          una palabra mas.
        */}
        {/*
          En celular la credencial no entra en un renglon, asi que va en
          dos y el separador desaparece: partida al medio, el "·" quedaba
          colgando solo al final de la primera linea.
        */}
        <p className="rotulo-seccion mt-5 flex flex-col items-center gap-x-2.5 sm:flex-row sm:justify-center">
          <span>{CONSULTORIO.profesion}</span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span>{CONSULTORIO.titulo}</span>
        </p>

        <p className="mx-auto mt-8 max-w-2xl text-2xl font-light leading-snug text-tinta-suave sm:text-3xl">
          {CONSULTORIO.eslogan}
        </p>

        {/*
          Que se hace aca, dicho sin tecnicismos.

          La primera pantalla decia nombre, credencial y eslogan: todo
          cierto y ninguna de las tres cuenta que esto es una limpieza de
          cutis. "Cosmetologa" no es transparente para todo el mundo —hay
          quien la asocia a maquillaje o a venta de cremas— y quien llega
          por un link de WhatsApp no trae ningun contexto. Tenia que bajar
          dos pantallas hasta Tratamientos para enterarse.
        */}
        <p className="mt-4 text-lg text-tinta-suave">
          {CONSULTORIO.queSeHace} en {CONSULTORIO.direccion.split(",")[1].trim()}
        </p>

        <a href="#reservar" className="boton-principal mt-10">
          Reservar turno
        </a>

        <ul className="mt-10 flex flex-col items-center gap-1.5 text-lg text-tinta-suave sm:flex-row sm:justify-center sm:gap-6">
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
