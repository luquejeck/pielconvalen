import { clienteServidor } from "@/lib/supabase-servidor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sb = await clienteServidor();
  const q = req.nextUrl.searchParams.get("q") ?? "";

  let query = sb.from("clientes").select("*").order("nombre");
  if (q) query = query.ilike("nombre", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sb = await clienteServidor();
  const body = await req.json();

  const { data, error } = await sb
    .from("clientes")
    .insert({
      nombre: body.nombre,
      telefono: body.telefono || null,
      email: body.email || null,
      fecha_nacimiento: body.fecha_nacimiento || null,
      antecedentes: body.antecedentes || null,
      notas: body.notas || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sb = await clienteServidor();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await sb
    .from("clientes")
    .update({
      nombre: body.nombre,
      telefono: body.telefono || null,
      email: body.email || null,
      fecha_nacimiento: body.fecha_nacimiento || null,
      antecedentes: body.antecedentes || null,
      notas: body.notas || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sb = await clienteServidor();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sb.from("clientes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
