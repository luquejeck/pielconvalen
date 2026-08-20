import { clienteServidor } from "@/lib/supabase-servidor";
import { NextRequest, NextResponse } from "next/server";

/**
 * Login del lado del servidor.
 *
 * Antes la sesion se creaba en el navegador y la cookie se escribia con
 * JavaScript. Varios celulares descartan esas escrituras (Safari con
 * prevencion de rastreo, o el navegador con cookies restringidas), asi que
 * el login "funcionaba" pero la sesion no sobrevivia a la redireccion y la
 * pagina rebotaba de vuelta al ingreso.
 *
 * Haciendolo aca, la cookie viaja en un Set-Cookie del servidor, que el
 * navegador respeta igual que cualquier cookie de sesion normal.
 */
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
  }

  const sb = await clienteServidor();
  const { data, error } = await sb.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password: String(password),
  });

  if (error) {
    const causa = error.message.toLowerCase();
    const mensaje = causa.includes("not confirmed")
      ? "La cuenta existe pero no está confirmada. Hay que activarla desde Supabase."
      : causa.includes("invalid login")
        ? "Mail o contraseña incorrectos."
        : error.message;

    return NextResponse.json({ error: mensaje }, { status: 401 });
  }

  if (!data.session) {
    return NextResponse.json(
      { error: "No se pudo abrir la sesión. Probá de nuevo." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
