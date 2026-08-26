import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/config";

/**
 * El sitio es una sola pagina. El sitemap igual sirve: le confirma a
 * Google cual es la direccion canonica y cada cuanto vale la pena volver
 * a mirarla, que para un negocio de barrio que quiere aparecer en
 * "cosmetologa Caballito" no es poco.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITIO_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
