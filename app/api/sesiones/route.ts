import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const clienteId = req.nextUrl.searchParams.get("cliente_id");
  if (!clienteId) {
    return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  }

  const { data, error } = await sesion.sb
    .from("sesiones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false });

  if (error) return fallo("traer las sesiones", error);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();

  const { data, error } = await sesion.sb
    .from("sesiones")
    .insert({
      cliente_id: body.cliente_id,
      fecha: body.fecha,
      tratamiento: body.tratamiento,
      precio: body.precio ? parseInt(body.precio) : null,
      notas: body.notas || null,
    })
    .select()
    .single();

  if (error) return fallo("guardar la sesión", error);
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sesion.sb.from("sesiones").delete().eq("id", id);
  if (error) return fallo("borrar la sesión", error);
  return NextResponse.json({ ok: true });
}
