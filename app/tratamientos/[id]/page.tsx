import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import BotonVolver from "@/components/BotonVolver";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { IconoCheck, IconoFlecha, IconoReloj } from "@/components/iconos";
import { obtenerTratamientos } from "@/lib/catalogo";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import { EN_POCAS_PALABRAS, formatearPrecio } from "@/lib/tratamientos";

type Ruta = { params: Promise<{ id: string }> };

/** Los extras siempre en el mismo orden, como en la portada. */
const ordenar = (extras: string[]) => extras.slice().sort((a, b) => a.localeCompare(b, "es"));

export async function generateMetadata({ params }: Ruta): Promise<Metadata> {
  const { id } = await params;
  const [tratamientos, CONSULTORIO] = await Promise.all([
    obtenerTratamientos(),
    obtenerConfiguracion(),
  ]);
  const t = tratamientos.find((x) => x.id === id);
  if (!t) return { title: `Tratamientos | ${CONSULTORIO.nombre}` };

  const incluye = ["Limpieza profunda", ...ordenar(t.extras)].join(", ");
  return {
    title: `${t.nombre} en ${CONSULTORIO.direccion.split(",")[1]?.trim() ?? "Caballito"} | ${CONSULTORIO.nombre}`,
    description: `${t.nombre}: ${incluye}. ${formatearPrecio(t.precio)} por sesión, ${t.duracion}. Con ${CONSULTORIO.profesional}, ${CONSULTORIO.titulo}.`,
    alternates: { canonical: `${SITIO_URL}/tratamientos/${t.id}` },
  };
}

/**
 * La pagina de un tratamiento: lo que se abre al tocar su tarjeta.
 *
 * EXISTE PARA QUE LA PORTADA NO CREZCA. Lucas queria que se entendiera
 * que es cada tecnica —"Dermaplaning" o "Microneedling" no le dicen nada
 * a quien no esta en el tema— pero sin llenar la pagina principal. Se
 * probaron tres formas de meterlo en la tarjeta (un boton que abria las
 * explicaciones, un ⓘ con globito y el texto siempre a la vista) y las
 * tres cargaban la seccion. Aca el detalle lo ve quien lo pide.
 *
 * POCO Y SIMPLE. Una sola tarjeta, con la misma forma que las de la
 * portada —blanca, linea vino arriba—: que es y cuanto sale, que incluye
 * con una linea por tecnica, y el boton grande para reservar. Abajo, los
 * otros tratamientos con su precio, para comparar sin volver atras.
 *
 * Es una pagina y no una ventana encima de la portada por lo mismo que
 * los productos: el boton de atras hace lo que se espera, y tiene
 * direccion propia, que Google encuentra cuando alguien busca
 * "dermaplaning Caballito".
 */
export default async function PaginaTratamiento({ params }: Ruta) {
  const { id } = await params;
  const [tratamientos, CONSULTORIO] = await Promise.all([
    obtenerTratamientos(),
    obtenerConfiguracion(),
  ]);
  const t = tratamientos.find((x) => x.id === id);
  if (!t) redirect("/#tratamientos");

  const incluye = ["Limpieza profunda", ...ordenar(t.extras)];
  const otros = tratamientos
    .filter((x) => x.id !== t.id && x.precio > 0)
    .sort((a, b) => a.precio - b.precio);

  return (
    <>
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-crema">
        <div className="contenedor py-6 md:py-12">
          <div className="mx-auto max-w-xl">
            <BotonVolver href="/#tratamientos" />

            <article className="mt-3 overflow-hidden rounded-suave border border-borde bg-papel">
              <span aria-hidden className="block h-1 bg-vino" />

              <header className="px-6 pt-5 pb-5">
                <p className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
                  Tratamiento facial
                </p>
                <h1 className="mt-2 text-3xl leading-tight text-tinta">{t.nombre}</h1>
                <p className="mt-3 flex flex-wrap items-baseline gap-x-2 leading-tight">
                  <span className="font-display text-4xl font-semibold text-tinta tabular-nums">
                    {formatearPrecio(t.precio)}
                  </span>
                  <span className="text-base text-tinta-suave">por sesión</span>
                </p>
                {t.duracion && (
                  <p className="mt-2 flex items-center gap-2 text-base text-tinta-suave">
                    <IconoReloj className="h-5 w-5 shrink-0" />
                    {t.duracion}
                  </p>
                )}
              </header>

              <section aria-labelledby="incluye" className="border-t border-borde px-6 py-5">
                <h2
                  id="incluye"
                  className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase"
                >
                  Incluye
                </h2>
                <ul className="mt-3 space-y-3 text-lg leading-snug text-tinta">
                  {incluye.map((x) => (
                    <li key={x} className="flex items-start gap-3">
                      <IconoCheck className="mt-1 h-5 w-5 shrink-0 text-vino" />
                      <span>
                        {x}
                        {EN_POCAS_PALABRAS[x] && (
                          <span className="block text-base text-tinta-suave">
                            {EN_POCAS_PALABRAS[x]}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* El cierre: el aviso de la consulta, que es la condicion
                  de todo lo de arriba, y el boton. */}
              <footer className="border-t border-borde bg-crema/60 px-6 py-5">
                <p className="text-base leading-snug text-tinta-suave">
                  El turno se saca como consulta: Valen te mira la piel y ahí confirman el
                  tratamiento.
                </p>
                <Link href="/#reservar" className="boton-principal mt-4 w-full">
                  Reservar turno
                </Link>
                <p className="mt-3 text-center text-base text-tinta-suave">
                  {CONSULTORIO.mediosDePago}
                </p>
                {/* Para quien lo quiere regalar: la giftcard se abre con
                    este tratamiento ya elegido. */}
                <Link
                  href={`/giftcard?regalo=${t.id}`}
                  className="mt-2 flex min-h-11 items-center justify-center gap-1.5 text-base font-semibold text-vino underline decoration-vino/30 underline-offset-4 hover:decoration-vino"
                >
                  Regalarlo con una giftcard
                  <IconoFlecha className="h-4 w-4" />
                </Link>
              </footer>
            </article>

            {/*
              LOS OTROS, PARA COMPARAR.

              Una lista corta de nombre y precio, sin tarjetas: quien esta
              mirando uno quiere saber cuanto sale el de al lado, y
              volver a la portada para eso es perder el hilo.
            */}
            {otros.length > 0 && (
              <section aria-labelledby="otros" className="mt-10">
                <h2
                  id="otros"
                  className="font-display text-lg font-semibold tracking-[0.1em] text-tinta uppercase"
                >
                  Otros tratamientos
                </h2>
                <ul className="mt-3 divide-y divide-borde border-y border-borde">
                  {otros.map((x) => (
                    <li key={x.id}>
                      <Link
                        href={`/tratamientos/${x.id}`}
                        className="flex min-h-14 items-center justify-between gap-4 py-3 text-lg text-tinta transition-colors hover:text-vino"
                      >
                        <span className="leading-snug">{x.nombre}</span>
                        <span className="flex shrink-0 items-center gap-2 font-display font-semibold tabular-nums">
                          {formatearPrecio(x.precio)}
                          <IconoFlecha className="h-4 w-4 text-tinta-suave" />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer consultorio={CONSULTORIO} />
    </>
  );
}
