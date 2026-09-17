import Link from "next/link";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { productosDestacados, productosPublicados } from "@/lib/productos";
import FichaProducto from "./FichaProducto";
import { IconoFlecha } from "./iconos";

/**
 * El adelanto de productos en la portada: cuatro fichas y la puerta al
 * catalogo.
 *
 * POR QUE CUATRO Y NO LOS TRECE
 * La portada ya tiene ocho secciones y esta armada para una sola cosa:
 * sacar turno. Trece productos con foto entre Tratamientos y las
 * Preguntas empujaban el final de la pagina varias pantallas hacia abajo
 * y le ponian una segunda decision encima a quien todavia no reservo.
 *
 * Cuatro porque es una fila entera en escritorio y un cuadrado de dos
 * por dos en celular, sin huecos. Y estan elegidos uno por paso de la
 * rutina —limpiar, tratar, hidratar, proteger— asi el adelanto muestra
 * de que se trata la tienda y no cuatro cremas parecidas.
 *
 * POR QUE LA SECCION CAMBIA DE PALETA
 * Es gris y blanca, sin vino, como toda la tienda. Los productos son de
 * Medicube y Beauty of Joseon, no de Valen: vestirlos con el color de la
 * casa los volvia parte de la marca, que es justo lo que no son.
 */
export default function Productos({
  consultorio: CONSULTORIO,
}: {
  consultorio: ConfiguracionWeb;
}) {
  const destacados = productosDestacados();
  const total = productosPublicados().length;

  // Sin productos cargados la seccion no existe, en vez de quedar vacia.
  if (destacados.length === 0) return null;

  return (
    <section
      id="productos"
      className="border-t border-borde bg-tienda-fondo py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        {/*
          No usa TituloSeccion: ese componente escribe el titulo en tinta,
          que esta teñida de vino, y aca la paleta no tiene vino. La
          estructura es la misma —titulo grande, bajada corta y angosta—
          con los colores de la tienda.
        */}
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl text-tienda-tinta sm:text-5xl">Productos</h2>
          <p className="mt-2 text-xl leading-snug text-tienda-suave">
            Cosmética coreana elegida por Valen. Se compra por WhatsApp y se
            retira en el consultorio.
          </p>
        </header>

        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {destacados.map((p) => (
            <FichaProducto
              key={p.id}
              producto={p}
              whatsapp={CONSULTORIO.whatsapp}
            />
          ))}
        </ul>

        {/*
          El link dice cuantos hay. "Ver todos" no le dice a nadie si vale
          la pena el clic: puede haber cuatro o cuarenta. El numero sale
          de la lista, asi que no se desactualiza cuando Valen cargue mas.
        */}
        <div className="mt-8 text-center">
          <Link
            href="/productos"
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-tienda-tinta px-7 font-display text-base font-medium text-white transition-opacity hover:opacity-85"
          >
            Ver los {total} productos
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
