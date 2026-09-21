import Image from "next/image";
import { Fragment } from "react";
import type { Combo } from "@/lib/combos";
import { fotoDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import BotonCombo from "./BotonCombo";

/**
 * El combo, armado para vender.
 *
 * SIGUE LA FORMA DE MERCADO LIBRE Y AMAZON, que es la que la clienta ya
 * sabe leer de tanto verla:
 *
 *   - Las fotos unidas con "+". Es lo que hace que se lea como "llevate
 *     el conjunto" y no como tres productos que quedaron juntos.
 *   - El descuento en una etiqueta grande y de color, arriba. Antes era
 *     un "−10%" chico al lado del precio y se perdia.
 *   - "Precio por separado" tachado contra "Precio del combo", uno arriba
 *     del otro, y abajo cuanto se ahorra EN PESOS. El porcentaje solo
 *     dice poco; "Ahorrás $9.800" se entiende sin hacer la cuenta.
 *   - Un boton solo, grande, con el precio adentro.
 *
 * EL DESCUENTO VA EN VERDE y no en el vino de la marca. Verde es el
 * color del ahorro en Mercado Libre, y ademas separa lo que es "oferta"
 * de lo que es "boton": si todo fuera vino, la etiqueta y el boton
 * competirian.
 *
 * Se usa en la portada y arriba del catalogo: `className` deja que cada
 * lugar ponga su margen.
 */
export default function ComboRecomendado({
  combo: c,
  className = "",
}: {
  combo: Combo;
  className?: string;
}) {
  const porcentaje = Math.round(c.descuento * 100);

  return (
    <section
      aria-labelledby={`combo-${c.slug}`}
      className={`overflow-hidden rounded-suave border-2 border-vino bg-papel shadow-lg ${className}`}
    >
      {/* La cabecera: que es, y cuanto se ahorra, antes que nada. */}
      <div className="flex items-center justify-between gap-3 bg-vino px-4 py-2.5 sm:px-5">
        <p className="font-display text-sm font-semibold tracking-[0.08em] text-white uppercase">
          Combo · Llevate la rutina
        </p>
        <span className="shrink-0 rounded-full bg-positivo px-3 py-1 font-display text-sm font-bold text-white tabular-nums">
          {porcentaje}% OFF
        </span>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <h2 id={`combo-${c.slug}`} className="font-display text-2xl font-semibold text-tinta sm:text-3xl">
          {c.nombre}
        </h2>
        <p className="mt-1 text-base leading-snug text-tinta-suave">{c.descripcion}</p>

        {/*
          Los tres unidos con "+", en el orden en que se usan.

          Con techo de ancho: sin el, en una pantalla grande cada foto
          llegaba a 353 px, mas que las fichas del catalogo (272). Una
          recomendacion no puede verse mas grande que los productos que
          recomienda.
        */}
        <ol className="mt-5 flex max-w-2xl items-start">
          {c.productos.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 && (
                <li
                  aria-hidden
                  className="flex shrink-0 items-center self-center px-1 pb-10 font-display text-2xl font-light text-vino sm:px-3 sm:text-3xl"
                >
                  +
                </li>
              )}
              <li className="flex min-w-0 flex-1 flex-col">
                <div className="overflow-hidden rounded-chico border border-borde bg-papel">
                  <Image
                    src={fotoDe(p)}
                    alt={`${p.nombre}, de ${p.marca}`}
                    width={320}
                    height={320}
                    sizes="(min-width: 640px) 11rem, 28vw"
                    className="aspect-square w-full object-cover"
                  />
                </div>
                <p className="mt-2 line-clamp-4 text-[0.75rem] leading-snug tracking-[0.02em] text-tinta-suave uppercase">
                  <span className="font-semibold text-tinta">{p.marca}</span> {p.nombre}
                </p>
                <p className="mt-0.5 text-sm text-tinta-suave tabular-nums">
                  {formatearPrecio(p.precio)}
                </p>
              </li>
            </Fragment>
          ))}
        </ol>

        {/* Los numeros, uno arriba del otro, para que el ahorro se vea. */}
        <div className="mt-5 rounded-chico bg-crema px-4 py-3 sm:max-w-md">
          <p className="flex items-baseline justify-between gap-3 text-base text-tinta-suave">
            <span>Precio por separado</span>
            <span className="line-through tabular-nums">{formatearPrecio(c.suma)}</span>
          </p>
          {/* El rotulo no se parte: en el telefono el precio grande lo
              empujaba a dos renglones ("Precio del / combo"). */}
          <p className="mt-1 flex items-baseline justify-between gap-3">
            <span className="font-display text-base font-semibold whitespace-nowrap text-tinta">Precio del combo</span>
            <span className="font-display text-2xl font-bold text-vino tabular-nums sm:text-3xl">
              {formatearPrecio(c.precio)}
            </span>
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-positivo-suave px-3 py-1 text-sm font-semibold text-positivo">
            Ahorrás {formatearPrecio(c.ahorro)}
          </p>
        </div>

        <div className="mt-5 sm:max-w-md">
          <BotonCombo id={c.id} cuantos={c.productos.length} precio={c.precio} />
        </div>
      </div>
    </section>
  );
}
