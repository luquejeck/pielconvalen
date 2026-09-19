import { existsSync } from "node:fs";
import Image from "next/image";
import Link from "next/link";
import { marcasConFoto, type Producto } from "@/lib/productos";
import TituloTienda from "./TituloTienda";

/**
 * La imagen de la marca, con la foto de producto como respaldo.
 *
 * Las piezas de marca las prepara `npm run fotos` desde fotos-marcas/. Si
 * una marca todavia no tiene la suya, el mosaico cae en la foto del
 * producto mas caro de esa marca y se ve bien igual: nunca queda un hueco
 * esperando que alguien suba un archivo.
 *
 * Se mira el disco y no una lista escrita a mano porque esto es un
 * componente de servidor y el archivo esta ahi: cualquier lista seria una
 * segunda cosa que mantener y que se puede desincronizar.
 */
function imagenDe(marca: { slug: string; foto: string }) {
  const propia = `/imagenes/marcas/${marca.slug}.webp`;
  return existsSync(`public${propia}`) ? propia : marca.foto;
}

/**
 * El mosaico de marcas: una grande y las demas chicas.
 *
 * Contesta una pregunta que la grilla de productos no contesta: "¿que
 * marcas trae?". Quien ya usa Beauty of Joseon entra buscando la marca,
 * no una crema, y sin esto tiene que recorrer catorce fichas para
 * descubrir si esta.
 *
 * LA GRANDE APARECE SOLO SI EL RESTO ES PAR.
 *
 * Con cinco marcas el molde cierra: una grande al lado de un cuadrado de
 * dos por dos. Con seis quedan cinco chicas en una grilla de dos
 * columnas, o sea una fila con un hueco al lado. En ese caso no hay
 * destacada y van todas iguales, que con numero par siempre cierra.
 *
 * El lugar grande, cuando lo hay, se lo lleva la marca con mas
 * productos, y eso se calcula, no se elige a mano: cuando Valen cargue o
 * saque productos el mosaico se reacomoda solo.
 *
 * LAS IMAGENES YA TRAEN EL NOMBRE
 * Las piezas que arma Lucas son todas del mismo formato: la foto de los
 * envases de fondo, desenfocada, y el logo de la marca encima. Antes las
 * imagenes eran de dos clases —unas logos sueltos sobre blanco y otras
 * fotos— y el mosaico tenia que escribir el nombre encima y decidir de
 * que color segun el caso. Ahora ese rotulo seria el nombre repetido al
 * lado del logo, asi que no va: el nombre viaja igual en el `aria-label`
 * para quien escucha la pagina.
 */
export default function Marcas({ productos }: { productos: Producto[] }) {
  const marcas = marcasConFoto(productos);
  if (marcas.length === 0) return null;

  const [principal, ...resto] = marcas;
  const conDestacada = resto.length >= 2 && resto.length % 2 === 0;

  return (
    <section
      id="marcas"
      className="border-t border-borde bg-crema py-16 md:py-20 xl:py-24"
    >
      <div className="contenedor">
        <TituloTienda titulo="Las marcas" />

        {conDestacada ? (
          <div className="mt-8 grid gap-3 sm:gap-4 lg:grid-cols-2">
            <Tarjeta marca={principal} grande />

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {resto.map((m) => (
                <Tarjeta key={m.slug} marca={m} />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {marcas.map((m) => (
              <Tarjeta key={m.slug} marca={m} />
            ))}
          </div>
        )}
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
      aria-label={`Ver ${marca.cuantos} ${marca.cuantos === 1 ? "producto" : "productos"} de ${marca.nombre}`}
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
        className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
          grande ? "aspect-4/3 lg:aspect-square" : "aspect-square"
        }`}
      />
    </Link>
  );
}
