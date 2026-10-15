import Link from "next/link";
import type { Combo } from "@/lib/combos";
import { fotoDe, slugDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import ControlCarrito from "./ControlCarrito";
import VitrinaCombo from "./VitrinaCombo";

/**
 * Un combo, como una vidriera: los productos juntos arriba, grandes, y
 * debajo que es, cuanto sale y el boton.
 *
 * LA "VITRINA" (15-10-2026). Lucas probo cinco formas de mostrar los
 * combos —vitrina, elegir por tipo de piel, paso a paso, la cuenta de la
 * suma y una cajita de regalo— y eligio esta. Lo que cambia respecto de
 * la version de renglones:
 *
 *   - LAS FOTOS PASAN A SER LO MAS GRANDE. Antes eran miniaturas de
 *     64 px al costado de cada nombre; ahora los productos se ven juntos,
 *     como lo que son: un conjunto. Cuando la tarjeta queda a la vista
 *     se abren en abanico (components/VitrinaCombo.tsx).
 *   - EL DESCUENTO SE VE ANTES QUE EL TEXTO: un sello vino con el
 *     porcentaje en la esquina de las fotos.
 *   - EL AHORRO VA EN UNA PASTILLA VERDE, debajo del precio. Sigue
 *     diciendo pesos y no porcentaje, que es lo que pesa.
 *
 * Lo que se resigno: el precio suelto de cada producto. Los nombres
 * siguen escritos, cada uno lleva a su ficha, y la suma tachada al lado
 * del precio alcanza para ver que conviene.
 *
 * LO QUE LLEVA, de arriba a abajo: las fotos con el sello, cuantos
 * productos trae, el nombre, los productos por nombre, el precio con la
 * suma tachada, el ahorro y el boton al pie.
 *
 * Es un componente de servidor: solo las fotos (el abanico) y el boton
 * necesitan el navegador.
 */
export default function TarjetaCombo({ combo: c }: { combo: Combo }) {
  const porcentaje = Math.round(c.descuento * 100);

  return (
    <li className="flex">
      <article
        aria-labelledby={`combo-${c.slug}`}
        className="group flex w-full flex-col overflow-hidden rounded-suave bg-papel shadow-suave"
      >
        <VitrinaCombo fotos={c.productos.map(fotoDe)} porcentaje={porcentaje} />

        <div className="flex flex-1 flex-col p-5 pt-4">
          <p className="self-start rounded-full bg-vino-suave px-3 py-1 font-display text-xs font-semibold tracking-[0.04em] text-vino">
            Combo · {c.productos.length} productos
          </p>
          <h3
            id={`combo-${c.slug}`}
            className="mt-2.5 font-display text-xl leading-tight font-semibold text-balance text-tinta"
          >
            {c.nombre}
          </h3>

          {/* Los productos por nombre, en una linea corrida. Cada uno
              lleva a su ficha, para quien quiera saber mas antes de
              llevarse el combo. */}
          <ul className="mt-2 text-sm leading-snug text-tinta-suave">
            {c.productos.map((p, i) => (
              <li key={p.id} className="inline">
                {i > 0 && <span aria-hidden> · </span>}
                <Link
                  href={`/productos/${slugDe(p)}`}
                  className="underline-offset-2 hover:text-tinta hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vino"
                >
                  {p.nombre}
                </Link>
              </li>
            ))}
          </ul>

          {/* `mt-auto` baja el precio al pie: en la fila de escritorio los
              combos miden distinto —uno de cuatro, otros de tres— y sin
              esto los precios y los botones quedaban escalonados. */}
          <div className="mt-auto pt-5">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-display text-3xl font-bold text-tinta tabular-nums">
                <span className="sr-only">Precio del combo: </span>
                {formatearPrecio(c.precio)}
              </span>
              <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">
                <span className="sr-only">Por separado: </span>
                {formatearPrecio(c.suma)}
              </span>
            </p>
            <p className="mt-2 inline-flex rounded-full bg-positivo-suave px-3 py-1 text-sm font-bold text-positivo tabular-nums">
              Ahorrás {formatearPrecio(c.ahorro)}
            </p>

            <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
          </div>
        </div>
      </article>
    </li>
  );
}
