import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { CLAVE_PUBLICA, URL_SUPABASE } from "./supabase";

/** Cliente para Server Components y rutas de API. */
export async function clienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(URL_SUPABASE, CLAVE_PUBLICA, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesNuevas) {
        try {
          cookiesNuevas.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Los Server Components no pueden escribir cookies:
          // el middleware ya se encarga de refrescar la sesion.
        }
      },
    },
  });
}
