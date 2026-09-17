import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/config";

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
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

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
  ];
}
