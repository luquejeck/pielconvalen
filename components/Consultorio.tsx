import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import { CONSULTORIO } from "@/lib/config";
import Adorno from "./Adorno";

/**
 * Cara de Valen y foto del lugar.
 *
 * Es lo que convierte "un consultorio desconocido" en "el de Valen". Va
 * antes de los precios a proposito: primero la confianza, despues cuanto
 * sale.
 *
 * Sigue la misma regla que los fondos de /public/imagenes: si el archivo
 * no esta, la seccion entera no se muestra. Asi no queda un hueco ni una
 * imagen rota mientras Valen consigue las fotos, y aparece sola el dia
 * que las suba, sin tocar codigo.
 */

const FOTOS = [
  {
    archivo: "valen.jpg",
    alt: `${CONSULTORIO.profesional}, cosmetóloga`,
    epigrafe: `${CONSULTORIO.profesional} · ${CONSULTORIO.titulo}`,
  },
  {
    archivo: "consultorio.jpg",
    alt: "El consultorio donde se hacen los tratamientos",
    epigrafe: `El consultorio, en ${CONSULTORIO.direccion.split(",")[1].trim()}`,
  },
];

const existeFoto = (archivo: string) =>
  existsSync(path.join(process.cwd(), "public", "imagenes", archivo));

export default function Consultorio() {
  const fotos = FOTOS.filter((f) => existeFoto(f.archivo));
  if (fotos.length === 0) return null;

  return (
    <section
      id="consultorio"
      className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <h2 className="text-center text-3xl font-semibold text-tinta sm:text-4xl">
          Quién te va a atender
        </h2>
        <Adorno className="mt-5" />

        <div
          className={`mx-auto mt-10 grid max-w-4xl gap-5 ${
            fotos.length > 1 ? "sm:grid-cols-2" : "max-w-xl"
          }`}
        >
          {fotos.map(({ archivo, alt, epigrafe }) => (
            <figure key={archivo} className="tarjeta overflow-hidden">
              <Image
                src={`/imagenes/${archivo}`}
                alt={alt}
                width={800}
                height={600}
                sizes="(min-width: 640px) 50vw, 100vw"
                className="h-64 w-full object-cover sm:h-72"
              />
              <figcaption className="px-5 py-4 text-center text-base text-tinta-suave">
                {epigrafe}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
