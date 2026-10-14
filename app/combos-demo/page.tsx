import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ControlCarrito from "@/components/ControlCarrito";
import TarjetaCombo from "@/components/TarjetaCombo";
import { type Combo } from "@/lib/combos";
import { fotoDe, PRODUCTOS, slugDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * PAGINA DE PRUEBA: la propuesta de la tarjeta del combo al lado de la
 * actual. No se enlaza desde ningun lado y no se indexa. Cuando se
 * apruebe, pasa a components/TarjetaCombo.tsx y esta pagina se borra.
 *
 * Usa el combo de respaldo (lib/combos.ts) armado con los productos del
 * archivo, asi se ve igual con o sin base.
 */
export const metadata: Metadata = {
  title: "Combos · propuesta",
  robots: { index: false, follow: false },
};

const ids = ["ariul-deep-cera", "joseon-revive-serum", "ahc-time-rewind-eye"];
const productos = ids.map((id) => PRODUCTOS.find((p) => p.id === id)!);
const suma = productos.reduce((n, p) => n + p.precio, 0);
const precio = Math.floor((suma * 0.9) / 100) * 100;
const COMBO: Combo = {
  id: "combo-rutina-antiedad",
  slug: "rutina-antiedad",
  nombre: "Rutina antiedad",
  descripcion: "Tres pasos que apuntan a la elasticidad de la piel.",
  productos,
  suma,
  precio,
  ahorro: suma - precio,
  descuento: 0.1,
};

/**
 * LA PROPUESTA, SIMPLE: que es, que trae, cuanto se ahorra, el boton.
 *
 *   - El nombre y una sola linea de por que esos productos van juntos.
 *   - Las tres fotos en fila, con marca, nombre y el precio suelto de
 *     cada una: ver los precios es lo que hace creible el ahorro. Cada
 *     una lleva a la ficha del producto.
 *   - El precio tachado al lado del final, y debajo el ahorro en pesos,
 *     en verde. Es lo unico con color ademas del boton.
 */
function Propuesta({ combo: c }: { combo: Combo }) {
  const porcentaje = Math.round(c.descuento * 100);

  return (
    <article aria-labelledby={`combo-${c.slug}`} className="flex flex-col rounded-suave border border-borde bg-papel p-5 shadow-suave">
      <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">Combo</p>
      <h3 id={`combo-${c.slug}`} className="mt-1 font-display text-2xl text-balance leading-tight font-semibold text-tinta">{c.nombre}</h3>
      <p className="mt-1 text-[0.9375rem] text-tinta-suave">Elegidos por Valen para usar juntos</p>

      {/*
        Cada producto lleva a su ficha: quien quiere saber que es el
        Revive Serum antes de llevarse el combo lo toca y lo ve, sin
        buscarlo en el catalogo. La baldosa entera es el blanco a tocar.
        Las fotos van sin alt porque el nombre esta escrito debajo y el
        lector de pantalla lo diria dos veces.
      */}
      <ul className="mt-5 grid grid-cols-3 gap-2.5">
        {c.productos.map((p) => (
          <li key={p.id} className="flex">
            <Link
              href={`/productos/${slugDe(p)}`}
              className="group flex w-full flex-col rounded-chico focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vino"
            >
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

      <div className="mt-auto pt-5">
        <p className="flex items-baseline gap-2.5">
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
  );
}

export default function CombosDemo() {
  return (
    <main className="min-h-screen bg-crema px-4 py-10 sm:px-8">
      <h1 className="text-center font-display text-2xl font-semibold text-tinta">Combos · propuesta</h1>
      <div className="mx-auto mt-8 grid max-w-4xl gap-10 sm:grid-cols-2">
        <section id="propuesta" className="flex flex-col">
          <h2 className="mb-4 font-display text-lg font-semibold text-vino">Propuesta</h2>
          <Propuesta combo={COMBO} />
        </section>
        <section id="actual" className="flex flex-col">
          <h2 className="mb-4 font-display text-lg font-semibold text-vino">Actual</h2>
          <ul className="flex">
            <TarjetaCombo combo={COMBO} />
          </ul>
        </section>
      </div>
    </main>
  );
}
