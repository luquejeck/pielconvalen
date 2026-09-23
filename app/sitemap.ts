import type { MetadataRoute } from "next";
import { obtenerProductos } from "@/lib/catalogo-productos";
import { SITIO_URL } from "@/lib/config";
import { productosPublicados, slugDe } from "@/lib/productos";

/**
 * El sitemap le confirma a Google cual es la direccion canonica y cada
 * cuanto vale la pena volver a mirarla, que para un negocio de barrio
 * que quiere aparecer en "cosmetologa Caballito" no es poco.
 *
 * Son dos paginas: la portada, que es donde se saca el turno, y el
 * catalogo de productos. La portada mantiene la prioridad 1 —el turno
 * sigue siendo el negocio— y el catalogo va abajo, pero entra igual
 * porque las busquedas de marca ("Beauty of Joseon Buenos Aires") son
 * gente que ya sabe lo que quiere comprar.
 *
 * Y cada producto con su pagina: quien busca "Anua Peach 77 Buenos
 * Aires" tiene que caer en la ficha de ese producto, no en el catalogo.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const productos = productosPublicados(await obtenerProductos());

  return [
    {
      url: SITIO_URL,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITIO_URL}/productos`,
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...productos.map((p) => ({
      url: `${SITIO_URL}/productos/${slugDe(p)}`,
      lastModified: ahora,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
