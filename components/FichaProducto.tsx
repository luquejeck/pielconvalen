import Image from "next/image";
import { fotoDe, precioDe, type Producto } from "@/lib/productos";
import { linkProducto } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";

/**
 * Una ficha de producto. La usan igual la portada y /productos.
 *
 * SIN CONTENEDOR — la ficha no es una tarjeta.
 *
 * No tiene fondo propio, ni borde, ni sombra: se apoya directo sobre el
 * fondo oscuro de la seccion, que es como arma las suyas la pagina que
 * tomamos de referencia. La foto ya viene fundida a ese mismo fondo
 * (scripts/preparar-fotos.mjs), asi que el envase aparece flotando y lo
 * unico que dibuja la grilla es el aire entre una columna y la otra.
 *
 * Una tarjeta con fondo propio sumaba un rectangulo por producto: con
 * trece en pantalla, lo primero que se veia eran trece cajas y recien
 * despues lo que hay adentro de cada una.
 *
 * TODA LA FICHA ES EL LINK, no solo el boton.
 *
 * No hay pagina de detalle: la unica accion posible sobre un producto es
 * preguntar por el, asi que no hay nada que se pueda querer tocar aparte
 * de eso. Con el link solo en el boton, la mayor parte de la superficie
 * no hacia nada, y en celular —donde se toca con el pulgar en cualquier
 * parte— eso se siente como que la pagina no responde.
 *
 * Para quien la escucha en vez de verla, el `aria-label` la resume en un
 * renglon: sin el, el lector leia marca, nombre, medida, descripcion,
 * las etiquetas y el precio de corrido como si fueran el nombre del link.
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

  return (
    <li className="flex">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Consultar por WhatsApp: ${p.nombre}, de ${p.marca}`}
        className="group flex w-full flex-col"
      >
        <Image
          src={fotoDe(p)}
          alt={`${p.nombre}, de ${p.marca}`}
          width={640}
          height={800}
          sizes="(min-width: 1024px) 20rem, (min-width: 640px) 30vw, 45vw"
          className="aspect-4/5 w-full rounded-suave object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div className="flex flex-1 flex-col pt-3">
          {/*
            La marca en pastilla delineada, como la etiqueta de un frasco
            de laboratorio. Hace dos cosas a la vez: separa la marca del
            nombre —que escritos uno al lado del otro se leian como un
            titulo largo— y le da a la grilla un elemento repetido que
            ordena la lectura cuando hay trece productos seguidos.
          */}
          {/*
            En celular baja a 11px y afloja el tracking.

            Con 12px y 0,12em de tracking, "BEAUTY OF JOSEON" —que son
            dieciseis caracteres— no entraba en los 160px de una ficha a
            dos columnas: partia en dos renglones, la pastilla quedaba
            del doble de alto que la de al lado y la fila entera se veia
            desalineada. El `whitespace-nowrap` es el seguro para la
            proxima marca de nombre largo que cargue Valen.
          */}
          <span className="inline-flex w-fit items-center rounded-full border border-crema/40 px-2 py-0.5 font-display text-[0.6875rem] font-medium tracking-[0.08em] whitespace-nowrap text-crema-tenue uppercase sm:text-xs sm:tracking-[0.12em]">
            {p.marca}
          </span>

          <h3 className="mt-2 font-display text-base leading-snug font-normal text-crema sm:text-lg">
            {p.nombre}
          </h3>

          {p.medida && (
            <p className="mt-0.5 text-sm text-crema-tenue">{p.medida}</p>
          )}

          {/*
            La descripcion recien aparece en pantalla ancha.

            En celular la grilla es de dos columnas: cada ficha mide unos
            160px y tres renglones de texto de 16px ahi adentro no se leen,
            se adivinan. Las etiquetas de abajo dicen lo mismo en dos
            palabras y esas si entran, asi que el celular se queda con
            esas y la descripcion larga espera a que haya lugar.
          */}
          {p.descripcion && (
            <p className="mt-2 hidden text-base leading-snug text-crema-tenue sm:block">
              {p.descripcion}
            </p>
          )}

          {p.beneficios.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {p.beneficios.map((b) => (
                <li
                  key={b}
                  className="rounded-full bg-crema/10 px-2.5 py-0.5 text-sm text-crema"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/*
            `mt-auto` empuja el precio al piso de la ficha. Sin eso, en
            una fila el precio quedaba a distinta altura en cada columna
            —un nombre entra en dos renglones y el de al lado en tres— y
            la grilla se leia desprolija.
          */}
          <div className="mt-auto pt-3">
            <p className="font-display text-xl font-medium text-crema tabular-nums">
              {precioDe(p)}
            </p>

            {/*
              Parece un boton y no lo es: el link es la ficha entera. Si
              fuera un <a> propio quedaria un link adentro de otro, que no
              es HTML valido y que los lectores de pantalla anuncian dos
              veces.
            */}
            <span className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-crema px-4 font-display text-base font-medium text-vino transition-colors group-hover:bg-white">
              <IconoWhatsApp className="h-4 w-4" />
              Lo quiero
            </span>
          </div>
        </div>
      </a>
    </li>
  );
}
