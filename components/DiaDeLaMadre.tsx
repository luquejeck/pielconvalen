import Image from "next/image";
import Link from "next/link";
import { fotoDe, hayStock, slugDe, type Producto } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import ControlCarrito from "./ControlCarrito";
import { IconoRegalo } from "./iconos";

/**
 * El regalo del Dia de la Madre, en la portada: el kit de viaje
 * Madagascar Centella de SKIN1004.
 *
 * VA APENAS DEBAJO DE LA PORTADA, ARRIBA DE TODO. El orden de la pagina
 * pone primero el turno (ver app/page.tsx), pero esta semana la pregunta
 * de mucha gente que entra es "¿que le regalo a mamá?", y la respuesta
 * tiene fecha: el domingo 18. Es una banda de temporada y se va sola.
 *
 * SE VA SOLA EL LUNES 19. La fecha se mira en hora de Buenos Aires en
 * cada visita (la portada se arma por pedido, por las cookies de
 * Supabase), asi que no hay que acordarse de sacarla. Tampoco aparece si
 * el kit se despublica o se queda sin stock: no se promociona algo que
 * no se puede pedir.
 *
 * LOS CINCO PASOS VAN NUMERADOS porque son una secuencia de verdad: es
 * el orden en que se usan, de la doble limpieza a la crema. Es lo que
 * explica por que el kit es "la rutina completa" y no cinco frasquitos.
 *
 * EL BOTON ES EL MISMO DE LAS FICHAS (ControlCarrito, en grande): agregar
 * aca y agregar en la tienda se comportan igual. Sin precio cargado la
 * web ya dice "A convenir" y el WhatsApp le pregunta el precio a Valen.
 */

const CODIGO_KIT = "SKI-MADA-KIT";

/** El Dia de la Madre de 2026 en Argentina: tercer domingo de octubre. */
const DIA = { anio: 2026, mes: 10, dia: 18 };

const PASOS = ["Aceite limpiador", "Espuma", "Tónico", "Ampolla", "Crema"];

/** Cuantos dias faltan para el domingo, contados en Buenos Aires. */
function diasQueFaltan(ahora = new Date()): number {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora); // "2026-10-15"
  const [a, m, d] = hoy.split("-").map(Number);
  const unDia = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(DIA.anio, DIA.mes - 1, DIA.dia) - Date.UTC(a, m - 1, d)) / unDia);
}

function cuentaRegresiva(dias: number): string {
  if (dias === 0) return "Es hoy";
  if (dias === 1) return "Es mañana";
  return `Faltan ${dias} días`;
}

export default function DiaDeLaMadre({ productos }: { productos: Producto[] }) {
  const kit = productos.find((p) => p.codigo === CODIGO_KIT);
  const dias = diasQueFaltan();

  if (!kit || !hayStock(kit) || dias < 0) return null;

  return (
    <section
      id="dia-de-la-madre"
      aria-labelledby="dia-de-la-madre-titulo"
      className="border-t border-borde bg-crema-oscuro"
    >
      <div className="contenedor py-10 md:py-14">
        <article className="mx-auto grid max-w-5xl overflow-hidden rounded-suave bg-papel shadow-suave md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/*
            LA VIDRIERA: el kit sobre el vino de la marca, flotando, con
            el 18 en un sello como el de los combos. El brillo cruza una
            sola vez al aparecer, como en la giftcard.
          */}
          <div className="madre-vidriera relative isolate flex min-h-80 items-center justify-center overflow-hidden bg-[linear-gradient(150deg,#931656_0%,var(--color-vino)_45%,var(--color-vino-oscuro)_100%)] p-8 md:min-h-full">
            <span aria-hidden className="absolute -top-16 -left-16 size-56 rounded-full bg-crema/10" />
            <span aria-hidden className="absolute -right-10 -bottom-20 size-64 rounded-full bg-crema/10" />
            <span aria-hidden className="madre-brillo absolute inset-0 -z-0" />

            <div className="madre-flota relative z-10 w-full max-w-72 rounded-full bg-crema/95 p-5 shadow-[0_24px_50px_-20px_rgb(0_0_0/0.55)]">
              <Image
                src={fotoDe(kit)}
                alt={`${kit.marca} ${kit.nombre}: la caja y los cinco productos de la rutina`}
                width={640}
                height={640}
                sizes="(min-width: 768px) 18rem, 70vw"
                className="aspect-square w-full rounded-full object-contain mix-blend-multiply"
              />
            </div>

            <span
              aria-hidden
              className="absolute top-5 right-5 z-20 flex size-20 rotate-8 flex-col items-center justify-center rounded-full bg-crema font-display leading-none text-vino shadow-boton"
            >
              <span className="text-3xl font-bold">18</span>
              <span className="mt-0.5 text-[0.625rem] font-semibold tracking-[0.18em]">OCT</span>
            </span>
          </div>

          <div className="flex flex-col p-6 sm:p-8 md:p-10">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.16em] text-vino uppercase">
                <IconoRegalo className="h-4 w-4" />
                Día de la Madre
              </span>
              <span className="rounded-full bg-vino px-3 py-1 font-display text-xs font-semibold text-crema">
                {cuentaRegresiva(dias)}
              </span>
            </p>

            <h2
              id="dia-de-la-madre-titulo"
              className="mt-4 font-display text-3xl leading-[1.08] font-semibold text-balance text-tinta sm:text-4xl"
            >
              Regalale su rutina completa
            </h2>
            <p className="mt-3 text-lg leading-snug text-tinta-suave">
              El {kit.nombre} de {kit.marca}: skincare coreano en una
              cajita, para que se cuide ella. Con centella asiática, que calma,
              hidrata y repara. Para toda piel, también la sensible.
            </p>

            <ol className="mt-6 flex flex-wrap gap-2" aria-label="Lo que trae, en el orden en que se usa">
              {PASOS.map((paso, i) => (
                <li
                  key={paso}
                  className="inline-flex items-center gap-2 rounded-full border border-borde bg-crema py-1.5 pr-3.5 pl-1.5 text-sm text-tinta"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-vino-suave font-display text-xs font-bold text-vino">
                    {i + 1}
                  </span>
                  {paso}
                </li>
              ))}
            </ol>

            <div className="mt-auto pt-7">
              {kit.precio > 0 && (
                <p className="font-display text-3xl font-bold text-tinta tabular-nums">
                  <span className="sr-only">Precio: </span>
                  {formatearPrecio(kit.precio)}
                </p>
              )}
              <p className="mt-1 text-[0.9375rem] text-tinta-suave">
                Lo pedís desde acá y lo retirás en Caballito.
              </p>

              <ControlCarrito
                id={kit.id}
                nombre={`${kit.marca} ${kit.nombre}`}
                texto="Agregar el kit al pedido"
                grande
              />

              <p className="mt-4 flex flex-wrap justify-between gap-x-4 gap-y-2 text-[0.9375rem]">
                <Link
                  href={`/productos/${slugDe(kit)}`}
                  className="font-semibold text-vino underline-offset-4 hover:underline"
                >
                  Ver el kit
                </Link>
                <Link href="/giftcard" className="text-tinta-suave underline-offset-4 hover:text-vino hover:underline">
                  ¿Preferís regalarle una sesión? <span aria-hidden>→</span>
                </Link>
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
