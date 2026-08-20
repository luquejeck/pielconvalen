import { clienteServidor } from "@/lib/supabase-servidor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sb = await clienteServidor();
  const { searchParams } = req.nextUrl;
  const mes = searchParams.get("mes"); // formato YYYY-MM

  let query = sb
    .from("movimientos")
    .select("*")
    .order("fecha", { ascending: false });

  if (mes) {
    const desde = `${mes}-01`;
    const hasta = `${mes}-31`;
    query = query.gte("fecha", desde).lte("fecha", hasta);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await clienteServidor();
  const body = await req.json();

  const { data, error } = await sb
    .from("movimientos")
    .insert({
      fecha: body.fecha,
      tipo: body.tipo,
      categoria: body.categoria,
      descripcion: body.descripcion,
      monto: body.monto,
      costo: body.costo ?? null,
      cliente_id: body.cliente_id ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Si es venta de producto con inventario_id, descontar una unidad
  if (body.inventario_id) {
    const { data: item } = await sb
      .from("inventario")
      .select("cantidad")
      .eq("id", body.inventario_id)
      .single();

    if (item && item.cantidad > 0) {
      await sb
        .from("inventario")
        .update({ cantidad: item.cantidad - 1 })
        .eq("id", body.inventario_id);
    }
  }

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sb = await clienteServidor();
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sb.from("movimientos").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
