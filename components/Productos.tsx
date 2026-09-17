import Link from "next/link";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { productosDestacados, productosPublicados } from "@/lib/productos";
import FichaProducto from "./FichaProducto";
import { IconoFlecha } from "./iconos";

/**
 * El adelanto de productos en la portada: tres fichas y la puerta al
 * catalogo.
 *
 * POR QUE TRES Y NO LOS DIECISEIS
 * La portada ya tiene ocho secciones y esta armada para una sola cosa:
 * sacar turno. Dieciseis productos con foto entre Tratamientos y las
 * Preguntas empujaban el final de la pagina cuatro pantallas de celular
 * hacia abajo y le ponian una segunda decision encima a quien todavia no
 * habia reservado.
 *
 * Los tres estan elegidos para que se entienda de que se trata sin
 * leerlos: uno de cada cosa que la clienta ya sabe que necesita —un
 * serum, una crema y un protector— y no tres cremas parecidas.
 *
 * POR QUE LA SECCION ES OSCURA
 * Es la unica de la portada que lo es, y marca el cambio de tema: hasta
 * aca se habla de lo que Valen hace, de aca en adelante de lo que vende.
 * Ademas es lo que hace que las fotos funcionen: vienen sacadas contra
 * una mesa oscura y sobre el crema quedaban como parches negros.
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
      className="border-t border-borde bg-tinta py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        {/*
          No usa TituloSeccion: ese componente escribe el titulo en tinta
          sobre crema, que aca seria tinta sobre tinta. La estructura es
          la misma —titulo grande, bajada corta y angosta— con los
          colores dados vuelta.
        */}
        <header className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl text-crema sm:text-5xl">
            Productos
          </h2>
          <p className="mt-2 text-xl leading-snug text-crema-tenue">
            Cosmética coreana elegida por Valen. Se compra por WhatsApp y se
            retira en el consultorio.
          </p>
        </header>

        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-x-4 gap-y-9 lg:grid-cols-3">
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
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-crema/35 px-7 font-display text-lg font-medium text-crema transition-colors hover:bg-crema/10"
          >
            Ver los {total} productos
            <IconoFlecha className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
