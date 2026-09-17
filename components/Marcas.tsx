import Image from "next/image";
import Link from "next/link";
import { marcasConFoto } from "@/lib/productos";
import TituloTienda from "./TituloTienda";

/**
 * El mosaico de marcas: una grande y cuatro chicas.
 *
 * Es la seccion que pidio Lucas, con la estructura de la tienda que paso
 * de referencia. Contesta una pregunta que la grilla de productos no
 * contesta: "¿que marcas trae?". Quien ya usa Beauty of Joseon entra
 * buscando la marca, no una crema, y sin esto tiene que recorrer trece
 * fichas para descubrir si esta.
 *
 * POR QUE UNA GRANDE Y CUATRO CHICAS
 * Porque hoy hay exactamente cinco marcas publicadas y entran justo en
 * ese molde. El lugar grande se lo lleva la que mas productos tiene
 * —hoy Beauty of Joseon, con cinco— y eso se calcula, no se elige a
 * mano: cuando Valen cargue o saque productos el mosaico se reordena
 * solo. Si algun dia hay mas de cinco marcas, las que sobran caen abajo
 * en el mismo tamaño que las chicas y no se rompe nada.
 *
 * El nombre va sobre la foto y no debajo: es una puerta con cartel, no
 * una ficha. El degrade de abajo existe para eso, porque sobre el envase
 * claro el texto blanco desaparecia.
 */
export default function Marcas() {
  const marcas = marcasConFoto();
  if (marcas.length === 0) return null;

  const [principal, ...resto] = marcas;

  return (
    <section
      id="marcas"
      className="border-t border-borde bg-crema py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <TituloTienda titulo="Las marcas" />

        <div className="mt-8 grid gap-3 sm:gap-4 lg:grid-cols-2">
          <Tarjeta marca={principal} grande />

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {resto.map((m) => (
              <Tarjeta key={m.slug} marca={m} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Tarjeta({
  marca,
  grande = false,
}: {
  marca: ReturnType<typeof marcasConFoto>[number];
  grande?: boolean;
}) {
  return (
    <Link
      href={`/productos?marca=${marca.slug}`}
      className="group relative block overflow-hidden rounded-chico bg-tinta"
      aria-label={`Ver los ${marca.cuantos} productos de ${marca.nombre}`}
    >
      <Image
        src={marca.foto}
        alt=""
        width={640}
        height={640}
        sizes={grande ? "(min-width: 1024px) 34rem, 92vw" : "(min-width: 1024px) 17rem, 45vw"}
        className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
          grande ? "aspect-4/3 lg:aspect-square" : "aspect-square"
        }`}
      />

      {/*
        El degrade va del transparente al tinta para que el nombre se lea
        siempre. Sin el, el texto blanco caia sobre la caja clara de la
        Dynasty Cream y desaparecia.
      */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-tinta to-transparent"
      />

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
        <span
          className={`font-display font-semibold tracking-[0.06em] text-crema uppercase ${
            grande ? "text-lg sm:text-2xl" : "text-sm sm:text-base"
          }`}
        >
          {marca.nombre}
        </span>

        {/* La barrita del margen derecho, como en la referencia. */}
        <span aria-hidden className="mb-1 h-5 w-1 shrink-0 bg-crema" />
      </span>
    </Link>
  );
}
