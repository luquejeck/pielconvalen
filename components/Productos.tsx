import type { ConfiguracionWeb } from "@/lib/consultorio";
import { productosDestacados, productosPublicados } from "@/lib/productos";
import CarruselProductos from "./CarruselProductos";
import FichaProducto from "./FichaProducto";
import TituloTienda from "./TituloTienda";

/**
 * El adelanto de productos en la portada.
 *
 * Va en carrusel y no en grilla. En la portada la pregunta es "¿esta
 * tambien vende productos?", y una fila que se corta a la derecha la
 * contesta mejor que una grilla cerrada: se ve que hay mas. Ademas la
 * portada esta armada para una sola cosa —sacar turno— y una grilla de
 * trece productos entre Tratamientos y las Preguntas le pone una segunda
 * decision encima a quien todavia no reservo.
 *
 * Los que salen son los marcados como destacados, uno por paso de la
 * rutina —limpiar, tratar, hidratar, proteger—, asi el adelanto muestra
 * de que se trata la tienda y no cuatro cremas parecidas.
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
      className="border-t border-borde bg-crema-oscuro py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <TituloTienda
          titulo="Productos"
          verTodo={{ href: "/productos", texto: `Ver los ${total} productos` }}
        />

        <div className="mt-8">
          <CarruselProductos etiqueta="Productos destacados">
            {destacados.map((p) => (
              <FichaProducto
                key={p.id}
                producto={p}
                whatsapp={CONSULTORIO.whatsapp}
              />
            ))}
          </CarruselProductos>
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-snug text-balance text-tinta-suave">
          Cosmética coreana elegida por {CONSULTORIO.profesional}. Se compra por
          WhatsApp y se retira en el consultorio.
        </p>
      </div>
    </section>
  );
}
