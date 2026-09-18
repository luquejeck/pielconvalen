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
  CATEGORIAS,
  marcas,
  marcasConFoto,
  porCategoria,
  productosPublicados,
} from "@/lib/productos";
import { linkConsultaProductos } from "@/lib/whatsapp";

type Busqueda = {
  searchParams: Promise<{ marca?: string; categoria?: string }>;
};

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
  const { marca: marcaPedida, categoria: categoriaPedida } =
    await searchParams;

  /* Los dos filtros se validan contra lo que existe: un ?marca= o
     ?categoria= con cualquier cosa tiene que caer en el catalogo entero
     y no en una pagina vacia. */
  const marcaElegida = marcasConFoto().find((m) => m.slug === marcaPedida);
  const categoriaElegida = CATEGORIAS.find(
    (c) => aSlug(c) === categoriaPedida
  );

  const grupos = porCategoria();

  /*
    EL FILTRO VIVE EN LA DIRECCION Y NO EN EL ESTADO DEL NAVEGADOR.

    Asi funciona sin javascript, el boton de atras hace lo que se espera,
    y el link se puede pasar por WhatsApp: "mirá los protectores" es
    /productos?categoria=protector-solar. Con estado en el cliente, ese
    link no existe.

    Los dos filtros se combinan: entrar por la marca desde el mosaico y
    despues acotar por categoria tiene que seguir funcionando.
  */
  const filtrados = productosPublicados().filter(
    (p) =>
      (!marcaElegida || aSlug(p.marca) === marcaElegida.slug) &&
      (!categoriaElegida || p.categoria === categoriaElegida)
  );

  const hayFiltro = Boolean(marcaElegida || categoriaElegida);

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

          {/*
            LOS FILTROS, EN PASTILLAS.

            Son filtros de verdad y no anclas. Con el ancla, tocar
            "Cremas" bajaba hasta las cremas pero dejaba las otras diez
            fichas en el medio: la clienta que solo quiere ver cremas
            tenia que ignorarlas sola. Ahora las esconde, y "Todos"
            vuelve.

            Cada pastilla dice cuantos hay. Sin el numero, tocar un filtro
            es una apuesta: puede traer uno o doce.

            La fila se desliza al costado en celular en vez de envolverse
            en tres renglones, asi los productos quedan a la vista sin
            scrollear.
          */}
          <nav aria-label="Filtrar productos" className="mt-7">
            <ul className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5">
              <li className="shrink-0">
                <Pastilla
                  href={marcaElegida ? `/productos?marca=${marcaElegida.slug}` : "/productos"}
                  activa={!categoriaElegida}
                  texto="Todos"
                  cuantos={
                    marcaElegida
                      ? productosPublicados().filter(
                          (p) => aSlug(p.marca) === marcaElegida.slug
                        ).length
                      : productosPublicados().length
                  }
                />
              </li>

              {grupos.map(({ categoria }) => {
                /* El conteo respeta la marca elegida: dentro de Beauty of
                   Joseon, "Cremas" tiene que decir 1 y no 4. Las
                   categorias que quedan en cero no se dibujan. */
                const cuantos = productosPublicados().filter(
                  (p) =>
                    p.categoria === categoria &&
                    (!marcaElegida || aSlug(p.marca) === marcaElegida.slug)
                ).length;
                if (cuantos === 0) return null;

                const params = new URLSearchParams();
                if (marcaElegida) params.set("marca", marcaElegida.slug);
                params.set("categoria", aSlug(categoria));

                return (
                  <li key={categoria} className="shrink-0">
                    <Pastilla
                      href={`/productos?${params}`}
                      activa={categoriaElegida === categoria}
                      texto={categoria}
                      cuantos={cuantos}
                    />
                  </li>
                );
              })}
            </ul>
          </nav>

          {marcaElegida && (
            <Link
              href={
                categoriaElegida
                  ? `/productos?categoria=${aSlug(categoriaElegida)}`
                  : "/productos"
              }
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-borde bg-papel px-4 text-base text-tinta transition-colors hover:border-vino hover:text-vino"
            >
              <IconoFlecha className="h-4 w-4 rotate-180" />
              Ver las {marcas().length} marcas
            </Link>
          )}

          {/*
            Sin filtro se recorre por categorias, con su titulo: es el
            orden de la rutina y sirve para mirar. Con filtro va una
            grilla sola, porque el titulo repetiria lo que ya dice la
            pastilla encendida.
          */}
          {hayFiltro ? (
            filtrados.length > 0 ? (
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {filtrados.map((p) => (
                  <FichaProducto key={p.id} producto={p} />
                ))}
              </ul>
            ) : (
              /* No deberia pasar —las pastillas en cero no se dibujan—
                 pero una direccion escrita a mano puede llegar aca. */
              <p className="mt-8 rounded-chico border border-borde bg-papel px-5 py-6 text-center text-lg text-tinta-suave">
                No hay productos con esa combinación.{" "}
                <Link href="/productos" className="text-vino underline">
                  Ver todos
                </Link>
              </p>
            )
          ) : (
            grupos.map(({ categoria, items }) => (
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
                    <FichaProducto key={p.id} producto={p} />
                  ))}
                </ul>
              </section>
            ))
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

/**
 * Una pastilla de filtro.
 *
 * La encendida se pinta en vino y lleva `aria-current`: el color solo no
 * alcanza para quien no distingue el vino del blanco, y sin el atributo
 * un lector de pantalla lee seis links iguales sin decir en cual esta.
 *
 * Sigue siendo un link y no un boton aunque cambie lo que se ve: lo que
 * hace es ir a otra direccion, y eso tiene que poder abrirse en otra
 * pestaña y guardarse en favoritos.
 */
function Pastilla({
  href,
  activa,
  texto,
  cuantos,
}: {
  href: string;
  activa: boolean;
  texto: string;
  cuantos: number;
}) {
  return (
    <Link
      href={href}
      aria-current={activa ? "true" : undefined}
      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-base whitespace-nowrap transition-colors ${
        activa
          ? "border-vino bg-vino text-white"
          : "border-borde bg-papel text-tinta hover:border-vino hover:text-vino"
      }`}
    >
      {texto}
      <span className={activa ? "text-white/70" : "text-tinta-suave"}>
        <span className="tabular-nums">{cuantos}</span>
      </span>
    </Link>
  );
}
