import Image from "next/image";
import type { Caso } from "@/lib/casos";
import TituloSeccion from "./TituloSeccion";

/**
 * Antes y después.
 *
 * En cosmetologia es lo que mas convence: nadie reserva por leer "piel
 * mas luminosa", reserva por ver una piel. Va despues de "Que vas a
 * notar" —que lo dice con palabras— y antes de los precios, para que
 * cuando llegue el numero ya sepa que esta comprando.
 *
 * Las dos fotos van UNA AL LADO DE LA OTRA y no en un deslizador con
 * manija: el control de arrastrar no se entiende solo, y con dedos poco
 * firmes es directamente un obstaculo. Lado a lado se compara de un
 * vistazo, sin tocar nada.
 *
 * Si no hay casos cargados, la seccion no existe.
 */
export default function Casos({ casos }: { casos: Caso[] }) {
  if (casos.length === 0) return null;

  return (
    <section
      id="casos"
      className="border-t border-borde bg-crema-oscuro py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <TituloSeccion
          titulo="Antes y después"
          bajada="Fotos reales de clientas, publicadas con su permiso."
        />

        <ul className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-2 xl:max-w-none">
          {casos.map((caso) => (
            <li key={caso.id} className="tarjeta overflow-hidden">
              <div className="grid grid-cols-2">
                <Figura url={caso.antes} rotulo="Antes" alt={`Antes: ${caso.titulo}`} />
                <Figura
                  url={caso.despues}
                  rotulo="Después"
                  alt={`Después: ${caso.titulo}`}
                  destacado
                />
              </div>

              <div className="px-5 py-5">
                <h3 className="text-xl font-semibold text-tinta">{caso.titulo}</h3>
                {caso.tratamiento && (
                  <p className="mt-1.5">
                    <span className="inline-flex rounded-full bg-vino-suave px-3 py-1 text-base font-medium text-vino">
                      {caso.tratamiento}
                    </span>
                  </p>
                )}
                {caso.descripcion && (
                  <p className="mt-3 text-lg leading-relaxed text-tinta-suave">
                    {caso.descripcion}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/*
          Se dice sin adornos. Prometer el mismo resultado a todas es lo
          que hace que despues alguien se sienta estafada.
        */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-tinta-suave">
          Cada piel responde distinto. Estas son fotos de clientas reales, sin
          retoque, pero no son una promesa de resultado.
        </p>
      </div>
    </section>
  );
}

function Figura({
  url,
  rotulo,
  alt,
  destacado = false,
}: {
  url: string;
  rotulo: string;
  alt: string;
  destacado?: boolean;
}) {
  return (
    <figure className="relative">
      <Image
        src={url}
        alt={alt}
        width={600}
        height={600}
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="aspect-square w-full object-cover"
      />
      {/* El rotulo va ENCIMA de la foto: debajo, en dos columnas, se
          despegaba de su imagen y habia que adivinar cual era cual. */}
      <figcaption
        className={`absolute left-3 top-3 rounded-full px-3 py-1 text-base font-semibold ${
          destacado ? "bg-vino text-crema" : "bg-white/90 text-tinta"
        }`}
      >
        {rotulo}
      </figcaption>
    </figure>
  );
}
