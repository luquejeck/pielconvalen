import { existsSync, readFileSync } from "node:fs";
import Image from "next/image";
import Link from "next/link";
import { marcasConFoto } from "@/lib/productos";
import TituloTienda from "./TituloTienda";

/**
 * La imagen de la marca, con la foto de producto como respaldo.
 *
 * Las piezas de marca —el banner de Medicube, la linea completa de
 * Beauty of Joseon— las prepara `npm run fotos` desde fotos-marcas/. Si
 * una marca todavia no tiene la suya, el mosaico cae en la foto del
 * producto mas caro de esa marca y se ve bien igual: nunca queda un
 * hueco esperando que alguien suba un archivo.
 *
 * Se mira el disco y no una lista escrita a mano porque esto es un
 * componente de servidor y el archivo esta ahi: cualquier lista seria
 * una segunda cosa que mantener y que se puede desincronizar.
 */
function imagenDe(marca: { slug: string; foto: string }) {
  const propia = `/imagenes/marcas/${marca.slug}.webp`;
  return existsSync(`public${propia}`) ? propia : marca.foto;
}

/**
 * Que marcas tienen LOGO y no foto.
 *
 * Lo decide `npm run fotos` midiendo cuanto de la imagen es casi blanco:
 * un logo es casi todo fondo y una foto no. Las dos cosas se dibujan
 * distinto y por eso hace falta saberlo:
 *
 *   LOGO   fondo claro, la imagen entera sin recortar y con aire
 *          alrededor, y el nombre debajo en tinta. Sin degrade: un velo
 *          oscuro sobre un logo blanco es una mancha.
 *   FOTO   ocupa todo el cuadro, degrade abajo y el nombre en crema.
 */
const LOGOS: Record<string, string> = (() => {
  try {
    return JSON.parse(readFileSync("public/imagenes/marcas/fondos.json", "utf8"));
  } catch {
    return {};
  }
})();

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
  const esLogo = LOGOS[marca.slug] === "claro";

  return (
    <Link
      href={`/productos?marca=${marca.slug}`}
      className={`group relative block overflow-hidden rounded-chico ${
        esLogo ? "border border-borde bg-papel" : "bg-tinta"
      }`}
      aria-label={`Ver los ${marca.cuantos} productos de ${marca.nombre}`}
    >
      <Image
        src={imagenDe(marca)}
        alt=""
        width={900}
        height={900}
        sizes={
          grande
            ? "(min-width: 1024px) 34rem, 92vw"
            : "(min-width: 1024px) 17rem, 45vw"
        }
        className={`w-full transition-transform duration-500 group-hover:scale-105 ${
          esLogo ? "object-contain" : "object-cover"
        } ${grande ? "aspect-4/3 lg:aspect-square" : "aspect-square"}`}
      />

      {/*
        El degrade solo va sobre las fotos. Sobre un logo blanco, un velo
        oscuro en el borde inferior se ve como una mancha, y el nombre en
        tinta se lee solo sin ayuda.
      */}
      {!esLogo && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-tinta to-transparent"
        />
      )}

      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 sm:p-4">
        <span
          className={`font-display font-semibold tracking-[0.06em] uppercase ${
            esLogo ? "text-tinta" : "text-crema"
          } ${grande ? "text-lg sm:text-2xl" : "text-sm sm:text-base"}`}
        >
          {marca.nombre}
        </span>

        {/* La barrita del margen derecho, como en la referencia. */}
        <span
          aria-hidden
          className={`mb-1 h-5 w-1 shrink-0 ${esLogo ? "bg-vino" : "bg-crema"}`}
        />
      </span>
    </Link>
  );
}
