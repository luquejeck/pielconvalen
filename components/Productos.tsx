import Link from "next/link";
import { obtenerCombos } from "@/lib/catalogo-combos";
import { resolverCombos } from "@/lib/combos";
import type { ConfiguracionWeb } from "@/lib/consultorio";
import { productosDestacados, productosEnOferta, type Producto } from "@/lib/productos";
import Carrusel from "./Carrusel";
import FichaProducto from "./FichaProducto";
import TarjetaCombo from "./TarjetaCombo";
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
  /* Si hay rebajas, la portada las nombra. Sin esto Valen puede poner
     una oferta desde el panel y la clienta no se entera nunca: para
     encontrarla tendria que abrir el catalogo y mirar ficha por ficha. */
  const enOferta = productosEnOferta(productos);
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

        {/*
          EL ACCESO A LAS OFERTAS, APARTE DEL "VER TODOS".

          Se dibuja solo si hay alguna rebajada. Iba a reemplazar al
          "Ver todos" y no: son dos viajes distintos —mirar la tienda y
          buscar lo rebajado— y sacarle a la portada el camino al
          catalogo completo para poner este seria cambiar una cosa por
          la otra.
        */}
        {enOferta.length > 0 && (
          <p className="mt-3 text-center">
            <Link
              href="/productos?oferta=si"
              className="inline-flex items-center gap-2 rounded-full bg-positivo px-4 py-2 font-display text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {enOferta.length === 1
                ? "1 producto en oferta"
                : `${enOferta.length} productos en oferta`}
              <span aria-hidden>→</span>
            </Link>
          </p>
        )}

        <div className="mt-8">
          <Carrusel etiqueta="Productos destacados">
            {destacados.map((p) => (
              <FichaProducto key={p.id} producto={p} />
            ))}
          </Carrusel>
        </div>

        {/*
          LOS COMBOS, DEBAJO DE LOS PRODUCTOS, EN SU PROPIA FILA.

          Es donde los ponen Mercado Libre y Amazon: primero se ve que se
          vende, y despues "llevate el conjunto" cierra la compra.

          Van en fila que se desliza y no uno debajo del otro: apilados,
          cuatro combos eran tres pantallas y media de celular en el medio
          de la portada. Con su propio titulo de estante, igual al de
          "Productos", se leen como un segundo estante de la misma tienda.

          Si a un combo le falta algun producto, no aparece; sin ninguno,
          no aparece la fila.
        */}
        {combos.length > 0 && (
          <div className="mt-14">
            <TituloTienda titulo="Combos" />
            <div className="mt-6">
              <Carrusel etiqueta="Combos" tipo="combos">
                {combos.map((c) => (
                  <TarjetaCombo key={c.id} combo={c} />
                ))}
              </Carrusel>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
