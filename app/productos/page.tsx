import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ComboRecomendado from "@/components/ComboRecomendado";
import FichaProducto from "@/components/FichaProducto";
import { IconoFlecha, IconoWhatsApp } from "@/components/iconos";
import { obtenerProductos } from "@/lib/catalogo-productos";
import { resolverCombos } from "@/lib/combos";
import { SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import {
  aSlug,
  CATEGORIAS,
  marcas,
  marcasConFoto,
  NECESIDADES,
  porCategoria,
  productosPublicados,
  sirvePara,
} from "@/lib/productos";
import { linkConsultaProductos } from "@/lib/whatsapp";

type Busqueda = {
  searchParams: Promise<{
    marca?: string;
    categoria?: string;
    necesidad?: string;
    orden?: string;
  }>;
};

/*
  LOS ORDENES.

  "Rutina" es el de siempre: por paso, en el orden en que se aplican.
  Los otros dos son para quien ya sabe que quiere y compara precios.
*/
type Orden = "rutina" | "precio-menor" | "precio-mayor";
const ORDENES: { slug: Orden; texto: string }[] = [
  { slug: "rutina", texto: "Orden de rutina" },
  { slug: "precio-menor", texto: "Menor precio" },
  { slug: "precio-mayor", texto: "Mayor precio" },
];

export async function generateMetadata(): Promise<Metadata> {
  const CONSULTORIO = await obtenerConfiguracion();
  const productos = await obtenerProductos();
  const cuantos = productosPublicados(productos).length;

  return {
    title: `Productos | ${CONSULTORIO.nombre}`,
    description: `${cuantos} productos de cosmética coreana elegidos por ${CONSULTORIO.profesional}: ${marcas(productos).join(", ")}. Se compran por WhatsApp y se retiran en ${CONSULTORIO.direccion}.`,
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
  /* El catalogo sale de la base; lib/productos.ts queda de respaldo si
     no contesta. Se pide una sola vez y viaja a todas las cuentas de
     abajo: pedirlo en cada una serian ocho viajes por visita. */
  const productos = await obtenerProductos();
  const {
    marca: marcaPedida,
    categoria: categoriaPedida,
    necesidad: necesidadPedida,
    orden: ordenPedido,
  } = await searchParams;

  /* Los filtros se validan contra lo que existe: una direccion con
     cualquier cosa tiene que caer en el catalogo entero y no en una
     pagina vacia. */
  const marcaElegida = marcasConFoto(productos).find((m) => m.slug === marcaPedida);
  const categoriaElegida = CATEGORIAS.find((c) => aSlug(c) === categoriaPedida);
  const necesidadElegida = NECESIDADES.find((n) => n.slug === necesidadPedida);
  const orden: Orden = ORDENES.some((o) => o.slug === ordenPedido) ? (ordenPedido as Orden) : "rutina";

  const grupos = porCategoria(productos);

  /*
    EL FILTRO VIVE EN LA DIRECCION Y NO EN EL ESTADO DEL NAVEGADOR.

    Asi funciona sin javascript, el boton de atras hace lo que se espera,
    y el link se puede pasar por WhatsApp: "mirá lo que tengo para los
    poros" es /productos?necesidad=poros. Con estado en el cliente, ese
    link no existe.

    Los cuatro se combinan: marca, categoria, necesidad y orden.
  */
  const publicados = productosPublicados(productos);
  const cumple = (p: (typeof publicados)[number], ignorar?: "marca" | "categoria" | "necesidad") =>
    (ignorar === "marca" || !marcaElegida || aSlug(p.marca) === marcaElegida.slug) &&
    (ignorar === "categoria" || !categoriaElegida || p.categoria === categoriaElegida) &&
    (ignorar === "necesidad" || !necesidadElegida || sirvePara(p, necesidadElegida.slug));

  const filtrados = publicados.filter((p) => cumple(p));
  if (orden === "precio-menor") filtrados.sort((a, b) => a.precio - b.precio);
  if (orden === "precio-mayor") filtrados.sort((a, b) => b.precio - a.precio);

  const hayFiltro = Boolean(marcaElegida || categoriaElegida || necesidadElegida);
  /* Ordenar por precio tambien aplana la grilla: agrupar por paso de la
     rutina y ordenar por precio se contradicen. */
  const enGrilla = hayFiltro || orden !== "rutina";

  /* Los combos que se pueden armar hoy con lo publicado. Si falta
     alguno de sus productos, no aparece. */
  const combos = resolverCombos(productos);

  /*
    La direccion con un cambio, conservando el resto.

    Cada pastilla tiene que llevar a "lo mismo que hay ahora, mas esto":
    tocar "Sérums" estando en Beauty of Joseon tiene que dar los sérums
    de Beauty of Joseon, no todos los sérums. `null` saca el filtro.
  */
  const actual = {
    marca: marcaElegida?.slug,
    categoria: categoriaElegida ? aSlug(categoriaElegida) : undefined,
    necesidad: necesidadElegida?.slug,
    orden: orden === "rutina" ? undefined : orden,
  };
  const aca = (cambios: Partial<Record<keyof typeof actual, string | null>>) => {
    const p = new URLSearchParams();
    for (const [clave, valor] of Object.entries({ ...actual, ...cambios })) {
      if (valor) p.set(clave, valor);
    }
    const q = p.toString();
    return q ? `/productos?${q}` : "/productos";
  };

  /* Cuantos quedarian con una pastilla prendida: la que da cero no se
     dibuja, para no ofrecer un filtro que no trae nada. */
  const cuantosCon = (campo: "marca" | "categoria" | "necesidad", prueba: (p: (typeof publicados)[number]) => boolean) =>
    publicados.filter((p) => cumple(p, campo) && prueba(p)).length;

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
          </header>

          {/*
            TRES FILAS DE FILTROS, LA PRIMERA A LA VISTA.

            La categoria va arriba y siempre visible: es el paso de la
            rutina, lo primero que se busca. Debajo, la necesidad de piel,
            que es como busca quien no conoce las marcas.

            Marca y orden van plegados en "Mas filtros": los usa menos
            gente, y abiertos los cuatro llenaban la pantalla del
            telefono antes del primer producto. Es un <details>, asi que
            se abre sin javascript igual que el resto de la pagina.

            Cada fila se desliza al costado en el telefono en vez de
            envolverse en tres renglones.
          */}
          <nav aria-label="Filtrar productos" className="mt-7 space-y-3">
            <ul className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5">
              <li className="shrink-0">
                <Pastilla
                  href={aca({ categoria: null })}
                  activa={!categoriaElegida}
                  texto="Todos"
                  cuantos={cuantosCon("categoria", () => true)}
                />
              </li>
              {grupos.map(({ categoria }) => {
                const cuantos = cuantosCon("categoria", (p) => p.categoria === categoria);
                if (cuantos === 0) return null;
                return (
                  <li key={categoria} className="shrink-0">
                    <Pastilla
                      href={aca({ categoria: aSlug(categoria) })}
                      activa={categoriaElegida === categoria}
                      texto={categoria}
                      cuantos={cuantos}
                    />
                  </li>
                );
              })}
            </ul>

            <div>
              <p className="mb-1.5 text-sm text-tinta-suave">¿Qué buscás para tu piel?</p>
              <ul className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5">
                {NECESIDADES.map((n) => {
                  const cuantos = cuantosCon("necesidad", (p) => sirvePara(p, n.slug));
                  if (cuantos === 0) return null;
                  const prendida = necesidadElegida?.slug === n.slug;
                  return (
                    <li key={n.slug} className="shrink-0">
                      <Pastilla
                        href={aca({ necesidad: prendida ? null : n.slug })}
                        activa={prendida}
                        texto={n.texto}
                        cuantos={cuantos}
                      />
                    </li>
                  );
                })}
              </ul>
            </div>

            <details className="group" open={Boolean(marcaElegida) || orden !== "rutina"}>
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 text-base text-tinta-suave transition-colors hover:text-vino [&::-webkit-details-marker]:hidden">
                <IconoFlecha className="h-4 w-4 rotate-90 transition-transform group-open:-rotate-90" />
                Más filtros: marca y orden
              </summary>

              <div className="mt-2 space-y-3">
                <ul className="sin-barra -mx-5 flex gap-2 overflow-x-auto px-5">
                  {marcasConFoto(productos).map((m) => {
                    const cuantos = cuantosCon("marca", (p) => aSlug(p.marca) === m.slug);
                    if (cuantos === 0) return null;
                    const prendida = marcaElegida?.slug === m.slug;
                    return (
                      <li key={m.slug} className="shrink-0">
                        <Pastilla
                          href={aca({ marca: prendida ? null : m.slug })}
                          activa={prendida}
                          texto={m.nombre}
                          cuantos={cuantos}
                        />
                      </li>
                    );
                  })}
                </ul>

                <ul className="flex flex-wrap gap-2">
                  {ORDENES.map((o) => (
                    <li key={o.slug}>
                      <Pastilla
                        href={aca({ orden: o.slug === "rutina" ? null : o.slug })}
                        activa={orden === o.slug}
                        texto={o.texto}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </nav>

          {/*
            Lo que esta prendido, y como salir.

            Con tres dimensiones combinables se pierde de vista que filtro
            esta armando la lista: "¿por que hay solo dos?". Aca se lee de
            un vistazo y se saca todo con un toque.
          */}
          {hayFiltro && (
            <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-tinta-suave">
              <span>
                {filtrados.length} {filtrados.length === 1 ? "producto" : "productos"}
              </span>
              <Link href={aca({ marca: null, categoria: null, necesidad: null })} className="text-vino underline underline-offset-2">
                Sacar filtros
              </Link>
            </p>
          )}

          {/*
            EL COMBO, ARRIBA DE TODO, sin filtros ni orden.

            Es la recomendacion para quien entra sin saber por donde
            empezar. Con un filtro puesto ya sabe que busca, y el combo
            estaria fuera de contexto: si esta mirando protectores, una
            rutina antiedad no le habla.
          */}
          {!enGrilla && combos.map((c) => <ComboRecomendado key={c.id} combo={c} className="mt-8" />)}

          {/*
            Sin filtros se recorre por categoria, con su titulo: es el
            orden de la rutina y sirve para mirar. Con filtros o con otro
            orden va una grilla sola.
          */}
          {enGrilla ? (
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
              <section key={categoria} id={aSlug(categoria)} className="scroll-mt-24 pt-12">
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
  /* Las de orden no llevan numero: no achican la lista, la reordenan. */
  cuantos?: number;
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
      {cuantos !== undefined && (
        <span className={activa ? "text-white/70" : "text-tinta-suave"}>
          <span className="tabular-nums">{cuantos}</span>
        </span>
      )}
    </Link>
  );
}
