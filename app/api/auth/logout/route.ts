import { clienteServidor } from "@/lib/supabase-servidor";
import { NextResponse } from "next/server";

/** Cierra la sesion del lado del servidor, que es quien escribio la cookie. */
export async function POST() {
  const sb = await clienteServidor();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
