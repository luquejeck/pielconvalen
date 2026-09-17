import Image from "next/image";
import {
  descuentoDe,
  fotoDe,
  precioDe,
  type Producto,
} from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import { linkProducto } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";

/**
 * Una ficha de producto. La usan el carrusel de la portada y el catalogo.
 *
 * LA DISTRIBUCION ES LA DE LA TIENDA QUE PASO LUCAS DE REFERENCIA:
 * todo alineado a la izquierda, marca y nombre juntos en versalitas y en
 * gris, el precio grande abajo con el descuento al lado, y un boton
 * angosto al final.
 *
 * El orden de lectura que arma es mejor que el de antes: con el nombre
 * chico y parejo, lo que salta a la vista es el precio, que es lo que se
 * compara cuando hay trece productos en pantalla. Con el nombre grande y
 * centrado, cada ficha empezaba a leerse por un texto distinto.
 *
 * TODA LA FICHA ES EL LINK, no solo el boton.
 *
 * No hay pagina de detalle: la unica accion posible sobre un producto es
 * preguntar por el. El `aria-label` la resume en un renglon para quien la
 * escucha; sin el, el lector leia el descuento, la marca, el nombre y los
 * dos precios de corrido como si fueran el nombre del link.
 */
export default function FichaProducto({
  producto: p,
  whatsapp,
}: {
  producto: Producto;
  whatsapp: string;
}) {
  const href = linkProducto(
    { marca: p.marca, nombre: p.nombre, medida: p.medida, precio: p.precio },
    whatsapp
  );

  const descuento = descuentoDe(p);
  const subtitulo = [p.medida, ...p.beneficios].filter(Boolean).join(" · ");

  return (
    <li className="flex">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar por WhatsApp: ${p.nombre}, de ${p.marca}`}
        className="group flex w-full flex-col"
      >
        <div className="relative overflow-hidden rounded-chico">
          {/*
            La base oscura donde se apoya el envase. Las fotos funden
            exactamente a --color-tinta (scripts/preparar-fotos.mjs), asi
            que no se ve donde termina el rectangulo.
          */}
          <Image
            src={fotoDe(p)}
            alt={`${p.nombre}, de ${p.marca}`}
            width={640}
            height={640}
            sizes="(min-width: 1024px) 18rem, (min-width: 640px) 30vw, 45vw"
            className="aspect-square w-full bg-tinta object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Solo cuando hay precio anterior cargado. Hoy no hay ninguno. */}
          {descuento !== null && (
            <span className="absolute top-0 left-0 bg-vino px-2 py-1 font-display text-sm font-semibold text-white tabular-nums">
              −{descuento}%
            </span>
          )}

        </div>

        <div className="flex flex-1 flex-col pt-3">
          {/*
            MARCA Y NOMBRE EN UN SOLO BLOQUE, en versalitas y en gris.

            Es la distribucion de la tienda que paso Lucas de referencia,
            y el orden de lectura que arma es mejor que el anterior: el
            nombre deja de competir con el precio —queda chico, gris y
            parejo— y lo que salta a la vista es el numero, que es lo que
            se compara cuando hay trece productos en pantalla.

            La marca va adentro del mismo bloque pero en negrita: asi se
            reconoce de un vistazo sin gastar un renglon propio, que era
            lo que hacia antes.
          */}
          <h3 className="line-clamp-2 text-[0.8125rem] leading-snug tracking-[0.02em] text-tinta-suave uppercase">
            <span className="font-semibold text-tinta">{p.marca}</span>{" "}
            {p.nombre}
          </h3>

          {/* `mt-auto` empuja el precio al piso: en una fila los nombres
              miden distinto y sin esto los precios quedaban a distinta
              altura en cada columna. */}
          <div className="mt-auto pt-2">
            <p className="flex flex-wrap items-baseline gap-x-2 font-display text-xl font-semibold text-tinta tabular-nums">
              {precioDe(p)}
              {descuento !== null && (
                <span className="text-sm font-semibold text-vino">
                  −{descuento}% OFF
                </span>
              )}
            </p>

            {p.precioAnterior && descuento !== null && (
              <p className="mt-0.5 text-sm text-tinta-suave line-through tabular-nums">
                {formatearPrecio(p.precioAnterior)}
              </p>
            )}

            {subtitulo && (
              <p className="mt-1 line-clamp-1 text-[0.8125rem] leading-snug text-tinta-suave">
                {subtitulo}
              </p>
            )}

            {/*
              Parece un boton y no lo es: el link es la ficha entera. Si
              fuera un <a> propio quedaria un link adentro de otro, que no
              es HTML valido y que los lectores de pantalla anuncian dos
              veces.

              Angosto y a la izquierda, como en la referencia. Antes iba
              pegado al borde de la foto y ocupaba todo el ancho: se veia
              mas, y tapaba el ultimo tramo del envase en las fotos donde
              el producto llega abajo.
            */}
            <span className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-tinta px-4 font-display text-sm font-medium text-crema transition-colors group-hover:bg-vino">
              <IconoWhatsApp className="h-4 w-4" />
              Lo quiero
            </span>
          </div>
        </div>
      </a>
    </li>
  );
}
