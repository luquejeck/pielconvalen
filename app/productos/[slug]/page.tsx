import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import BotonVolver from "@/components/BotonVolver";
import Carrusel from "@/components/Carrusel";
import ControlCarrito from "@/components/ControlCarrito";
import FichaProducto from "@/components/FichaProducto";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import TarjetaCombo from "@/components/TarjetaCombo";
import { IconoBillete, IconoPin, IconoWhatsApp } from "@/components/iconos";
import { obtenerCombos } from "@/lib/catalogo-combos";
import { obtenerProductos } from "@/lib/catalogo-productos";
import { PASO, resolverCombos } from "@/lib/combos";
import { barrioDe, PAGO_PRODUCTOS, SITIO_URL } from "@/lib/config";
import { obtenerConfiguracion } from "@/lib/consultorio";
import {
  descuentoDe,
  fotoDe,
  hayStock,
  precioDe,
  productosPublicados,
  slugDe,
  ultimaUnidad,
  type Producto,
} from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import { linkProducto } from "@/lib/whatsapp";

type Ruta = { params: Promise<{ slug: string }> };

/** El producto de la direccion, entre los publicados. */
async function buscar(slug: string) {
  const productos = await obtenerProductos();
  const publicados = productosPublicados(productos);
  return { productos, publicados, p: publicados.find((x) => slugDe(x) === slug) };
}

/* Las fotos del repo tienen ruta relativa; Google y WhatsApp necesitan
   la direccion entera. */
const fotoAbsoluta = (p: Producto) => {
  const f = fotoDe(p);
  return f.startsWith("/") ? `${SITIO_URL}${f}` : f;
};

export async function generateMetadata({ params }: Ruta): Promise<Metadata> {
  const { slug } = await params;
  const [{ p }, CONSULTORIO] = await Promise.all([buscar(slug), obtenerConfiguracion()]);
  if (!p) return { title: `Productos | ${CONSULTORIO.nombre}` };

  const titulo = `${p.marca} ${p.nombre}${p.medida ? ` ${p.medida}` : ""}`;
  const descripcion =
    p.descripcion ||
    `${titulo}. ${p.beneficios.join(", ")}. Se pide por WhatsApp y se retira en ${CONSULTORIO.direccion}.`;

  return {
    title: `${titulo} | ${CONSULTORIO.nombre}`,
    description: descripcion,
    alternates: { canonical: `${SITIO_URL}/productos/${slug}` },
    /* Es la vista previa que aparece cuando alguien pasa el link por
       WhatsApp: con la foto del producto y no la de la portada. */
    openGraph: {
      title: titulo,
      description: descripcion,
      images: [fotoAbsoluta(p)],
      locale: "es_AR",
      type: "website",
    },
  };
}

/**
 * La ficha de un producto: lo que se abre al tocar una tarjeta.
 *
 * EXISTE PORQUE LA DESCRIPCION NO SE VEIA EN NINGUN LADO. Valen carga
 * para que sirve cada producto, y la tarjeta del listado —161 px en un
 * telefono— solo tiene lugar para el nombre y dos o tres palabras. Una
 * clienta de sesenta no se lleva un "Revive Serum" sin saber que hace.
 *
 * ES UNA PAGINA Y NO UNA VENTANA ENCIMA DEL CATALOGO, como en Mercado
 * Libre, por tres cosas:
 *   - El boton de atras del telefono hace lo que se espera. Con una
 *     ventana encima, "atras" saca a la clienta de la web entera.
 *   - Tiene direccion propia: "mirá este" se pasa por WhatsApp, y la
 *     vista previa del mensaje trae la foto del producto.
 *   - Google la encuentra cuando alguien busca la marca y el nombre.
 *
 * EL ORDEN ES EL DE LA TARJETA, en grande: foto, que es, cuanto sale
 * —con como se paga y como llega, en verde— y el boton. Debajo, lo que
 * antes no tenia lugar: para que sirve, y dos filas para seguir
 * comprando —los combos que lo traen y otros productos parecidos—.
 *
 * Si la direccion no corresponde a ningun producto publicado —Valen le
 * cambio el nombre o lo despublico— manda al catalogo en vez de mostrar
 * un error: quien tocaba un link viejo queria ver productos.
 */
export default async function PaginaProducto({ params }: Ruta) {
  const { slug } = await params;
  const [{ productos, publicados, p }, CONSULTORIO, definiciones] = await Promise.all([
    buscar(slug),
    obtenerConfiguracion(),
    obtenerCombos(),
  ]);
  if (!p) redirect("/productos");

  const descuento = descuentoDe(p);
  const disponible = hayStock(p);

  /* Los combos que lo traen: "llevalo en combo y ahorrás", que es la
     venta mas grande que se le puede ofrecer a quien ya eligio uno. */
  const combos = resolverCombos(productos, definiciones).filter((c) =>
    c.productos.some((x) => x.id === p.id)
  );

  /* Primero los del mismo paso de la rutina —con que compararlo— y
     despues los que comparten algun beneficio. */
  const otros = [
    ...publicados.filter((x) => x.id !== p.id && x.categoria === p.categoria),
    ...publicados.filter(
      (x) =>
        x.id !== p.id &&
        x.categoria !== p.categoria &&
        x.beneficios.some((b) => p.beneficios.includes(b))
    ),
  ].slice(0, 8);

  const consulta = linkProducto(
    { marca: p.marca, nombre: p.nombre, medida: p.medida, precio: p.precio },
    CONSULTORIO.whatsapp
  );

  /** Ficha de producto para Google. */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.marca} ${p.nombre}`,
    brand: { "@type": "Brand", name: p.marca },
    image: fotoAbsoluta(p),
    ...(p.descripcion ? { description: p.descripcion } : {}),
    ...(p.precio > 0
      ? {
          offers: {
            "@type": "Offer",
            price: p.precio,
            priceCurrency: "ARS",
            availability: disponible
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${SITIO_URL}/productos/${slug}`,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header consultorio={CONSULTORIO} enPortada={false} />

      <main className="bg-crema">
        <div className="contenedor py-6 md:py-12">
          <BotonVolver href="/productos" />

          <article className="mt-3 grid gap-6 md:grid-cols-2 md:items-start md:gap-10 lg:gap-14">
            {/* En pantalla grande la foto acompaña mientras se lee la
                columna de la derecha, que es la mas larga. */}
            <div className="relative overflow-hidden rounded-suave border border-borde bg-papel md:sticky md:top-24">
              <Image
                src={fotoDe(p)}
                alt={`${p.nombre}, de ${p.marca}`}
                width={900}
                height={900}
                priority
                sizes="(min-width: 1280px) 36rem, (min-width: 768px) 50vw, 100vw"
                className={`aspect-square w-full object-cover ${disponible ? "" : "opacity-55 grayscale"}`}
              />
              {!disponible && (
                <span className="absolute top-0 left-0 bg-tinta px-3 py-1.5 font-display text-base font-semibold text-white">
                  Sin stock
                </span>
              )}
            </div>

            <div>
              <p className="font-display text-sm font-semibold tracking-[0.12em] text-vino uppercase">
                {p.marca}
              </p>
              <h1 className="mt-2 text-3xl leading-tight text-tinta sm:text-4xl">{p.nombre}</h1>
              {p.medida && <p className="mt-2 text-lg text-tinta-suave">{p.medida}</p>}

              {/* El precio como en la tarjeta: la rebaja arriba, el
                  numero solo y grande. */}
              <div className="mt-5">
                {p.precioAnterior && descuento !== null && (
                  <p className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-positivo px-2 py-1 font-display text-sm leading-none font-bold text-white tabular-nums">
                      {descuento}% OFF
                    </span>
                    <span className="text-base text-tinta-suave line-through tabular-nums">
                      {formatearPrecio(p.precioAnterior)}
                    </span>
                  </p>
                )}
                <p className="font-display text-4xl font-semibold text-tinta tabular-nums">
                  {precioDe(p)}
                </p>
                {disponible && ultimaUnidad(p) && (
                  <p className="mt-1 text-base font-semibold text-vino">¡Último disponible!</p>
                )}

                {/*
                  PAGO Y ENTREGA, EN VERDE, PEGADOS AL PRECIO.

                  Es el lugar y el color del "Envio gratis" y las cuotas
                  de Mercado Libre: lo que la clienta quiere saber justo
                  despues del numero es como lo paga y como le llega. Dos
                  renglones cortos, sin explicacion alrededor: el como
                  sigue lo cuenta el pedido.
                */}
                <ul className="mt-3 space-y-1.5 text-base leading-snug font-semibold text-positivo">
                  <li className="flex items-start gap-2">
                    <IconoBillete className="mt-px h-5 w-5 shrink-0" />
                    Pagás en {PAGO_PRODUCTOS}
                  </li>
                  <li className="flex items-start gap-2">
                    <IconoPin className="mt-px h-5 w-5 shrink-0" />
                    Retiro en {barrioDe(CONSULTORIO.direccion)} o entrega a coordinar
                  </li>
                </ul>
              </div>

              {disponible ? (
                <ControlCarrito
                  id={p.id}
                  nombre={`${p.marca} ${p.nombre}`}
                  texto="Agregar al pedido"
                  grande
                />
              ) : (
                /* Sin stock no se agrega, pero se puede encargar: el
                   boton lleva la consulta con el producto ya escrito. */
                <a
                  href={consulta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="boton-principal mt-4 w-full"
                >
                  <IconoWhatsApp className="h-5 w-5" />
                  Consultar si lo puede conseguir
                </a>
              )}


              {(p.descripcion || p.beneficios.length > 0) && (
                <section aria-labelledby="para-que-sirve" className="mt-8 border-t border-borde pt-6">
                  <h2
                    id="para-que-sirve"
                    className="font-display text-lg font-semibold tracking-[0.1em] text-tinta uppercase"
                  >
                    Para qué sirve
                  </h2>
                  {p.descripcion && (
                    <p className="mt-3 text-lg leading-relaxed text-tinta">{p.descripcion}</p>
                  )}
                  {p.beneficios.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {p.beneficios.map((b) => (
                        <li
                          key={b}
                          className="rounded-full bg-vino-suave px-3.5 py-1.5 text-base text-vino"
                        >
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {PASO[p.categoria] && (
                    <p className="mt-4 text-base text-tinta-suave">
                      En la rutina es el paso de{" "}
                      <span className="font-semibold text-tinta">{PASO[p.categoria].toLowerCase()}</span>.
                    </p>
                  )}
                </section>
              )}

              <a
                href={consulta}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-base font-semibold text-vino underline decoration-vino/30 underline-offset-4 hover:decoration-vino"
              >
                <IconoWhatsApp className="h-5 w-5" />
                ¿Tenés dudas? Preguntale a Valen
              </a>
            </div>
          </article>

          {combos.length > 0 && (
            <section aria-labelledby="en-combo" className="mt-14">
              <h2
                id="en-combo"
                className="font-display text-xl font-semibold tracking-[0.1em] text-tinta uppercase"
              >
                Llevalo en combo
              </h2>
              <div className="mt-5">
                <Carrusel etiqueta="Combos con este producto" tipo="combos">
                  {combos.map((c) => (
                    <TarjetaCombo key={c.id} combo={c} />
                  ))}
                </Carrusel>
              </div>
            </section>
          )}

          {otros.length > 0 && (
            <section aria-labelledby="otros" className="mt-14">
              <h2
                id="otros"
                className="font-display text-xl font-semibold tracking-[0.1em] text-tinta uppercase"
              >
                También te puede servir
              </h2>
              <div className="mt-5">
                <Carrusel etiqueta="Otros productos">
                  {otros.map((x) => (
                    <FichaProducto key={x.id} producto={x} />
                  ))}
                </Carrusel>
              </div>
            </section>
          )}

          <p className="mt-12 text-center">
            <Link
              href="/productos"
              className="boton-secundario"
            >
              Ver todos los productos
            </Link>
          </p>
        </div>
      </main>

      <Footer consultorio={CONSULTORIO} />
    </>
  );
}
