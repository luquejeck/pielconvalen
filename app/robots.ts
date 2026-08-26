import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/config";

/**
 * El panel y las rutas de datos no tienen nada que hacer en Google.
 * Las paginas de /admin ya piden no ser indexadas desde su metadata;
 * esto lo dice una vez para todas, antes de que el buscador entre.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITIO_URL}/sitemap.xml`,
  };
}
