import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Gastos que se repiten todos los meses: alquiler del gabinete, internet,
 * el contador. Se declaran una vez y despues se vuelcan al mes con un
 * boton, en vez de escribirlos de nuevo cada treinta dias.
 */
export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { data, error } = await sesion.sb
    .from("gastos_fijos")
    .select("*")
    .order("descripcion");

  if (error) return fallo("traer los gastos fijos", error);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  if (!body.descripcion?.trim()) {
    return NextResponse.json({ error: "Falta la descripción." }, { status: 400 });
  }

  const { data, error } = await sesion.sb
    .from("gastos_fijos")
    .insert({
      descripcion: body.descripcion.trim(),
      categoria: body.categoria || "Gastos fijos",
      monto: Number(body.monto) || 0,
      dia_del_mes: Number(body.dia_del_mes) || 1,
    })
    .select()
    .single();

  if (error) return fallo("guardar el gasto fijo", error);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await sesion.sb
    .from("gastos_fijos")
    .update({
      descripcion: body.descripcion?.trim(),
      categoria: body.categoria,
      monto: Number(body.monto) || 0,
      dia_del_mes: Number(body.dia_del_mes) || 1,
      activo: body.activo,
    })
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

  const { error } = await sesion.sb.from("gastos_fijos").delete().eq("id", id);
  if (error) return fallo("borrar el gasto fijo", error);
  return NextResponse.json({ ok: true });
}
