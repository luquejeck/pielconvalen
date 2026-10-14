import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Carrusel from "@/components/Carrusel";
import ControlCarrito from "@/components/ControlCarrito";
import TarjetaCombo from "@/components/TarjetaCombo";
import TituloTienda from "@/components/TituloTienda";
import type { Combo } from "@/lib/combos";
import { fotoDe, PRODUCTOS, slugDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * PAGINA DE PRUEBA: variantes de la tarjeta del combo dentro del
 * carrusel real, con el ancho que la ve la clienta. No se enlaza ni se
 * indexa; se borra cuando se elija una.
 */
export const metadata: Metadata = {
  title: "Combos · propuesta",
  robots: { index: false, follow: false },
};

function armar(slug: string, nombre: string, ids: string[]): Combo {
  const productos = ids.map((id) => PRODUCTOS.find((p) => p.id === id)!);
  const suma = productos.reduce((n, p) => n + p.precio, 0);
  const precio = Math.floor((suma * 0.9) / 100) * 100;
  return { id: `combo-${slug}`, slug, nombre, descripcion: "", productos, suma, precio, ahorro: suma - precio, descuento: 0.1 };
}

const COMBOS = [
  armar("rutina-antiedad", "Rutina antiedad", ["ariul-deep-cera", "joseon-revive-serum", "ahc-time-rewind-eye"]),
  armar("rutina-glow", "Rutina glow", ["ariul-deep-clean", "anua-heartleaf-ampoule", "joseon-relief-sun-aqua"]),
];

/* ------------------------------------------------------------------ */
/* A. LISTA AIREADA                                                    */
/* Un producto por renglon: foto, nombre entero y precio a la derecha. */
/* Cada cosa tiene su lugar y nada compite por el ancho.               */
/* ------------------------------------------------------------------ */
function Lista({ combo: c }: { combo: Combo }) {
  const pct = Math.round(c.descuento * 100);
  return (
    <li className="flex">
      <article className="flex w-full flex-col rounded-suave bg-papel p-6 shadow-suave">
        <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">Combo</p>
        <h3 className="mt-1.5 font-display text-2xl leading-tight font-semibold text-tinta">{c.nombre}</h3>

        <ul className="mt-6 space-y-4">
          {c.productos.map((p) => (
            <li key={p.id}>
              <Link href={`/productos/${slugDe(p)}`} className="group flex items-center gap-4">
                <span className="block size-16 shrink-0 overflow-hidden rounded-chico bg-crema">
                  <Image src={fotoDe(p)} alt="" width={160} height={160} className="size-full object-cover mix-blend-multiply" />
                </span>
                <span className="min-w-0 flex-1 leading-snug">
                  <span className="block text-[0.8125rem] text-tinta-suave">{p.marca}</span>
                  <span className="block text-[0.9375rem] text-tinta group-hover:underline group-hover:decoration-borde">
                    {p.nombre}
                  </span>
                </span>
                <span className="shrink-0 text-[0.9375rem] text-tinta-suave tabular-nums">{formatearPrecio(p.precio)}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-6">
          <div className="border-t border-borde pt-5">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</span>
              <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">{formatearPrecio(c.suma)}</span>
            </p>
            <p className="mt-1 text-[0.9375rem] font-semibold text-positivo">
              Ahorrás {formatearPrecio(c.ahorro)} · {pct}% menos
            </p>
          </div>
          <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
        </div>
      </article>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* B. FOTO PROTAGONISTA                                                */
/* Una sola baldosa grande con los envases juntos; debajo los nombres  */
/* en una lista corta. Menos cosas en el mismo ancho.                  */
/* ------------------------------------------------------------------ */
function Foto({ combo: c }: { combo: Combo }) {
  const pct = Math.round(c.descuento * 100);
  return (
    <li className="flex">
      <article className="flex w-full flex-col overflow-hidden rounded-suave bg-papel shadow-suave">
        <div aria-hidden className="flex items-center justify-center gap-1 bg-crema px-4 py-5">
          {c.productos.map((p) => (
            <Image
              key={p.id}
              src={fotoDe(p)}
              alt=""
              width={240}
              height={240}
              className="aspect-square w-1/3 max-w-32 rounded-chico object-cover mix-blend-multiply"
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">
            Combo · {c.productos.length} productos
          </p>
          <h3 className="mt-1.5 font-display text-2xl leading-tight font-semibold text-tinta">{c.nombre}</h3>
          <ul className="mt-3 space-y-1 text-[0.9375rem] leading-snug text-tinta-suave">
            {c.productos.map((p) => (
              <li key={p.id}>
                <Link href={`/productos/${slugDe(p)}`} className="hover:text-tinta hover:underline">
                  <span className="text-tinta">{p.marca}</span> {p.nombre}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            <p className="flex items-baseline gap-2.5">
              <span className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</span>
              <span className="text-[0.9375rem] text-tinta-suave line-through tabular-nums">{formatearPrecio(c.suma)}</span>
            </p>
            <p className="mt-1 text-[0.9375rem] font-semibold text-positivo">
              Ahorrás {formatearPrecio(c.ahorro)} · {pct}% menos
            </p>
            <ControlCarrito id={c.id} nombre={`Combo ${c.nombre}`} texto="Agregar combo al pedido" grande />
          </div>
        </div>
      </article>
    </li>
  );
}

const VARIANTES = [
  { id: "actual", titulo: "Actual (online)", Tarjeta: TarjetaCombo },
  { id: "lista", titulo: "A · Lista aireada", Tarjeta: Lista },
  { id: "foto", titulo: "B · Foto protagonista", Tarjeta: Foto },
];

export default function CombosDemo() {
  return (
    <main>
      {VARIANTES.map(({ id, titulo, Tarjeta }) => (
        <section key={id} id={id} className="border-t border-borde bg-crema-oscuro seccion">
          <div className="contenedor">
            <p className="mb-6 text-center font-display text-sm font-semibold text-vino">{titulo}</p>
            <TituloTienda titulo="Combos" />
            <div className="mt-6">
              <Carrusel etiqueta={`Combos ${id}`} tipo="combos">
                {COMBOS.map((c) => (
                  <Tarjeta key={c.id} combo={c} />
                ))}
              </Carrusel>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
