import Image from "next/image";
import fotoValen from "@/public/imagenes/valen.jpg";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { IconoCheck } from "./iconos";

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
 * Que fotos hay se declara en CONSULTORIO.fotos, no se le pregunta al
 * disco. Preguntarle al disco (`existsSync` sobre /public) funciona en
 * la maquina de casa y falla en Vercel, donde esa carpeta la sirve el
 * CDN y no viaja adentro de la funcion: la respuesta era siempre "no
 * esta" y la seccion entera desaparecia del sitio publicado.
 */

export default function Consultorio({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const { valen: hayValen, consultorio: hayConsultorio } = CONSULTORIO.fotos;
  if (!hayValen && !hayConsultorio) return null;

  return (
    <section
      id="consultorio"
      className="border-t border-borde bg-crema py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <div className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:max-w-6xl">
          {/*
            El retrato es cuadrado y el marco tambien.

            Antes el marco era 4:3 con object-top, que sobre una foto
            cuadrada corta el cuarto de abajo. Justo ahi esta el logo
            bordado en la chaqueta —"VG · Piel con Valen"—, que es el
            detalle que muestra marca y profesion de un vistazo. El
            recorte se lo comia por la mitad.

            Y la foto se IMPORTA, no se nombra por su ruta. Escrita como
            "/imagenes/valen.jpg", la direccion que genera el optimizador
            es siempre la misma, asi que al reemplazar el archivo con el
            mismo nombre se seguia sirviendo la version vieja desde la
            cache: cambias la foto, publicas, y sigue apareciendo la
            anterior. Importandola, la direccion lleva el hash del
            contenido, y ademas Next lee solo el alto y el ancho reales,
            asi que no hay numeros escritos a mano que se desactualicen.
          */}
          {hayValen && (
            <Image
              src={fotoValen}
              alt={`${CONSULTORIO.profesional}, ${CONSULTORIO.profesion.toLowerCase()}`}
              sizes="(min-width: 1024px) 46vw, 100vw"
              placeholder="blur"
              className="aspect-square w-full rounded-suave object-cover shadow-suave"
            />
          )}

          <div className="text-center lg:text-left">
            <h2 className="text-4xl font-semibold text-tinta sm:text-5xl">
              Quién te va a atender
            </h2>

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
              {CONSULTORIO.matricula && ` · Matrícula ${CONSULTORIO.matricula}`}
              {CONSULTORIO.experiencia && ` · ${CONSULTORIO.experiencia}`}
            </p>

            {/*
              Que hable ella. Todo el resto del sitio habla DE Valen y eso
              se lee como publicidad, porque lo es. Dos oraciones en
              primera persona cambian a quien le estas creyendo: no a la
              pagina, a la persona que te va a tocar la cara.
            */}
            {CONSULTORIO.bio && (
              <p className="mt-5 text-lg leading-relaxed text-tinta">
                {CONSULTORIO.bio}
              </p>
            )}

            {/*
              Las tres garantias, en fila y como sellos.

              Antes eran una lista con vinetas adentro de una caja con
              titulo propio, debajo de otra caja con titulo propio. Tres
              bloques apilados se leen como un formulario; esto se lee de
              un vistazo, que es lo que tiene que pasar.
            */}
            {CONSULTORIO.protocolo.length > 0 && (
              /*
                Apiladas en celular y en fila desde tablet. Con
                flex-wrap a secas caia una arriba y dos apretadas abajo,
                con los tildes de cada una pegados al texto de la
                anterior. Tres garantias mal cortadas dejan de leerse
                como garantias.
              */
              <ul className="mx-auto mt-6 flex w-fit flex-col items-start gap-2 sm:mx-0 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 lg:justify-start">
                {CONSULTORIO.protocolo.slice(0, 3).map((punto) => (
                  <li
                    key={punto}
                    className="flex items-center gap-2 text-base font-medium text-tinta"
                  >
                    <IconoCheck className="h-4 w-4 shrink-0 text-vino" />
                    {punto}
                  </li>
                ))}
              </ul>
            )}

            {/*
              La direccion en un renglon, no en una caja aparte: ya esta
              en la portada y en el pie, y aca lo que importa es quien
              atiende, no como llegar.
            */}
            <p className="mt-6 text-lg leading-snug text-tinta-suave">
              Te atiendo en {CONSULTORIO.direccion}.{" "}
              <a
                href={CONSULTORIO.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap font-medium text-vino underline underline-offset-2"
              >
                Ver en el mapa
              </a>
            </p>

            {(CONSULTORIO.referencia || CONSULTORIO.transporte) && (
              <p className="mt-1.5 text-lg leading-snug text-tinta-suave">
                {[CONSULTORIO.referencia, CONSULTORIO.transporte]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}

            <a
              href="#reservar"
              className="boton-principal mt-8 w-full sm:w-auto sm:px-9"
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
            <figcaption className="mt-3 text-center text-lg text-tinta-suave">
              El consultorio, en {CONSULTORIO.direccion.split(",")[1].trim()}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
