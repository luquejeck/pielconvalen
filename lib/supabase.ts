import { createBrowserClient } from "@supabase/ssr";

export const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const CLAVE_PUBLICA = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Mientras no esten cargadas las variables de entorno, la web sigue
 * funcionando con la agenda simulada. Asi nunca queda rota.
 */
export const hayBaseDeDatos = Boolean(URL_SUPABASE && CLAVE_PUBLICA);

/**
 * Cliente para componentes que corren en el navegador.
 * Este archivo NO puede importar next/headers: lo usan los client components.
 * La version de servidor esta en supabase-servidor.ts
 */
export function clienteNavegador() {
  return createBrowserClient(URL_SUPABASE, CLAVE_PUBLICA);
}
