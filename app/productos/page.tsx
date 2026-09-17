import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import FichaProducto from "@/components/FichaProducto";
import { IconoFlecha, IconoWhatsApp } from "@/components/iconos";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import { marcas, porCategoria, productosPublicados } from "@/lib/productos";
import { linkConsultaProductos } from "@/lib/whatsapp";

/** Para que el ancla de cada categoria sea una direccion y no un numero. */
const anclaDe = (categoria: string) =>
  categoria
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-");

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
 * LA PAGINA ES OSCURA, como la banda de la portada de la que se llega.
 * Con la portada en crema, el salto de una a otra hacia sentir que eran
 * dos sitios distintos; y es ademas lo que hace que las fotos se vean,
 * porque estan sacadas contra una mesa oscura y funden a --color-tinta,
 * que es el fondo de esta misma pagina.
 *
 * ORDENADOS POR RUTINA, no por precio ni alfabeticamente: primero se
 * limpia, despues se trata, despues se hidrata y al final se protege.
 * Quien esta armando su primera rutina puede leer la pagina de arriba a
 * abajo y lo que le queda es el orden en que se aplica.
 */
export default async function Productos() {
  const CONSULTORIO = await obtenerConfiguracion();
  const grupos = porCategoria();
  const total = productosPublicados().length;

  return (
    <>
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-tinta">
        <div className="contenedor py-12 md:py-16 xl:py-20">
          {/*
            La miga de pan es un link solo, no la cadena entera: la web
            tiene dos niveles y "Inicio › Productos" seria ponerle
            nombre de sistema a algo que se resuelve con una flecha.
          */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-base text-crema-tenue transition-colors hover:text-crema"
          >
            <IconoFlecha className="h-4 w-4 rotate-180" />
            Volver al inicio
          </Link>

          <header className="mt-6 max-w-3xl">
            <h1 className="text-4xl text-crema sm:text-5xl">
              Productos
            </h1>
            <p className="mt-3 text-xl leading-snug text-crema-tenue">
              Cosmética coreana que Valen usa y recomienda. La venta es por
              WhatsApp: tocá el producto y se abre el chat con el mensaje
              escrito. Se retira en el consultorio.
            </p>
          </header>

          {/*
            Indice de categorias.

            Son anclas y no filtros: el filtro esconde cosas y obliga a
            volver atras para ver el resto, y con trece productos no hay
            nada que esconder. Asi se ve de entrada todo lo que hay —que
            es la pregunta real de quien entra— y se puede saltar.
          */}
          <nav aria-label="Categorías" className="mt-7">
            <ul className="flex flex-wrap gap-2">
              {grupos.map(({ categoria, items }) => (
                <li key={categoria}>
                  <a
                    href={`#${anclaDe(categoria)}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-crema/25 px-4 text-base text-crema transition-colors hover:bg-crema/10"
                  >
                    {categoria}
                    <span className="text-crema-tenue tabular-nums">
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
              id={anclaDe(categoria)}
              className="scroll-mt-24 pt-12"
            >
              <h2 className="font-display text-2xl font-normal text-crema">
                {categoria}
              </h2>

              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-3">
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

          {/*
            El cierre.

            Elegir entre trece productos sin saber de piel es justo lo que
            frena la compra, asi que la ultima puerta no es otro producto:
            es preguntar. Y al lado, el turno, porque para varias de estas
            cosas la respuesta honesta es verle la piel antes de venderle
            nada.
          */}
          <aside className="mt-14 rounded-suave bg-tinta-clara px-6 py-8 text-center sm:px-10">
            <h2 className="font-display text-2xl font-normal text-crema">
              ¿No sabés cuál te sirve?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-lg leading-snug text-crema-tenue">
              Contame cómo tenés la piel y te digo cuál de los {total} te
              conviene. Sin compromiso.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href={linkConsultaProductos(CONSULTORIO.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-crema px-7 font-display text-lg font-medium text-vino transition-colors hover:bg-white sm:w-auto"
              >
                <IconoWhatsApp className="h-5 w-5" />
                Preguntarle a Valen
              </a>

              <Link
                href="/#reservar"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-crema/35 px-7 font-display text-lg font-medium text-crema transition-colors hover:bg-crema/10 sm:w-auto"
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
