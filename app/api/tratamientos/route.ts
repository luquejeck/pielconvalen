import { clienteServidor } from "@/lib/supabase-servidor";
import { NextResponse } from "next/server";

export async function GET() {
  const sb = await clienteServidor();
  const { data, error } = await sb
    .from("tratamientos")
    .select("id, nombre, precio")
    .order("nombre");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
