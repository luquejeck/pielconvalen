import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege /admin: sin sesion iniciada, redirige al login.
 * Tambien refresca el token en cada visita para que la sesion no se corte.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin base configurada no hay nada que proteger todavia.
  if (!url || !clave) return NextResponse.next();

  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) =>
          respuesta.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const esLogin = request.nextUrl.pathname.startsWith("/admin/login");

  /**
   * Un redirect arranca con una respuesta limpia, sin las cookies que
   * Supabase acaba de refrescar en `respuesta`. Si no se copian, la sesion
   * se pierde justo al entrar y el login rebota contra si mismo.
   */
  const redirigirA = (pathname: string) => {
    const destino = request.nextUrl.clone();
    destino.pathname = pathname;

    const salida = NextResponse.redirect(destino);
    respuesta.cookies.getAll().forEach((cookie) => salida.cookies.set(cookie));
    return salida;
  };

  if (!user && !esLogin) return redirigirA("/admin/login");
  if (user && esLogin) return redirigirA("/admin");

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
