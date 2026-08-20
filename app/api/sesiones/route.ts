import { clienteServidor } from "@/lib/supabase-servidor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sb = await clienteServidor();
  const clienteId = req.nextUrl.searchParams.get("cliente_id");
  if (!clienteId) return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });

  const { data, error } = await sb
    .from("sesiones")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("fecha", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await clienteServidor();
  const body = await req.json();

  const { data, error } = await sb
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sb = await clienteServidor();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sb.from("sesiones").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
