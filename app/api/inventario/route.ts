import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

const camposDe = (body: Record<string, unknown>) => ({
  marca: body.marca,
  producto: body.producto,
  costo: body.costo,
  precio_venta: body.precio_venta,
  cantidad: body.cantidad,
});

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { data, error } = await sesion.sb
    .from("inventario")
    .select("*")
    .order("marca");

  if (error) return fallo("traer el inventario", error);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  const { data, error } = await sesion.sb
    .from("inventario")
    .insert(camposDe(body))
    .select()
    .single();

  if (error) return fallo("guardar el producto", error);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await sesion.sb
    .from("inventario")
    .update(camposDe(body))
    .eq("id", id)
    .select()
    .single();

  if (error) return fallo("guardar los cambios", error);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sesion.sb.from("inventario").delete().eq("id", id);
  if (error) return fallo("borrar el producto", error);
  return NextResponse.json({ ok: true });
}
