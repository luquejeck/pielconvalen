import type { Metadata } from "next";
import Image from "next/image";
import ControlCarrito from "@/components/ControlCarrito";
import TarjetaCombo from "@/components/TarjetaCombo";
import { IconoCheck } from "@/components/iconos";
import { PASO, type Combo } from "@/lib/combos";
import { fotoDe, PRODUCTOS } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";

/**
 * PAGINA DE PRUEBA: la propuesta nueva de la tarjeta del combo al lado
 * de la actual. No se enlaza desde ningun lado y no se indexa. Cuando
 * se apruebe, pasa a components/TarjetaCombo.tsx y esta pagina se borra.
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
 * LA PROPUESTA: simple, en la paleta de la casa, y con la cuenta a la
 * vista.
 *
 *   1. Que es: rotulo chico, nombre, una linea de para que sirve.
 *   2. Que trae: cada producto en su baldosa crema con el paso, la marca,
 *      el nombre y SU precio suelto. Ver los tres precios es lo que hace
 *      creible el ahorro: la clienta puede sumar.
 *   3. Cuanto se ahorra: un bloque tranquilo de tres renglones —por
 *      separado, el descuento restando, lo que pagás—. El ahorro va en
 *      pesos y en verde, nada mas: sin etiquetas llenas.
 *   4. Por que llevar el combo: tres tildes cortos.
 *   5. El boton.
 *
 * El unico color fuerte es el vino del boton; el verde aparece solo en
 * el ahorro, que es lo que tiene que llamar la atencion.
 */
function Propuesta({ combo: c, filas = false }: { combo: Combo; filas?: boolean }) {
  const porcentaje = Math.round(c.descuento * 100);
  const beneficios = [
    "Elegidos por Valen para usar juntos",
    "Cada uno cumple un paso, ninguno se repite",
    "La rutina completa en un solo pedido",
  ];

  return (
    <article className="flex flex-col rounded-suave border border-borde bg-papel p-5 shadow-suave">
      <p className="font-display text-xs font-semibold tracking-[0.14em] text-vino uppercase">
        Combo · {c.productos.length} productos
      </p>
      <h3 className="mt-1 font-display text-2xl leading-tight font-semibold text-tinta">{c.nombre}</h3>
      <p className="mt-1 text-[0.9375rem] leading-snug text-tinta-suave">{c.descripcion}</p>

      {/* QUE TRAE */}
      {filas ? (
        <ul className="mt-5 divide-y divide-borde/70">
          {c.productos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="block size-16 shrink-0 overflow-hidden rounded-chico bg-crema">
                <Image src={fotoDe(p)} alt="" width={160} height={160} className="size-full object-cover mix-blend-multiply" />
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                <span className="block text-xs tracking-wide text-tinta-suave uppercase">
                  {PASO[p.categoria] ?? p.categoria}
                </span>
                <span className="block text-[0.9375rem] text-tinta">
                  <span className="font-semibold">{p.marca}</span> {p.nombre}
                </span>
              </span>
              <span className="shrink-0 text-[0.9375rem] text-tinta-suave tabular-nums">{formatearPrecio(p.precio)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-5 grid grid-cols-3 gap-2.5">
          {c.productos.map((p) => (
            <li key={p.id} className="flex flex-col">
              <span className="block overflow-hidden rounded-chico bg-crema">
                <Image
                  src={fotoDe(p)}
                  alt=""
                  width={240}
                  height={240}
                  sizes="(min-width: 1024px) 8rem, 30vw"
                  className="aspect-square w-full object-cover mix-blend-multiply"
                />
              </span>
              <span className="mt-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-tinta-suave uppercase">
                {PASO[p.categoria] ?? p.categoria}
              </span>
              <span className="mt-0.5 text-sm leading-snug text-tinta">
                <span className="font-semibold">{p.marca}</span> {p.nombre}
              </span>
              <span className="mt-auto pt-1 text-sm text-tinta-suave tabular-nums">{formatearPrecio(p.precio)}</span>
            </li>
          ))}
        </ul>
      )}

      {/* LA CUENTA */}
      <dl className="mt-5 rounded-chico bg-crema px-4 py-3.5 text-[0.9375rem]">
        <div className="flex items-baseline justify-between text-tinta-suave">
          <dt>Por separado</dt>
          <dd className="line-through tabular-nums">{formatearPrecio(c.suma)}</dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between font-semibold text-positivo">
          <dt>Ahorro del combo ({porcentaje}%)</dt>
          <dd className="tabular-nums">−{formatearPrecio(c.ahorro)}</dd>
        </div>
        <div className="mt-3 flex items-baseline justify-between border-t border-borde pt-3">
          <dt className="font-display text-sm font-semibold tracking-[0.1em] text-tinta uppercase">Pagás</dt>
          <dd className="font-display text-3xl font-bold text-tinta tabular-nums">{formatearPrecio(c.precio)}</dd>
        </div>
      </dl>

      {/* POR QUE EL COMBO */}
      <ul className="mt-4 space-y-1.5 text-[0.9375rem] leading-snug text-tinta">
        {beneficios.map((b) => (
          <li key={b} className="flex gap-2">
            <IconoCheck className="mt-0.5 size-4 shrink-0 text-vino" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        <ControlCarrito
          id={c.id}
          nombre={`Combo ${c.nombre}`}
          texto="Agregar combo al pedido"
          grande
        />
      </div>
    </article>
  );
}

const OPCIONES = [
  { id: "actual", titulo: "Actual", nota: "La tarjeta de hoy, para comparar." },
  {
    id: "propuesta-a",
    titulo: "Propuesta · A",
    nota: "Fotos en fila, cada producto con su precio suelto, la cuenta del ahorro y por qué conviene.",
  },
  {
    id: "propuesta-b",
    titulo: "Propuesta · B",
    nota: "Lo mismo, con los productos uno debajo del otro: nombres en una línea y precios alineados.",
  },
];

export default function CombosDemo() {
  return (
    <main className="min-h-screen bg-crema px-4 py-10 sm:px-8">
      <h1 className="text-center font-display text-2xl font-semibold text-tinta">Combos · propuesta</h1>
      <div className="mx-auto mt-8 grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {OPCIONES.map(({ id, titulo, nota }) => (
          <section key={id} id={id} className="flex flex-col">
            <h2 className="font-display text-lg font-semibold text-vino">{titulo}</h2>
            <p className="mt-1 mb-4 text-sm text-tinta-suave">{nota}</p>
            {id === "actual" ? (
              <ul className="flex">
                <TarjetaCombo combo={COMBO} />
              </ul>
            ) : (
              <Propuesta combo={COMBO} filas={id === "propuesta-b"} />
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
