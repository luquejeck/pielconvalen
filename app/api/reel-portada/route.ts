import { NextRequest, NextResponse } from "next/server";

/**
 * La portada de un reel de Instagram, servida por nosotros.
 *
 * Las tarjetas de "Cómo es una sesión" mostraban un color liso con un
 * numero y un boton: no se veia nada de lo que hay adentro, asi que no
 * habia ninguna razon para tocarlas.
 *
 * ----------------------------------------------------------------------
 * POR QUE PASA POR ACA Y NO VA DERECHO A INSTAGRAM
 *
 * Se podria poner la direccion de Instagram en el `src` de la imagen y
 * listo. Pero entonces cada visita a la web —aunque nadie mire un solo
 * video— le manda la IP de la clienta a Facebook, que es exactamente lo
 * que se evito al hacer que los reels no se carguen solos.
 *
 * Asi el pedido lo hace nuestro servidor: Instagram ve a Vercel, no a la
 * clienta. Y de paso la respuesta queda cacheada, con lo cual tampoco es
 * un pedido por visita.
 *
 * El embebido no sirve para esto: su HTML solo trae la foto de perfil de
 * 100x100. El fotograma sale del endpoint `/p/<codigo>/media`, que es el
 * viejo de Instagram y sigue respondiendo.
 * ---------------------------------------------------------------------- */

/** Un dia. Una portada no cambia nunca; lo que cambia es que el reel se borre. */
export const revalidate = 86400;

/**
 * Solo letras, numeros, guion y guion bajo.
 *
 * Esto es lo que evita que el parametro se convierta en una puerta para
 * pedirle a nuestro servidor cualquier direccion de internet: lo unico
 * que puede viajar es un codigo de Instagram.
 */
const CODIGO_VALIDO = /^[A-Za-z0-9_-]{5,30}$/;

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo") ?? "";

  if (!CODIGO_VALIDO.test(codigo)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  try {
    const respuesta = await fetch(
      `https://www.instagram.com/p/${codigo}/media/?size=l`,
      {
        // Sin un navegador declarado, Instagram contesta 403.
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
        next: { revalidate },
      }
    );

    const tipo = respuesta.headers.get("content-type") ?? "";

    // Un reel borrado devuelve una pagina de error con 200: si no vino una
    // imagen, es que no hay portada.
    if (!respuesta.ok || !tipo.startsWith("image/")) {
      return NextResponse.json({ error: "Sin portada" }, { status: 404 });
    }

    return new NextResponse(await respuesta.arrayBuffer(), {
      headers: {
        "Content-Type": tipo,
        /* Que la guarden el navegador y el borde de Vercel: la portada no
           cambia y no hay motivo para volver a pedirla. */
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
    });
  } catch {
    // Si Instagram no contesta, la tarjeta se queda con su fondo oscuro.
    return NextResponse.json({ error: "Sin portada" }, { status: 404 });
  }
}
