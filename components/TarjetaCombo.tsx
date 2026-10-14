import Image from "next/image";
import Link from "next/link";
import type { Combo } from "@/lib/combos";
import { fotoDe, slugDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import ControlCarrito from "./ControlCarrito";

/**
 * Un combo, en una tarjeta que entra en una pantalla de celular.
 *
 * REEMPLAZA AL BLOQUE "COMPRADOS JUNTOS" A LO AMAZON. Cada combo ocupaba
 * entre 800 y 950 px en el telefono —casi una pantalla y cuarto—, y con
 * cuatro combos eran 3400 px de combos antes del primer producto de
 * /productos. Ahora cada uno mide lo que una pantalla y van en una fila
 * que se desliza (components/Carrusel.tsx).
 *
 * SE FUERON LAS CASILLAS PARA DESTILDAR UN PRODUCTO. Eran de 20 px
 * —chicas para un dedo de sesenta años— y destildar uno hacia perder el
 * descuento: lo que quedaba eran productos sueltos a precio de lista, que
 * es justo lo que ya ofrece la grilla de abajo. En la tarjeta queda una
 * sola decision: llevarse el combo o no.
 *
 * SIMPLE, Y CON LA CUENTA A LA VISTA (14-10-2026). La version anterior
 * decia lo mismo con mas cosas —pasos, lista de nombres, etiqueta verde
 * llena— y no terminaba de gustar. Lucas pidio algo simple, en la
 * paleta de la casa, donde se vea el producto y se sienta el ahorro.
 * Se probaron cinco direcciones en una pagina aparte y quedo esta:
 *
 *   1. Que es: el nombre y una linea de por que van juntos.
 *   2. Que trae: las fotos en fila, cada una con marca, nombre y SU
 *      precio suelto. Ver los tres precios es lo que hace creible el
 *      ahorro: la clienta puede sumar.
 *   3. Cuanto sale: el precio grande con la suma tachada al lado, y
 *      debajo lo que se ahorra en pesos, que pesa mas que un porcentaje.
 *      El verde del ahorro es el unico color ademas del vino del boton.
 *   4. El boton, al pie, ancho completo.
 *
 * Es un componente de servidor: solo el boton necesita el navegador, y
 * ese es el mismo control de las fichas.
 */
export default function TarjetaCombo({ combo: c }: { combo: Combo }) {
  const porcentaje = Math.round(c.descuento * 100);

  return (
    <li className="flex">
      <article
        aria-labelledby={`combo-${c.slug}`}
        className="flex w-full flex-col rounded-suave border border-borde bg-papel p-5 shadow-suave"
      >
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">Combo</p>
        <h3
          id={`combo-${c.slug}`}
          className="mt-1 font-display text-2xl leading-tight font-semibold text-balance text-tinta"
        >
          {c.nombre}
        </h3>
        <p className="mt-1 text-[0.9375rem] text-tinta-suave">Elegidos por Valen para usar juntos</p>

        {/*
          Cada producto lleva a su ficha: quien quiere saber que es el
          serum antes de llevarse el combo lo toca y lo ve, sin buscarlo
          en el catalogo. La baldosa entera es el blanco a tocar.

          Las fotos van sin texto alternativo porque el nombre esta
          escrito debajo: con los dos, el lector de pantalla diria cada
          producto dos veces. La marca puede ocupar dos renglones en vez
          de cortarse: "Beauty of Jo…" en un telefono chico no se entiende.
        */}
        <ul className={`mt-5 grid gap-2.5 ${c.productos.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
          {c.productos.map((p) => (
            <li key={p.id} className="flex">
              <Link
                href={`/productos/${slugDe(p)}`}
                className="group flex w-full flex-col rounded-chico focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vino"
              >
                {/* `mix-blend-multiply` funde el blanco de las fotos de
                    catalogo con la baldosa, en vez de dejarlas como un
                    cuadrado pegado encima. */}
                <span className="block overflow-hidden rounded-chico bg-crema">
                  <Image
                    src={fotoDe(p)}
                    alt=""
                    width={240}
                    height={240}
                    sizes="(min-width: 1024px) 8rem, 30vw"
                    className="aspect-square w-full object-cover mix-blend-multiply transition-transform duration-300 motion-safe:group-hover:scale-105"
                  />
                </span>
                <span className="mt-2 text-[0.8125rem] leading-tight font-semibold text-tinta-suave">{p.marca}</span>
                <span className="text-[0.9375rem] leading-snug text-tinta group-hover:underline group-hover:decoration-borde group-hover:underline-offset-2">
                  {p.nombre}
                </span>
                <span className="mt-auto pt-1 text-[0.9375rem] text-tinta-suave tabular-nums">
                  <span className="sr-only">Suelto: </span>
                  {formatearPrecio(p.precio)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* `mt-auto` baja el precio al pie: en la fila de escritorio los
            combos miden distinto y sin esto los precios y los botones
            quedaban escalonados. */}
        <div className="mt-auto pt-5">
          <p className="flex flex-wrap items-baseline gap-x-2.5">
            <span className="font-display text-3xl font-bold text-tinta tabular-nums">
              <span className="sr-only">Precio del combo: </span>
              {formatearPrecio(c.precio)}
            </span>
            <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">
              <span className="sr-only">Por separado: </span>
              {formatearPrecio(c.suma)}
            </span>
          </p>
          <p className="mt-0.5 text-[0.9375rem] font-semibold text-positivo">
            Ahorrás {formatearPrecio(c.ahorro)} · {porcentaje}% menos
          </p>

          <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
        </div>
      </article>
    </li>
  );
}
