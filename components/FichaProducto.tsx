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
 * EL BOTON VA PEGADO AL BORDE DE LA FOTO, no debajo del texto.
 *
 * Es lo que hace la tienda que Lucas paso de referencia y es la decision
 * que mas rinde: la barra se apoya sobre el ultimo tramo de la foto, que
 * es fondo y no producto, asi que la accion esta siempre visible y no
 * gasta una fila propia. Debajo quedan solo tres renglones de texto
 * —marca, nombre, precio— y la ficha entra entera en media pantalla de
 * celular.
 *
 * TODA LA FICHA ES EL LINK, no solo la barra.
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

          {/*
            Parece un boton y no lo es: el link es la ficha entera. Si
            fuera un <a> propio quedaria un link adentro de otro, que no
            es HTML valido y que los lectores de pantalla anuncian dos
            veces.
          */}
          <span className="absolute inset-x-0 bottom-0 flex min-h-11 items-center justify-center gap-1.5 bg-tinta/90 px-3 font-display text-sm font-medium text-crema backdrop-blur-sm transition-colors group-hover:bg-vino">
            <IconoWhatsApp className="h-4 w-4" />
            Lo quiero
          </span>
        </div>

        <div className="flex flex-1 flex-col pt-3 text-center">
          <p className="font-display text-[0.6875rem] font-semibold tracking-[0.1em] text-tinta uppercase">
            {p.marca}
          </p>

          {/*
            Nombre a dos renglones y subtitulo a uno. Sin cortarlos,
            "PDRN Pink Collagen Capsule Cream" con sus beneficios armaba
            una ficha mucho mas alta que la de al lado y la fila quedaba
            despareja. El nombre completo no se pierde: viaja en el
            `aria-label` y en el mensaje de WhatsApp.
          */}
          <h3 className="mt-1 line-clamp-2 text-[0.9375rem] leading-snug font-normal text-balance text-tinta sm:text-base">
            {p.nombre}
          </h3>

          {subtitulo && (
            <p className="mt-1 line-clamp-1 text-[0.8125rem] leading-snug text-tinta-suave">
              {subtitulo}
            </p>
          )}

          {/* `mt-auto` empuja el precio al piso: en una fila los nombres
              miden distinto y sin esto los precios quedaban a distinta
              altura en cada columna. */}
          <p className="mt-auto flex items-baseline justify-center gap-2 pt-2.5 font-display text-base font-semibold tabular-nums">
            {p.precioAnterior && descuento !== null && (
              <span className="text-sm font-normal text-tinta-suave line-through">
                {formatearPrecio(p.precioAnterior)}
              </span>
            )}
            <span className={descuento !== null ? "text-vino" : "text-tinta"}>
              {precioDe(p)}
            </span>
          </p>
        </div>
      </a>
    </li>
  );
}
