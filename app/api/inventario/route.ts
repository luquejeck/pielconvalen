import { clienteServidor } from "@/lib/supabase-servidor";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const sb = await clienteServidor();
  const { data, error } = await sb.from("inventario").select("*").order("marca");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await clienteServidor();
  const body = await req.json();
  const { data, error } = await sb
    .from("inventario")
    .insert({ marca: body.marca, producto: body.producto, costo: body.costo, precio_venta: body.precio_venta, cantidad: body.cantidad })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sb = await clienteServidor();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const body = await req.json();
  const { data, error } = await sb
    .from("inventario")
    .update({ marca: body.marca, producto: body.producto, costo: body.costo, precio_venta: body.precio_venta, cantidad: body.cantidad })
    .eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sb = await clienteServidor();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  const { error } = await sb.from("inventario").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
