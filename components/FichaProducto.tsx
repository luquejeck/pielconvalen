import Image from "next/image";
import { fotoDe, precioDe, type Producto } from "@/lib/productos";
import { linkProducto } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";

/**
 * Una ficha de producto, armada como las de la tienda de Apple.
 *
 * La foto manda y ocupa todo el ancho; debajo va una columna centrada y
 * angosta —marca, nombre, para que sirve, precio, boton— con el texto
 * chico. La ficha entera es blanca con esquinas grandes sobre un fondo
 * gris apenas mas oscuro.
 *
 * TRES DECISIONES QUE HACEN QUE ENTREN MAS PRODUCTOS
 *
 * 1. La foto es cuadrada. En 4:5 entraban seis por pantalla de celular;
 *    en cuadrado, ocho.
 * 2. Los beneficios van en un renglon separado por puntos y no como
 *    etiquetas sueltas. Tres etiquetas ocupaban dos renglones y 60px de
 *    alto; el renglon ocupa uno y 18px, y dice lo mismo.
 * 3. No hay descripcion larga en la ficha. Con trece productos, lo que
 *    se necesita para elegir es marca, que hace y cuanto sale; el resto
 *    se pregunta por WhatsApp, que es a donde lleva el boton.
 *
 * TODA LA FICHA ES EL LINK, no solo el boton.
 *
 * No hay pagina de detalle: la unica accion posible sobre un producto es
 * preguntar por el, asi que no hay nada que se pueda querer tocar aparte
 * de eso. El `aria-label` la resume en un renglon para quien la escucha:
 * sin el, el lector leia marca, nombre, beneficios y precio de corrido
 * como si fueran el nombre del link.
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

  /* "Luminosidad · Manchas · Poros". La medida se cuela adelante cuando
     esta cargada, que es el dato que mas se pregunta despues del precio. */
  const subtitulo = [p.medida, ...p.beneficios].filter(Boolean).join(" · ");

  return (
    <li className="flex">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar por WhatsApp: ${p.nombre}, de ${p.marca}`}
        className="group flex w-full flex-col rounded-[1.25rem] bg-tienda-ficha p-2.5 transition-transform duration-200 hover:-translate-y-1 sm:p-3"
      >
        {/*
          La escena: el envase sobre su base oscura. La foto ya viene
          fundida a ese mismo gris (scripts/preparar-fotos.mjs), asi que
          no se ve donde termina el rectangulo — la base y la foto son
          una sola pieza.
        */}
        <Image
          src={fotoDe(p)}
          alt={`${p.nombre}, de ${p.marca}`}
          width={640}
          height={640}
          sizes="(min-width: 1024px) 16rem, (min-width: 640px) 30vw, 45vw"
          className="aspect-square w-full rounded-[0.875rem] bg-tienda-escena object-cover"
        />

        <div className="flex flex-1 flex-col px-1 pt-3 text-center">
          <p className="text-[0.6875rem] font-medium tracking-[0.08em] text-tienda-suave uppercase">
            {p.marca}
          </p>

          {/*
            El nombre a dos renglones y el subtitulo a uno.

            Sin cortarlos, "PDRN Pink Collagen Capsule Cream" con sus
            cuatro beneficios armaba una ficha de 390px y en el celular
            entraban tres productos por pantalla: la mitad de lo que
            entraba antes de pasar a dos columnas, o sea que la grilla no
            servia para nada. Cortados, la ficha baja a ~330 y entran
            seis. El nombre completo no se pierde: viaja en el
            `aria-label` del link y en el mensaje de WhatsApp.
          */}
          <h3 className="mt-1 line-clamp-2 font-display text-[0.9375rem] leading-snug font-medium text-balance text-tienda-tinta sm:text-base">
            {p.nombre}
          </h3>

          {subtitulo && (
            <p className="mt-1 line-clamp-1 text-[0.8125rem] leading-snug text-tienda-suave">
              {subtitulo}
            </p>
          )}

          {/*
            `mt-auto` empuja el precio al piso. Sin eso, en una fila el
            precio quedaba a distinta altura en cada columna —un nombre
            entra en dos renglones y el de al lado en tres— y la grilla
            se leia desprolija.
          */}
          <p className="mt-auto pt-2.5 font-display text-base font-semibold text-tienda-tinta tabular-nums">
            {precioDe(p)}
          </p>

          {/*
            Parece un boton y no lo es: el link es la ficha entera. Si
            fuera un <a> propio quedaria un link adentro de otro, que no
            es HTML valido y que los lectores de pantalla anuncian dos
            veces.
          */}
          <span className="mt-2 inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-tienda-tinta px-3 text-sm font-medium text-white transition-opacity group-hover:opacity-85">
            <IconoWhatsApp className="h-3.5 w-3.5" />
            Lo quiero
          </span>
        </div>
      </a>
    </li>
  );
}
