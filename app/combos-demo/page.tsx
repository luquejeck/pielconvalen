import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import ControlCarrito from "@/components/ControlCarrito";
import TarjetaCombo from "@/components/TarjetaCombo";
import { PASO, type Combo } from "@/lib/combos";
import { fotoDe, PRODUCTOS } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * PAGINA DE PRUEBA: cinco propuestas para la tarjeta del combo, una al
 * lado de la otra con la actual, para elegir. No se enlaza desde ningun
 * lado y no se indexa. Cuando se elija una, se pasa a
 * components/TarjetaCombo.tsx y esta pagina se borra.
 *
 * Usa el combo de respaldo (lib/combos.ts) armado con los productos del
 * archivo, asi se ve igual con o sin base.
 */
export const metadata: Metadata = {
  title: "Combos · propuestas",
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
  descripcion: "Limpiar, tratar y cuidar el contorno. Tres pasos que apuntan a la elasticidad de la piel.",
  productos,
  suma,
  precio,
  ahorro: suma - precio,
  descuento: 0.1,
};

const pct = (c: Combo) => Math.round(c.descuento * 100);
const paso = (categoria: string) => PASO[categoria] ?? categoria;

/* ------------------------------------------------------------------ */
/* 1. RUTINA PASO A PASO                                               */
/* Cada producto es un renglon numerado con foto grande, nombre entero */
/* y su precio suelto. Se lee como la rutina que es: 1, 2, 3.          */
/* ------------------------------------------------------------------ */
function OpcionPasos({ combo: c }: { combo: Combo }) {
  return (
    <article className="flex flex-col rounded-suave bg-papel p-5 shadow-suave">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-xs font-semibold tracking-[0.12em] text-vino uppercase">
            Tu rutina en {c.productos.length} pasos
          </p>
          <h3 className="mt-1 font-display text-2xl leading-tight font-semibold text-tinta">{c.nombre}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-positivo-suave px-3 py-1.5 font-display text-sm font-bold text-positivo tabular-nums">
          −{pct(c)}%
        </span>
      </div>

      <ol className="relative mt-5 space-y-3">
        {/* La linea que une los pasos: dice "esto va en orden". */}
        <span aria-hidden className="absolute top-8 bottom-8 left-[1.375rem] w-px bg-borde" />
        {c.productos.map((p, i) => (
          <li key={p.id} className="relative flex items-center gap-3">
            <span className="relative z-10 grid size-11 shrink-0 place-items-center rounded-full bg-vino font-display text-base font-bold text-white">
              {i + 1}
            </span>
            <span className="block size-16 shrink-0 overflow-hidden rounded-chico bg-crema">
              <Image src={fotoDe(p)} alt="" width={160} height={160} className="size-full object-cover mix-blend-multiply" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold tracking-wide text-vino uppercase">{paso(p.categoria)}</span>
              <span className="block text-[0.9375rem] leading-snug text-tinta">
                <span className="font-semibold">{p.marca}</span> {p.nombre}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-borde pt-4">
        <div>
          <p className="text-sm text-tinta-suave">
            Por separado <span className="line-through tabular-nums">{formatearPrecio(c.suma)}</span>
          </p>
          <p className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</p>
        </div>
        <p className="pb-1 text-right text-[0.9375rem] font-semibold text-positivo">
          Ahorrás
          <br />
          <span className="tabular-nums">{formatearPrecio(c.ahorro)}</span>
        </p>
      </div>
      <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar rutina al pedido" grande />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 2. BODEGON                                                          */
/* Una sola foto grande con los envases parados juntos, encimados,     */
/* como en una vidriera. Vende el conjunto, no tres miniaturas.        */
/* ------------------------------------------------------------------ */
function OpcionBodegon({ combo: c }: { combo: Combo }) {
  const n = c.productos.length;
  return (
    <article className="flex flex-col overflow-hidden rounded-suave bg-papel shadow-suave">
      <div className="relative aspect-[4/3] bg-gradient-to-b from-vino-suave to-crema-oscuro">
        {/* El estante: una elipse suave donde "apoyan" los envases. */}
        <span aria-hidden className="absolute inset-x-8 bottom-6 h-6 rounded-[50%] bg-tinta/10 blur-md" />
        <div aria-hidden className="absolute inset-0 flex items-end justify-center px-4 pb-4">
          {c.productos.map((p, i) => {
            const centro = i === Math.floor(n / 2);
            return (
              <span
                key={p.id}
                className={`relative block overflow-hidden rounded-full bg-papel ring-4 ring-papel/70 ${
                  centro ? "z-10 size-40" : "size-28"
                } ${i > 0 ? "-ml-6" : ""}`}
              >
                <Image src={fotoDe(p)} alt="" width={320} height={320} className="size-full scale-[1.45] object-cover" />
              </span>
            );
          })}
        </div>
        <span className="absolute top-4 left-4 rounded-full bg-positivo px-3 py-1.5 font-display text-sm font-bold text-white shadow-boton tabular-nums">
          Ahorrás {formatearPrecio(c.ahorro)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-2xl leading-tight font-semibold text-tinta">{c.nombre}</h3>
        <p className="mt-1.5 text-[0.9375rem] leading-snug text-tinta-suave">{c.descripcion}</p>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {c.productos.map((p) => (
            <li key={p.id} className="rounded-full border border-borde px-2.5 py-1 text-sm text-tinta">
              {p.marca} {p.nombre}
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-5">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</span>
            <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">{formatearPrecio(c.suma)}</span>
          </p>
          <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 3. TICKET                                                           */
/* La cuenta a la vista, como un ticket: cada producto con su precio,  */
/* el descuento restando, y el total. No hay que creer el "10% OFF":   */
/* se ve de donde sale.                                                */
/* ------------------------------------------------------------------ */
function OpcionTicket({ combo: c }: { combo: Combo }) {
  return (
    <article className="flex flex-col rounded-suave border border-borde bg-papel p-5">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          {c.productos.map((p) => (
            <span key={p.id} className="block size-12 overflow-hidden rounded-full border-2 border-papel bg-crema">
              <Image src={fotoDe(p)} alt="" width={96} height={96} className="size-full object-cover mix-blend-multiply" />
            </span>
          ))}
        </div>
        <div className="min-w-0">
          <p className="font-display text-xs font-semibold tracking-[0.12em] text-vino uppercase">
            Combo · {c.productos.length} productos
          </p>
          <h3 className="font-display text-xl leading-tight font-semibold text-tinta">{c.nombre}</h3>
        </div>
      </div>

      <div className="mt-5 rounded-chico bg-crema p-4">
        <dl className="space-y-2.5 text-[0.9375rem]">
          {c.productos.map((p) => (
            <div key={p.id} className="flex items-baseline gap-2">
              <dt className="min-w-0 text-tinta">
                <span className="font-semibold">{p.marca}</span> {p.nombre}
              </dt>
              <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.2rem] border-b border-dotted border-tinta-suave/50" />
              <dd className="shrink-0 text-tinta-suave tabular-nums">{formatearPrecio(p.precio)}</dd>
            </div>
          ))}
          <div className="flex items-baseline justify-between border-t border-dashed border-borde pt-2.5 font-semibold text-positivo">
            <dt>Descuento combo ({pct(c)}%)</dt>
            <dd className="tabular-nums">−{formatearPrecio(c.ahorro)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto flex items-baseline justify-between pt-4">
        <span className="font-display text-sm font-semibold tracking-[0.1em] text-tinta-suave uppercase">Total</span>
        <span className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</span>
      </div>
      <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 4. CAJA DE REGALO                                                   */
/* Fondo tinta, el unico bloque oscuro de la tienda: el combo se       */
/* distingue de un producto suelto a primera vista. Fotos en baldosas  */
/* claras, precio en blanco, boton en crema.                           */
/* ------------------------------------------------------------------ */
function OpcionOscura({ combo: c }: { combo: Combo }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-suave bg-tinta p-5 text-white">
      <span aria-hidden className="absolute -top-16 -right-16 size-48 rounded-full bg-vino/60 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Combo · {c.productos.length} productos
        </p>
        <span className="rounded-full bg-white px-3 py-1 font-display text-sm font-bold text-vino tabular-nums">
          {pct(c)}% OFF
        </span>
      </div>
      <h3 className="relative mt-2 font-display text-2xl leading-tight font-semibold">{c.nombre}</h3>
      <p className="relative mt-1 text-[0.9375rem] text-white/75">
        {c.productos.map((p) => paso(p.categoria)).join(" · ")}
      </p>

      <ul className="relative mt-4 grid grid-cols-3 gap-2">
        {c.productos.map((p) => (
          <li key={p.id} className="flex flex-col">
            <span className="block overflow-hidden rounded-chico bg-papel">
              <Image src={fotoDe(p)} alt="" width={200} height={200} className="aspect-square w-full object-cover" />
            </span>
            <span className="mt-1.5 text-[0.8125rem] leading-tight text-white/85">
              <span className="font-semibold text-white">{p.marca}</span> {p.nombre}
            </span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-5">
        <p className="text-[0.9375rem] text-white/70">
          Por separado <span className="line-through tabular-nums">{formatearPrecio(c.suma)}</span>
        </p>
        <p className="flex items-baseline gap-3">
          <span className="font-display text-3xl font-bold tabular-nums">{formatearPrecio(c.precio)}</span>
          <span className="font-semibold text-[#9fd6b8] tabular-nums">Ahorrás {formatearPrecio(c.ahorro)}</span>
        </p>
        <button
          type="button"
          className="mt-4 flex min-h-13 w-full items-center justify-center gap-1.5 rounded-full bg-papel px-3 font-display text-base font-semibold text-vino transition-colors hover:bg-vino-suave"
        >
          <span aria-hidden>+</span> Agregar combo al pedido
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* 5. COMPACTA                                                         */
/* Mosaico de fotos a la izquierda, datos a la derecha. Mide la mitad  */
/* de alto: en el telefono entran dos combos por pantalla y no hace    */
/* falta carrusel.                                                     */
/* ------------------------------------------------------------------ */
function OpcionCompacta({ combo: c }: { combo: Combo }) {
  const [a, ...resto] = c.productos;
  return (
    <article className="rounded-suave bg-papel p-3 shadow-suave">
      <div className="flex gap-3">
        <div aria-hidden className="grid w-32 shrink-0 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-chico">
          <span className="col-span-2 block bg-crema">
            <Image src={fotoDe(a)} alt="" width={256} height={128} className="h-16 w-full object-contain mix-blend-multiply" />
          </span>
          {resto.slice(0, 2).map((p) => (
            <span key={p.id} className="block bg-crema">
              <Image src={fotoDe(p)} alt="" width={128} height={128} className="h-16 w-full object-contain mix-blend-multiply" />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded-md bg-positivo px-1.5 py-0.5 font-display text-xs font-bold text-white tabular-nums">
            {pct(c)}% OFF
          </span>
          <h3 className="mt-1 font-display text-lg leading-tight font-semibold text-tinta">{c.nombre}</h3>
          <p className="mt-0.5 text-sm leading-snug text-tinta-suave">
            {c.productos.map((p, i) => (
              <Fragment key={p.id}>
                {i > 0 && " + "}
                {p.marca}
              </Fragment>
            ))}
          </p>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
            <span className="font-display text-xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</span>
            <span className="text-sm text-tinta-suave line-through tabular-nums">{formatearPrecio(c.suma)}</span>
          </p>
        </div>
      </div>
      <details className="group mt-2 text-[0.9375rem]">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-chico px-1 font-semibold text-vino">
          Qué trae
          <span aria-hidden className="transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <ul className="space-y-1 px-1 pb-1 text-tinta">
          {c.productos.map((p) => (
            <li key={p.id}>
              <span className="text-tinta-suave">{paso(p.categoria)}:</span> <span className="font-semibold">{p.marca}</span>{" "}
              {p.nombre}
            </li>
          ))}
        </ul>
      </details>
      <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto={`Agregar · ahorrás ${formatearPrecio(c.ahorro)}`} />
    </article>
  );
}

const OPCIONES = [
  { n: 0, titulo: "Actual", nota: "La tarjeta de hoy, para comparar.", C: null },
  { n: 1, titulo: "Rutina paso a paso", nota: "Numerada y con línea de tiempo: se entiende el orden de uso. Fotos más grandes y nombres completos.", C: OpcionPasos },
  { n: 2, titulo: "Bodegón", nota: "Una imagen protagonista con los envases agrupados, como vidriera. La más aspiracional.", C: OpcionBodegon },
  { n: 3, titulo: "Ticket", nota: "La cuenta a la vista: cada precio, el descuento restando y el total. La más transparente.", C: OpcionTicket },
  { n: 4, titulo: "Caja de regalo", nota: "Bloque oscuro de la marca: el combo se distingue de un producto suelto al primer vistazo.", C: OpcionOscura },
  { n: 5, titulo: "Compacta", nota: "La mitad de alto: dos combos por pantalla de celular, el detalle en un desplegable.", C: OpcionCompacta },
];

export default function CombosDemo() {
  return (
    <main className="min-h-screen bg-crema px-4 py-10 sm:px-8">
      <h1 className="text-center font-display text-2xl font-semibold text-tinta">Combos · 5 propuestas</h1>
      <div className="mx-auto mt-8 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {OPCIONES.map(({ n, titulo, nota, C }) => (
          <section key={n} id={`opcion-${n}`} className="flex flex-col">
            <h2 className="font-display text-lg font-semibold text-vino">
              {n === 0 ? titulo : `${n}. ${titulo}`}
            </h2>
            <p className="mt-1 mb-4 text-sm text-tinta-suave">{nota}</p>
            {C ? (
              <C combo={COMBO} />
            ) : (
              <ul className="flex">
                <TarjetaCombo combo={COMBO} />
              </ul>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
