import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { CONSULTORIO } from "@/lib/config";
import { IconoPin } from "./iconos";

/**
 * Cara de Valen y datos de quien atiende.
 *
 * Es lo que convierte "un consultorio desconocido" en "el de Valen". Va
 * antes de los precios a proposito: primero la confianza, despues cuanto
 * sale.
 *
 * Va en dos columnas y no centrada: una foto sola en el medio de una
 * pantalla ancha queda aislada, sin nada que la acompañe. Al lado del
 * texto se leen juntas —la cara y el titulo— que es de lo que se trata
 * la seccion.
 *
 * Sigue la misma regla que los fondos de /public/imagenes: si el archivo
 * no esta, la seccion entera no se muestra. Asi no queda un hueco ni una
 * imagen rota mientras Valen consigue las fotos, y aparece sola el dia
 * que las suba, sin tocar codigo.
 */

const existeFoto = (archivo: string) =>
  existsSync(path.join(process.cwd(), "public", "imagenes", archivo));

export default function Consultorio() {
  const hayValen = existeFoto("valen.jpg");
  const hayConsultorio = existeFoto("consultorio.jpg");
  if (!hayValen && !hayConsultorio) return null;

  return (
    <section
      id="consultorio"
      className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-14 xl:max-w-6xl">
          {hayValen && (
            <Image
              src="/imagenes/valen.jpg"
              alt={`${CONSULTORIO.profesional}, cosmetóloga, en su consultorio`}
              width={1024}
              height={768}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={false}
              className="aspect-4/3 w-full rounded-suave object-cover object-top shadow-suave"
            />
          )}

          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-semibold text-tinta sm:text-5xl">
              Quién te va a atender
            </h2>

            {/*
              El nombre y el titulo, una sola vez cada uno. Antes decia
              "Tecnica UBA" y abajo la carrera completa, que es lo mismo
              dicho dos veces. Lo que se resalta es la UBA: es el dato que
              decide a quien no la conoce.
            */}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="text-2xl font-semibold text-tinta">
                {CONSULTORIO.profesional}
              </span>
              {/* Insignia y no texto corrido: colgaba sola al final del
                  renglon y ahi no resaltaba nada. */}
              <span className="rounded-full bg-vino-suave px-3 py-1 text-sm font-semibold text-vino">
                UBA
              </span>
            </p>

            <p className="mt-2 text-lg leading-snug text-tinta-suave">
              {CONSULTORIO.carrera}
            </p>

            <p className="mt-5 text-lg leading-relaxed text-tinta-suave">
              Formación universitaria, no un curso corto. Te atiende ella
              misma, en {CONSULTORIO.direccion}.
            </p>

            <a
              href="#reservar"
              className="boton-suave mt-7 w-full sm:w-auto sm:px-8"
            >
              Reservar turno
            </a>

            {/*
              Donde queda, con el mismo peso que el resto. La direccion
              sola no ubica a nadie: el punto de referencia y el transporte
              son lo que hace que una persona se anime a salir de la casa.
              Cada dato aparece solo si esta cargado en config.
            */}
            <div className="mt-8 rounded-suave bg-crema-oscuro px-5 py-5 text-left sm:px-6">
              <h3 className="text-lg font-semibold text-tinta">Dónde queda</h3>

              <p className="mt-2 text-lg leading-snug text-tinta">
                {CONSULTORIO.direccion}
              </p>

              {CONSULTORIO.referencia && (
                <p className="mt-1.5 text-lg leading-snug text-tinta-suave">
                  {CONSULTORIO.referencia}
                </p>
              )}

              {CONSULTORIO.transporte && (
                <p className="mt-1.5 text-lg leading-snug text-tinta-suave">
                  {CONSULTORIO.transporte}
                </p>
              )}

              <a
                href={CONSULTORIO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-suave mt-4 w-full bg-white sm:w-auto sm:px-7"
              >
                <IconoPin className="h-5 w-5" />
                Ver en el mapa
              </a>
            </div>
          </div>
        </div>

        {/* Si algun dia se suma la foto del lugar, va debajo y a lo ancho */}
        {hayConsultorio && (
          <figure className="mx-auto mt-10 max-w-5xl xl:max-w-6xl">
            <Image
              src="/imagenes/consultorio.jpg"
              alt="El consultorio donde se hacen los tratamientos"
              width={1600}
              height={900}
              sizes="100vw"
              className="aspect-16/9 w-full rounded-suave object-cover shadow-suave"
            />
            <figcaption className="mt-3 text-center text-lg text-tinta-suave">
              El consultorio, en {CONSULTORIO.direccion.split(",")[1].trim()}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
