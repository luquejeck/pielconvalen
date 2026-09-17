import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FichaProducto from "@/components/FichaProducto";
import { IconoFlecha, IconoWhatsApp } from "@/components/iconos";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import {
  aSlug,
  marcas,
  marcasConFoto,
  porCategoria,
  productosDeMarca,
  productosPublicados,
} from "@/lib/productos";
import { linkConsultaProductos } from "@/lib/whatsapp";

type Busqueda = { searchParams: Promise<{ marca?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const CONSULTORIO = await obtenerConfiguracion();
  const cuantos = productosPublicados().length;

  return {
    title: `Productos | ${CONSULTORIO.nombre}`,
    description: `${cuantos} productos de cosmética coreana elegidos por ${CONSULTORIO.profesional}: ${marcas().join(", ")}. Se compran por WhatsApp y se retiran en ${CONSULTORIO.direccion}.`,
    alternates: { canonical: `${SITIO_URL}/productos` },
    openGraph: {
      title: `Productos | ${CONSULTORIO.nombre}`,
      description: `Cosmética coreana elegida por ${CONSULTORIO.profesional}. Se compra por WhatsApp.`,
      locale: "es_AR",
      type: "website",
    },
  };
}

/**
 * El catalogo completo.
 *
 * VA EN GRILLA Y NO EN CARRUSEL, al reves que la portada. Son dos
 * preguntas distintas: en la portada es "¿esta tambien vende productos?"
 * y una fila cortada la contesta bien, porque se ve que hay mas; aca es
 * "¿cual me llevo?", y esconder la mitad del catalogo detras de un gesto
 * juega en contra.
 *
 * ORDENADOS POR RUTINA, no por precio ni alfabeticamente: primero se
 * limpia, despues se trata, despues se hidrata y al final se protege.
 * Quien esta armando su primera rutina lo lee de arriba a abajo y lo que
 * le queda es el orden en que se aplica.
 *
 * Con ?marca= en la direccion muestra una sola marca. Es a donde llevan
 * las tarjetas del mosaico de la portada, y es un filtro de verdad —no
 * un ancla— porque quien entra buscando Beauty of Joseon no quiere
 * saltar hasta ahi: quiere que lo demas no este.
 */
export default async function Productos({ searchParams }: Busqueda) {
  const CONSULTORIO = await obtenerConfiguracion();
  const { marca: marcaPedida } = await searchParams;

  /* Se valida contra las marcas que existen: un ?marca=cualquier-cosa
     tiene que caer en el catalogo entero y no en una pagina vacia. */
  const marcaElegida = marcasConFoto().find((m) => m.slug === marcaPedida);
  const filtrados = marcaElegida ? productosDeMarca(marcaElegida.slug) : [];

  const grupos = porCategoria();

  return (
    <>
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-crema">
        <div className="contenedor py-12 md:py-16 xl:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-base text-tinta-suave transition-colors hover:text-vino"
          >
            <IconoFlecha className="h-4 w-4 rotate-180" />
            Volver al inicio
          </Link>

          <header className="mt-6 max-w-3xl">
            <h1 className="text-4xl text-tinta sm:text-5xl">
              {marcaElegida ? marcaElegida.nombre : "Productos"}
            </h1>
            {/* Con marca elegida queda el conteo, que es informacion:
                dice cuantos hay sin tener que contarlos. Sin marca no va
                nada: el titulo "Productos" ya lo dice todo. */}
            {marcaElegida && (
              <p className="mt-3 text-xl leading-snug text-tinta-suave">
                {filtrados.length}{" "}
                {filtrados.length === 1 ? "producto" : "productos"} de esta
                marca.
              </p>
            )}
          </header>

          {marcaElegida ? (
            <>
              <Link
                href="/productos"
                className="mt-7 inline-flex min-h-10 items-center gap-2 rounded-full border border-borde bg-papel px-4 text-base text-tinta transition-colors hover:border-vino hover:text-vino"
              >
                <IconoFlecha className="h-4 w-4 rotate-180" />
                Ver las {marcas().length} marcas
              </Link>

              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {filtrados.map((p) => (
                  <FichaProducto
                    key={p.id}
                    producto={p}
                    whatsapp={CONSULTORIO.whatsapp}
                  />
                ))}
              </ul>
            </>
          ) : (
            <>
              {/*
                Indice de categorias: son anclas y no filtros. El filtro
                esconde y obliga a volver atras para ver el resto, y con
                trece productos no hay nada que esconder. La marca si
                filtra, porque ahi la clienta ya decidio.

                La fila se desliza al costado en celular en vez de
                envolverse en tres renglones: asi el titulo de la primera
                categoria queda a la vista sin scrollear.
              */}
              <nav aria-label="Categorías" className="mt-7">
                <ul className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5">
                  {grupos.map(({ categoria, items }) => (
                    <li key={categoria} className="shrink-0">
                      <a
                        href={`#${aSlug(categoria)}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-borde bg-papel px-4 text-base whitespace-nowrap text-tinta transition-colors hover:border-vino hover:text-vino"
                      >
                        {categoria}
                        <span className="text-tinta-suave tabular-nums">
                          {items.length}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              {grupos.map(({ categoria, items }) => (
                <section
                  key={categoria}
                  id={aSlug(categoria)}
                  className="scroll-mt-24 pt-12"
                >
                  <h2 className="font-display text-xl font-semibold tracking-[0.1em] text-tinta uppercase">
                    {categoria}
                  </h2>

                  <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {items.map((p) => (
                      <FichaProducto
                        key={p.id}
                        producto={p}
                        whatsapp={CONSULTORIO.whatsapp}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </>
          )}

          {/*
            El cierre.

            Elegir entre trece productos sin saber de piel es justo lo que
            frena la compra, asi que la ultima puerta no es otro producto:
            es preguntar. Y al lado, el turno, porque para varias de estas
            cosas la respuesta honesta es verle la piel antes de venderle
            nada.
          */}
          <aside className="mt-14 rounded-suave border border-borde bg-papel px-6 py-10 text-center sm:px-10">
            <h2 className="font-display text-2xl font-normal text-tinta">
              ¿No sabés cuál te sirve?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-lg leading-snug text-tinta-suave">
              Escribime y te recomiendo según tu tipo de piel.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={linkConsultaProductos(CONSULTORIO.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-principal w-full sm:w-auto"
              >
                <IconoWhatsApp className="h-5 w-5" />
                Preguntarle a {CONSULTORIO.profesional.split(" ")[0]}
              </a>

              <Link
                href="/#reservar"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-borde px-7 font-display text-base font-medium text-tinta transition-colors hover:border-vino hover:text-vino sm:w-auto"
              >
                Reservar un turno
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer consultorio={CONSULTORIO} />
    </>
  );
}
