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
 * UN PRODUCTO POR RENGLON (14-10-2026). La version anterior ponia las
 * fotos en fila de a tres con marca, nombre y precio debajo de cada una,
 * y dentro del carrusel —que deja la tarjeta en unos 330 px— cada
 * columna quedaba de 90 px: nombres en tres renglones y todo apretado.
 * En renglones cada cosa tiene su lugar: foto a la izquierda, marca y
 * nombre en el medio, precio suelto a la derecha.
 *
 * LO QUE LLEVA, de arriba a abajo:
 *   1. Que es: el nombre.
 *   2. Que trae: los productos, cada uno con SU precio suelto. Ver los
 *      precios es lo que hace creible el ahorro: la clienta puede sumar.
 *      Cada renglon lleva a la ficha del producto.
 *   3. Cuanto sale: el precio grande, la suma tachada, y debajo lo que
 *      se ahorra en pesos, que pesa mas que un porcentaje. El verde del
 *      ahorro es el unico color ademas del vino del boton.
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
        className="flex w-full flex-col rounded-suave bg-papel p-6 shadow-suave"
      >
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">Combo</p>
        <h3
          id={`combo-${c.slug}`}
          className="mt-1.5 font-display text-2xl leading-tight font-semibold text-balance text-tinta"
        >
          {c.nombre}
        </h3>

        {/*
          Las fotos van sin texto alternativo porque el nombre esta
          escrito al lado: con los dos, el lector de pantalla diria cada
          producto dos veces. `mix-blend-multiply` funde el blanco de las
          fotos de catalogo con la baldosa.
        */}
        <ul className="mt-6 space-y-4">
          {c.productos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/productos/${slugDe(p)}`}
                className="group flex items-center gap-4 rounded-chico focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vino"
              >
                <span className="block size-16 shrink-0 overflow-hidden rounded-chico bg-crema">
                  <Image
                    src={fotoDe(p)}
                    alt=""
                    width={160}
                    height={160}
                    className="size-full object-cover mix-blend-multiply transition-transform duration-300 motion-safe:group-hover:scale-105"
                  />
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block text-[0.8125rem] text-tinta-suave">{p.marca}</span>
                  <span className="block text-[0.9375rem] text-tinta group-hover:underline group-hover:decoration-borde group-hover:underline-offset-2">
                    {p.nombre}
                  </span>
                </span>
                <span className="shrink-0 text-[0.9375rem] text-tinta-suave tabular-nums">
                  <span className="sr-only">Suelto: </span>
                  {formatearPrecio(p.precio)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* `mt-auto` baja el precio al pie: en la fila de escritorio los
            combos miden distinto —uno de cuatro, otros de tres— y sin
            esto los precios y los botones quedaban escalonados. */}
        <div className="mt-auto pt-6">
          <div className="border-t border-borde pt-5">
            <p className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-display text-3xl font-bold text-tinta tabular-nums">
                <span className="sr-only">Precio del combo: </span>
                {formatearPrecio(c.precio)}
              </span>
              <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">
                <span className="sr-only">Por separado: </span>
                {formatearPrecio(c.suma)}
              </span>
            </p>
            <p className="mt-1 text-[0.9375rem] font-semibold text-positivo">
              Ahorrás {formatearPrecio(c.ahorro)} · {porcentaje}% menos
            </p>
          </div>

          <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
        </div>
      </article>
    </li>
  );
}
