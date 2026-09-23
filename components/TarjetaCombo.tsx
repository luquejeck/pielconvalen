import { Fragment } from "react";
import Image from "next/image";
import { pasosDe, type Combo } from "@/lib/combos";
import { fotoDe } from "@/lib/productos";
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
 * LO QUE LLEVA, de arriba a abajo, en el orden en que se decide:
 *   1. Que es: el nombre y los pasos ("Limpiar + Hidratar + Tratar").
 *      Los pasos dicen por que esos productos van juntos, que es lo que
 *      hace que un combo se entienda sin saber que es un serum.
 *   2. Que trae: las fotos unidas con "+" —el gesto de "comprados
 *      juntos" que se reconoce de Mercado Libre y de Amazon— y debajo
 *      los nombres, que en una foto de 70 px no se leen.
 *   3. Cuanto sale: igual que en la ficha de producto, la etiqueta
 *      verde "10% OFF" y lo que salen por separado tachado arriba, el
 *      precio grande solo, y lo que se ahorra en pesos, que pesa mas
 *      que un porcentaje.
 *   4. El boton, al pie, ancho completo.
 *
 * Es un componente de servidor: solo el boton necesita el navegador, y
 * ese es el mismo control de las fichas.
 */
export default function TarjetaCombo({ combo: c }: { combo: Combo }) {
  const porcentaje = Math.round(c.descuento * 100);
  const cuantos = c.productos.length;

  return (
    <li className="flex">
      <article
        aria-labelledby={`combo-${c.slug}`}
        className="flex w-full flex-col rounded-suave border border-borde bg-papel p-4 transition-shadow duration-200 hover:shadow-suave sm:p-5"
      >
        <p className="font-display text-sm font-semibold tracking-[0.08em] text-vino uppercase">
          Combo · {cuantos} productos
        </p>
        <h3
          id={`combo-${c.slug}`}
          className="mt-1.5 font-display text-xl leading-tight font-semibold text-tinta"
        >
          {c.nombre}
        </h3>
        <p className="mt-1 text-[0.9375rem] leading-snug text-tinta-suave">
          {pasosDe(c).join(" + ")}
        </p>

        {/*
          Las fotos, en una fila con "+" entre medio. Van sin texto
          alternativo porque los nombres estan escritos justo debajo: con
          los dos, el lector de pantalla diria cada producto dos veces.

          Con cuatro productos cada foto baja a unos 50 px en el telefono.
          Alcanza para reconocer el envase; lo que lo nombra es la lista.
        */}
        <div aria-hidden className="mt-4 flex items-center">
          {c.productos.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 && (
                <span className="w-5 shrink-0 text-center text-lg font-light text-tinta-suave">
                  +
                </span>
              )}
              {/* `mix-blend-multiply` funde el blanco de las fotos de
                  catalogo con la baldosa, en vez de dejarlas como un
                  cuadrado pegado encima. */}
              <span className="block min-w-0 flex-1 overflow-hidden rounded-chico bg-crema">
                <Image
                  src={fotoDe(p)}
                  alt=""
                  width={240}
                  height={240}
                  sizes="(min-width: 1024px) 7rem, 5rem"
                  className="aspect-square w-full object-cover mix-blend-multiply"
                />
              </span>
            </Fragment>
          ))}
        </div>

        <ol className="mt-3 space-y-1.5 text-[0.9375rem] leading-snug text-tinta">
          {c.productos.map((p) => (
            <li key={p.id} className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-vino" />
              <span>
                <span className="font-semibold">{p.marca}</span> {p.nombre}
              </span>
            </li>
          ))}
        </ol>

        {/* `mt-auto` baja el precio al pie: en la fila de escritorio los
            combos miden distinto —uno de cuatro, otros de tres— y sin
            esto los precios y los botones quedaban escalonados. */}
        <div className="mt-auto pt-4">
          {/* "Por separado" se queda: en un combo el tachado no es un
              precio de antes sino la suma de los productos, y sin la
              palabra no se entiende de donde sale ese numero. */}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] text-tinta-suave">
            <span className="rounded-md bg-positivo px-2 py-1 font-display text-sm leading-none font-bold text-white tabular-nums">
              {porcentaje}% OFF
            </span>
            <span>
              Por separado{" "}
              <span className="line-through tabular-nums">{formatearPrecio(c.suma)}</span>
            </span>
          </p>
          <p className="mt-1 font-display text-3xl font-bold text-tinta tabular-nums">
            {formatearPrecio(c.precio)}
          </p>
          <p className="mt-0.5 text-[0.9375rem] font-semibold text-positivo">
            Ahorrás {formatearPrecio(c.ahorro)}
          </p>

          <ControlCarrito
            id={c.id}
            nombre={`Combo ${c.nombre}`}
            texto="Agregar combo al pedido"
            grande
          />
        </div>
      </article>
    </li>
  );
}
