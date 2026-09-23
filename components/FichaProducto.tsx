import { readFileSync } from "node:fs";
import Image from "next/image";
import Link from "next/link";
import {
  descuentoDe,
  fotoDe,
  hayStock,
  precioDe,
  slugDe,
  type Producto,
} from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import ControlCarrito from "./ControlCarrito";

/**
 * Una ficha de producto. La usan el carrusel de la portada y el catalogo.
 *
 * EL ORDEN DE LECTURA ES EL DE MERCADO LIBRE, que es la tienda que esta
 * clienta ya sabe leer: arriba que es, abajo cuanto sale.
 *
 *   foto
 *   marca y nombre            <- que es
 *   medida y beneficios       <- para que sirve
 *   [20% OFF] ~$ 25.000~      <- la rebaja, ARRIBA del precio
 *   $ 20.000                  <- lo mas grande de la ficha, solo
 *   [ Agregar ]               <- ancho completo
 *
 * Todo alineado a la izquierda. Con el nombre en un tamaño parejo y el
 * precio mucho mas grande, lo que salta a la vista es el numero, que es
 * lo que se compara cuando hay veinte productos en pantalla.
 *
 * TRES COLORES, UNO POR COSA, como en Mercado Libre:
 *   tinta  el precio. Negro sobre blanco es lo que mejor se lee.
 *   verde  lo que se ahorra: la etiqueta "OFF". Es el verde apagado de
 *          la casa, lleno y con letra blanca como la de Mercado Libre.
 *   vino   lo que se toca: el boton.
 * Antes el precio, el descuento, la etiqueta sobre la foto y el boton
 * iban los cuatro en vino, y cuando todo esta en el color de acento
 * nada se destaca.
 *
 * EL NOMBRE YA NO VA EN MAYUSCULAS NI A 13 PX. Las mayusculas se leen
 * peor —todas las letras tienen la misma altura y la palabra pierde su
 * silueta— y 13 px esta por debajo de lo que lee comoda una persona de
 * sesenta. Va en minusculas, a 15 px en el telefono y 16 en adelante.
 *
 * ES UNA TARJETA, con borde y fondo propio, como las de un marketplace.
 *
 * Estuvo un rato sin contenedor, apoyada sobre el fondo, que es lo que
 * hace la tienda de Apple. Funciona cuando hay cuatro productos y todos
 * fotografiados igual; con trece y con fotos de origenes distintos —unas
 * sobre blanco y otras sobre fondo oscuro— no se veia donde terminaba una
 * y empezaba la otra. El borde las vuelve a separar.
 *
 * TOCAR LA FICHA ABRE EL PRODUCTO; TOCAR "AGREGAR" LO SUMA AL PEDIDO.
 *
 * Es lo que hace Mercado Libre, y lo que la clienta ya espera: la foto
 * y el nombre llevan a /productos/<slug>, donde esta la descripcion que
 * Valen carga y que antes no se veia en ningun lado.
 *
 * La ficha entera NO se envuelve en un <a>: un boton adentro de un link
 * no es HTML valido y los lectores de pantalla lo anuncian dos veces. El
 * link es el nombre, y su `::after` se estira sobre toda la tarjeta
 * (`after:absolute after:inset-0`), asi que se toca en cualquier parte.
 * El control del pedido va por encima con `z-10` y sigue siendo su
 * propio boton.
 */
/**
 * Que productos tienen la foto sobre fondo claro.
 *
 * Lo escribe `npm run fotos` mirando el original de cada uno: las fotos
 * de catalogo de las marcas vienen recortadas sobre blanco y las que
 * mando Valen por WhatsApp estan sacadas de noche sobre una mesa oscura.
 * La web no puede distinguirlo sola porque solo ve el .webp ya fundido.
 *
 * Esto es lo que deja convivir las dos cosas mientras se consiguen las
 * fotos que faltan: cada ficha pinta su base del color al que fundio su
 * foto, asi que ninguna se ve como un parche. El dia que entre la ultima
 * foto de catalogo, la grilla queda blanca entera sola.
 *
 * Se lee una vez por proceso, no una por ficha. Si el archivo no existe
 * —nadie corrio el comando todavia— quedan todas oscuras, que es como
 * venia funcionando.
 */
const FONDOS: Record<string, string> = (() => {
  try {
    return JSON.parse(
      readFileSync("public/imagenes/productos/fondos.json", "utf8")
    );
  } catch {
    return {};
  }
})();

export default function FichaProducto({ producto: p }: { producto: Producto }) {
  const descuento = descuentoDe(p);
  const disponible = hayStock(p);
  const claro = FONDOS[p.id] === "claro";
  const subtitulo = [p.medida, ...p.beneficios].filter(Boolean).join(" · ");

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-chico border border-borde bg-papel transition-shadow duration-200 hover:shadow-suave">
        <div className={`relative ${claro ? "bg-papel" : "bg-tinta"}`}>
          {/*
            La base se pinta del mismo color al que fundio la foto
            (scripts/preparar-fotos.mjs), asi que no se ve donde termina
            el rectangulo. Claro para las fotos de catalogo, oscuro para
            las que sacamos con el celular.
          */}
          <Image
            src={fotoDe(p)}
            alt={`${p.nombre}, de ${p.marca}`}
            width={640}
            height={640}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 30vw, 45vw"
            className={`aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              disponible ? "" : "opacity-55 grayscale"
            }`}
          />

          {/*
            SOBRE LA FOTO SOLO VA "SIN STOCK".

            Antes tambien iba el "−20%", y el mismo dato aparecia dos
            veces en la misma ficha: arriba en la foto y abajo al lado del
            precio. El descuento se queda donde se lo busca, pegado al
            numero, que es lo que hace Mercado Libre. "Sin stock" si va
            arriba: es lo primero que hay que saber, antes de leer nada.
          */}
          {!disponible && (
            <span className="absolute top-0 left-0 bg-tinta px-2 py-1 font-display text-sm font-semibold text-white">
              Sin stock
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pt-3 pb-3.5">
          {/*
            TRES RENGLONES EN CELULAR, DOS DE ANCHO PARA ARRIBA.

            La ficha mide 161 px en un telefono y los nombres mas largos
            —"Beauty of Joseon Relief Sun Probiotics"— no entran en dos:
            quedaban cortados justo en la parte que los distingue. El
            tercer renglon cierra el caso. De 640 para arriba la tarjeta
            es mas ancha y dos alcanzan.

            La marca va adentro del mismo bloque pero en negrita: asi se
            reconoce de un vistazo sin gastar un renglon propio.
          */}
          <h3 className="line-clamp-3 text-[0.9375rem] leading-snug text-tinta sm:line-clamp-2 sm:text-base">
            <Link
              href={`/productos/${slugDe(p)}`}
              className="after:absolute after:inset-0 group-hover:text-vino"
            >
              <span className="font-semibold">{p.marca}</span> {p.nombre}
            </Link>
          </h3>

          {/*
            LA MEDIDA Y LOS BENEFICIOS, PEGADOS AL NOMBRE.

            Antes iban debajo del precio. Son parte de "que es" —igual que
            los atributos que Mercado Libre pone debajo del titulo— y
            con el precio en el medio la ficha se leia nombre, plata,
            nombre otra vez. Juntos, arriba se lee el producto y abajo la
            compra.

            Dos renglones: con uno solo se cortaban quince de dieciseis
            fichas en celular, justo en los beneficios, que es lo que la
            clienta lee para elegir.
          */}
          {subtitulo && (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-tinta-suave">
              {subtitulo}
            </p>
          )}

          {/* `mt-auto` empuja la compra al piso: en una fila los nombres
              miden distinto y sin esto los precios y los botones quedaban
              a distinta altura en cada columna. */}
          <div className="mt-auto pt-3">
            {/*
              LA REBAJA VA EN SU PROPIO RENGLON, ARRIBA DEL PRECIO.

              Es la distribucion de Mercado Libre: la etiqueta verde y el
              precio de antes tachado, y debajo el precio nuevo solo. Se
              lee "antes esto, ahora esto", en ese orden, y el precio no
              tiene que compartir el renglon con nada: en una ficha de
              161 px, "$ 65.000 20% OFF" ya no entraba en uno.
            */}
            {p.precioAnterior && descuento !== null && (
              <p className="mb-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                <span className="rounded-md bg-positivo px-1.5 py-0.5 font-display text-[0.8125rem] leading-none font-bold text-white tabular-nums">
                  {descuento}% OFF
                </span>
                <span className="text-sm text-tinta-suave line-through tabular-nums">
                  {formatearPrecio(p.precioAnterior)}
                </span>
              </p>
            )}

            <p className="font-display text-[1.375rem] leading-tight font-semibold text-tinta tabular-nums">
              {precioDe(p)}
            </p>

            {/*
              "¡ULTIMO DISPONIBLE!" NO VA EN LA TARJETA, solo en la pagina
              del producto.

              Al 23-09-2026 salia en 16 de las 23 fichas: si casi todo es
              "el ultimo", deja de apurar, se lee como presion, y era un
              renglon mas en cada tarjeta. En la pagina del producto, que
              es donde se decide, si se dice.
            */}


            {disponible ? (
              <div className="relative z-10">
                <ControlCarrito id={p.id} nombre={`${p.marca} ${p.nombre}`} />
              </div>
            ) : (
              /*
                Sin stock NO se puede agregar al pedido.

                Antes la web no sabia del stock y ofrecia igual lo que no
                estaba: la clienta lo pedia por WhatsApp y se enteraba
                ahi. Se deja visible —sirve para saber que Valen lo
                trabaja y se puede encargar— pero sin boton que prometa.
              */
              <p className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-borde px-3 text-center text-sm text-tinta-suave">
                Sin stock · consultala
              </p>
            )}
          </div>
        </div>
    </li>
  );
}
