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
 * La tira de marcas: todas del mismo tamaño, en una fila.
 *
 * Contesta una pregunta que la grilla de productos no contesta: "¿que
 * marcas trae?". Quien ya usa Beauty of Joseon entra buscando la marca,
 * no una crema, y sin esto tiene que recorrer catorce fichas para
 * descubrir si esta.
 *
 * ERA UN MOSAICO Y SE COMIA UNA PANTALLA ENTERA.
 *
 * Tenia una marca destacada en grande —hasta 34 rem de lado— y el resto
 * en cuadrados de media pantalla: 871 px de alto en celular para una
 * seccion que es un indice, no un catalogo. Pesaba mas que los propios
 * productos, que es lo que se vende.
 *
 * Ahora son fichas iguales y chicas, en una sola fila que se desliza
 * cuando no entran. Ocupa un cuarto de lo que ocupaba y sigue haciendo
 * lo mismo: mostrar que marcas hay y llevar al catalogo filtrado.
 *
 * NINGUNA ES MAS QUE OTRA. La grande se la llevaba la marca con mas
 * productos, que es un dato del deposito y no una decision de venta.
 *
 * LAS IMAGENES YA TRAEN EL NOMBRE
 * Las piezas que arma Lucas son todas del mismo formato: la foto de los
 * envases de fondo, desenfocada, y el logo de la marca encima. El nombre
 * viaja igual en el `aria-label` para quien escucha la pagina.
 */
export default function Marcas({ productos }: { productos: Producto[] }) {
  const marcas = marcasConFoto(productos);
  if (marcas.length === 0) return null;

  return (
    <section id="marcas" className="seccion border-t border-borde bg-crema">
      <div className="contenedor">
        <TituloTienda titulo="Las marcas" />

        {/*
          Fila que se desliza en celular y se centra cuando entra entera.
          `sin-barra` es la misma clase del carrusel de productos: se
          desliza sin dibujar la barra.
        */}
        <ul className="sin-barra mt-6 flex gap-3 overflow-x-auto sm:flex-wrap sm:justify-center sm:gap-4">
          {marcas.map((m) => (
            <li key={m.slug} className="shrink-0">
              <Tarjeta marca={m} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Tarjeta({
  marca,
}: {
  marca: ReturnType<typeof marcasConFoto>[number];
}) {
  return (
    <Link
      href={`/productos?marca=${marca.slug}`}
      className="group block w-24 sm:w-28 lg:w-32"
      aria-label={`Ver ${marca.cuantos} ${marca.cuantos === 1 ? "producto" : "productos"} de ${marca.nombre}`}
    >
      <Image
        src={imagenDe(marca)}
        alt=""
        width={900}
        height={900}
        sizes="8rem"
        className="aspect-square w-full rounded-chico bg-tinta object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/*
        El nombre debajo, en chico.

        En el mosaico grande el logo de la pieza se leia solo. A 96 px de
        lado ya no: varias piezas son la foto de los envases con el logo
        encima y, achicadas, el logo queda del tamaño de una letra.
      */}
      <p className="mt-2 text-center text-xs text-tinta-suave">{marca.nombre}</p>
    </Link>
  );
}
