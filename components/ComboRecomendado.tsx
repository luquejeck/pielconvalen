"use client";

import Image from "next/image";
import { Fragment, useState } from "react";
import type { Combo } from "@/lib/combos";
import { fotoDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import { useCarrito } from "./CarritoContext";

/**
 * El combo, a la manera del "Comprados juntos habitualmente" de Amazon,
 * y un paso mas alla.
 *
 * LO QUE SE TOMA DE AMAZON, porque la clienta ya lo sabe leer:
 *   - Cada producto en su propia baldosa, con la foto grande.
 *   - Un casillero en cada una para sacarla del conjunto; el total y
 *     el boton se recalculan solos.
 *   - En pantalla grande, total y boton a la derecha, aparte.
 *   - `mix-blend-multiply` en las fotos: las de fondo blanco se funden
 *     con la baldosa en vez de quedar como un cuadrado pegado encima.
 *     De paso suaviza el fondo beige de la foto del Revive Serum.
 *
 * LO QUE AMAZON NO HACE Y ACA SI:
 *   - Mostrar el descuento. Amazon da el total y nada mas; aca estan
 *     el tachado, el precio del combo y cuanto se ahorra en pesos.
 *   - Mostrar lo que se pierde. Si la clienta destilda uno, el aviso
 *     pasa a "llevando los 3 ahorrás $9.800": ve el descuento que deja
 *     sobre la mesa, que es lo que la empuja a llevarse el conjunto.
 *   - Decir por que van juntos. Cada baldosa lleva su paso de la rutina
 *     —Limpiar, Tratar, Contorno—. Amazon solo dice que otros los
 *     compraron juntos.
 *
 * EL DESCUENTO ES SOLO CON LOS TRES. Con todos tildados entra al pedido
 * el combo, con su precio. Con menos, entran los productos sueltos a
 * precio normal: un combo de dos no es el combo.
 *
 * VERSIONES ANTERIORES, para no repetirlas: la fila de tres fotos en el
 * celular no pasaba de ~90 px por mas que se movieran los margenes, y
 * con siete bloques apilados todo quedaba apretado. En el telefono esto
 * es una lista vertical; la fila es solo para pantalla grande.
 */

/** El paso de la rutina de cada producto, por su categoria. */
const PASO: Record<string, string> = {
  Limpiadores: "Limpiar",
  Tónicos: "Tonificar",
  Sérums: "Tratar",
  Mascarillas: "Mascarilla",
  Cremas: "Hidratar",
  "Contorno de ojos": "Contorno",
  "Protector solar": "Proteger",
};

export default function ComboRecomendado({
  combo: c,
  className = "",
}: {
  combo: Combo;
  className?: string;
}) {
  const { agregar, abrir, cantidadDe, listo } = useCarrito();
  const [tildados, setTildados] = useState<boolean[]>(() => c.productos.map(() => true));

  const elegidos = c.productos.filter((_, i) => tildados[i]);
  const todos = elegidos.length === c.productos.length;
  const suelto = elegidos.reduce((n, p) => n + p.precio, 0);
  const aPagar = todos ? c.precio : suelto;
  const porcentaje = Math.round(c.descuento * 100);
  const comboEnPedido = listo && cantidadDe(c.id) > 0;

  const alternar = (i: number) =>
    setTildados((t) => t.map((v, j) => (j === i ? !v : v)));

  const llevar = () => {
    if (elegidos.length === 0) return;
    if (todos) agregar(c.id);
    else elegidos.forEach((p) => agregar(p.id));
    /* Varias cosas de golpe: sin ver el pedido queda la duda de si
       entraron. Abrirlo lo confirma y deja "Enviar" a un toque. */
    abrir();
  };

  return (
    <section
      aria-labelledby={`combo-${c.slug}`}
      className={`rounded-suave border border-borde bg-papel p-5 shadow-sm sm:p-7 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
          Se usan juntos
        </p>
        <span className="rounded-md bg-positivo px-2 py-0.5 font-display text-xs font-bold text-white">
          {porcentaje}% OFF llevando los {c.productos.length}
        </span>
      </div>
      <h2 id={`combo-${c.slug}`} className="mt-2 font-display text-2xl font-semibold text-tinta sm:text-3xl">
        {c.nombre}
      </h2>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/*
          Las baldosas. En el telefono van una debajo de la otra, con la
          foto a la izquierda; en pantalla grande, en fila, con la foto
          arriba. Es la misma baldosa: solo cambia la direccion.
        */}
        <ol className="flex flex-1 flex-col lg:flex-row lg:items-start lg:gap-10">
          {c.productos.map((p, i) => (
            <Fragment key={p.id}>
              {/* El "+" del telefono: mide lo mismo que la foto (w-28), asi
                  queda debajo de ella y no en el medio del renglon. En
                  pantalla grande va otro, adentro de la baldosa. */}
              {i > 0 && (
                <li aria-hidden className="w-28 py-1 text-center text-2xl font-light text-tinta-suave lg:hidden">
                  +
                </li>
              )}
              {/*
                `@container` hace que 50cqw sea medio ancho de la baldosa,
                que es medio alto de la foto porque la foto es cuadrada: el
                centro exacto, al ancho que sea. Con un margen fijo el "+"
                quedaba 64 px arriba del centro apenas la pantalla crecia.
              */}
              <li className="@container relative min-w-0 lg:flex-1">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="absolute top-[50cqw] left-[-1.25rem] hidden -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-tinta-suave lg:block"
                  >
                    +
                  </span>
                )}
                <label
                  className={`flex cursor-pointer gap-4 transition-opacity lg:flex-col lg:gap-3 ${
                    tildados[i] ? "" : "opacity-45"
                  }`}
                >
                  <span className="relative block size-28 shrink-0 overflow-hidden rounded-chico bg-crema-oscuro/50 lg:size-auto lg:w-full">
                    <Image
                      src={fotoDe(p)}
                      alt={`${p.nombre}, de ${p.marca}`}
                      width={400}
                      height={400}
                      sizes="(min-width: 1024px) 14rem, 7rem"
                      className="aspect-square w-full object-contain mix-blend-multiply"
                    />
                    <input
                      type="checkbox"
                      checked={tildados[i]}
                      onChange={() => alternar(i)}
                      aria-label={`Incluir ${p.marca} ${p.nombre}`}
                      className="absolute top-2 right-2 size-5 cursor-pointer accent-vino"
                    />
                  </span>
                  <span className="flex min-w-0 flex-col justify-center">
                    <span className="font-display text-xs font-semibold tracking-[0.08em] text-vino uppercase">
                      {i + 1} · {PASO[p.categoria] ?? p.categoria}
                    </span>
                    <span className="mt-1 text-base leading-snug text-tinta">
                      <span className="font-semibold">{p.marca}</span> {p.nombre}
                    </span>
                    <span className="mt-1 text-base text-tinta-suave tabular-nums">
                      {formatearPrecio(p.precio)}
                    </span>
                  </span>
                </label>
              </li>
            </Fragment>
          ))}
        </ol>

        {/* El total y el boton: aparte, como en Amazon. */}
        <div className="rounded-chico bg-crema p-5 lg:w-72 lg:shrink-0">
          {todos ? (
            <>
              <p className="text-base text-tinta-suave">
                Por separado <span className="line-through tabular-nums">{formatearPrecio(c.suma)}</span>
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-tinta tabular-nums">
                {formatearPrecio(aPagar)}
              </p>
              <p className="mt-1 text-base font-semibold text-positivo">
                Ahorrás {formatearPrecio(c.ahorro)}
              </p>
            </>
          ) : (
            <>
              <p className="text-base text-tinta-suave">
                {elegidos.length === 0
                  ? "No elegiste ninguno"
                  : `${elegidos.length} de ${c.productos.length}, sin descuento`}
              </p>
              {/* Sin nada elegido no hay precio que mostrar. Y no se puede
                  pasar el 0 por `formatearPrecio`: es el de tratamientos,
                  y para 0 dice "A convenir". */}
              {elegidos.length > 0 && (
                <p className="mt-1 font-display text-4xl font-bold text-tinta tabular-nums">
                  {formatearPrecio(aPagar)}
                </p>
              )}
              {/* Lo que se deja sobre la mesa: el empujon a llevar los tres. */}
              <p className="mt-1 text-base font-semibold text-positivo">
                Llevando los {c.productos.length} ahorrás {formatearPrecio(c.ahorro)}
              </p>
            </>
          )}

          {todos && comboEnPedido ? (
            <button
              type="button"
              onClick={abrir}
              className="mt-4 flex min-h-13 w-full items-center justify-center gap-2 rounded-full border-2 border-positivo bg-papel px-5 font-display text-base font-semibold text-positivo transition-colors hover:bg-positivo hover:text-white"
            >
              <span aria-hidden>✓</span> Está en tu pedido · Ver
            </button>
          ) : (
            <button
              type="button"
              onClick={llevar}
              disabled={elegidos.length === 0}
              className="mt-4 flex min-h-13 w-full items-center justify-center rounded-full bg-vino px-5 font-display text-base font-semibold text-white shadow-md transition-colors hover:bg-vino-oscuro disabled:bg-tinta-suave/40 disabled:shadow-none"
            >
              {elegidos.length === 0
                ? "Elegí al menos uno"
                : `Agregar ${elegidos.length === 1 ? "1" : `los ${elegidos.length}`} al pedido`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
