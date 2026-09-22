import { obtenerCombos } from "@/lib/catalogo-combos";
import { resolverCombos } from "@/lib/combos";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { productosDestacados, type Producto } from "@/lib/productos";
import CarruselProductos from "./CarruselProductos";
import ComboRecomendado from "./ComboRecomendado";
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
export default async function Productos({
  consultorio: CONSULTORIO,
  productos,
}: {
  consultorio: ConfiguracionWeb;
  /* La trae la portada, que es la que habla con la base. Este
     componente no la pide solo para no hacer dos viajes por visita. */
  productos: Producto[];
}) {
  const destacados = productosDestacados(productos);
  /* Los combos los arma Valen en el panel. El viaje a la base lo hace
     este componente y no la portada: es el unico que los usa aca. */
  const combos = resolverCombos(productos, await obtenerCombos());

  // Sin productos cargados la seccion no existe, en vez de quedar vacia.
  if (destacados.length === 0) return null;

  return (
    <section
      id="productos"
      className="border-t border-borde bg-crema-oscuro seccion"
    >
      <div className="contenedor">
        <TituloTienda
          titulo="Productos"
          verTodo={{ href: "/productos", texto: "Ver todos" }}
        />

        <div className="mt-8">
          <CarruselProductos etiqueta="Productos destacados">
            {destacados.map((p) => (
              <FichaProducto key={p.id} producto={p} />
            ))}
          </CarruselProductos>
        </div>

        {/*
          EL COMBO, DEBAJO DEL CARRUSEL.

          Es donde lo ponen Mercado Libre y Amazon: primero se ve que se
          vende, y despues "llevate el conjunto" cierra la compra. Arriba
          empujaba el adelanto de la tienda hacia abajo, y la portada no
          puede tapar lo que muestra con una oferta.

          Si falta alguno de sus productos, no aparece.
        */}
        {combos.map((c) => (
          <ComboRecomendado key={c.id} combo={c} className="mt-10" />
        ))}
      </div>
    </section>
  );
}
