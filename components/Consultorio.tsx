import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { CONSULTORIO } from "@/lib/config";

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

            <p className="mt-5 text-xl leading-snug text-tinta">
              {CONSULTORIO.profesional}, {CONSULTORIO.titulo}.
            </p>

            <p className="mt-2 text-lg leading-snug text-tinta-suave">
              {CONSULTORIO.carrera}, UBA.
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
            <figcaption className="mt-3 text-center text-base text-tinta-suave">
              El consultorio, en {CONSULTORIO.direccion.split(",")[1].trim()}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
