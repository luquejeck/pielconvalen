import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clienteServidor } from "./supabase-servidor";

/**
 * Puerta de entrada de las rutas de datos.
 *
 * Hasta ahora ninguna ruta de /api miraba si habia sesion: lo unico que
 * las tapaba era el RLS de Postgres. Funcionaba —probado: sin sesion,
 * `GET /api/clientes` devolvia una lista vacia y el POST rebotaba—, pero
 * era una sola capa. El dia que alguien use una `service_role` key en el
 * servidor, cosa muy normal de hacer, el RLS deja de filtrar y queda
 * todo abierto de golpe.
 *
 * Uso:
 *
 *   const sesion = await requerirSesion();
 *   if (!sesion.ok) return sesion.respuesta;
 *   const { sb } = sesion;
 */
type Sesion =
  | { ok: true; sb: SupabaseClient }
  | { ok: false; respuesta: NextResponse };

export async function requerirSesion(): Promise<Sesion> {
  const sb = await clienteServidor();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { error: "Hay que iniciar sesión." },
        { status: 401 }
      ),
    };
  }

  return { ok: true, sb };
}

/**
 * Error de base de datos, contado sin dar detalles de mas.
 *
 * Antes las rutas devolvian `error.message` crudo, asi que un POST sin
 * permiso contestaba textualmente "new row violates row-level security
 * policy for table clientes": el nombre de la tabla y la politica, a
 * quien todavia no habia entrado. El detalle real queda en los logs del
 * servidor, que es donde sirve.
 */
export function fallo(
  queHacia: string,
  error: { message: string; code?: string },
  status = 500
) {
  console.error(`[api] ${queHacia}:`, error.code ?? "", error.message);
  return NextResponse.json(
    { error: `No se pudo ${queHacia}. Probá de nuevo.` },
    { status }
  );
}
