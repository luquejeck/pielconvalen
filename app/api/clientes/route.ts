import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

/** Los datos de las clientas incluyen historial medico: solo con sesion. */

const camposDe = (body: Record<string, string | undefined>) => ({
  nombre: body.nombre,
  telefono: body.telefono || null,
  email: body.email || null,
  fecha_nacimiento: body.fecha_nacimiento || null,
  antecedentes: body.antecedentes || null,
  notas: body.notas || null,
});

export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const q = req.nextUrl.searchParams.get("q") ?? "";

  let query = sesion.sb.from("clientes").select("*").order("nombre");
  if (q) query = query.ilike("nombre", `%${q}%`);

  const { data, error } = await query;
  if (error) return fallo("traer las clientas", error);

  const clientes = data ?? [];
  if (clientes.length === 0) return NextResponse.json([]);

  /*
    Cuando vino por ultima vez y si tiene turno, para cada una.

    Va en UNA consulta y no una por clienta: con cien fichas, lo segundo
    son cien viajes a la base cada vez que se abre la pantalla. Se traen
    todos los turnos de estas clientas y se agrupan aca.
  */
  const ids = clientes.map((c) => c.id);
  const { data: turnos } = await sesion.sb
    .from("turnos")
    .select("cliente_id, fecha, hora, estado")
    .in("cliente_id", ids)
    .order("fecha");

  const hoy = new Date().toISOString().slice(0, 10);
  const resumen = new Map<
    string,
    { visitas: number; ultimaVisita: string | null; proximo: string | null }
  >();

  for (const t of turnos ?? []) {
    if (!t.cliente_id) continue;
    const r = resumen.get(t.cliente_id) ?? {
      visitas: 0,
      ultimaVisita: null,
      proximo: null,
    };

    if (t.estado === "realizado") {
      r.visitas++;
      // Vienen ordenados por fecha, asi que el ultimo pisa al anterior.
      r.ultimaVisita = t.fecha;
    }
    if (t.fecha >= hoy && (t.estado === "confirmado" || t.estado === "pendiente")) {
      if (!r.proximo) r.proximo = t.fecha;
    }

    resumen.set(t.cliente_id, r);
  }

  return NextResponse.json(
    clientes.map((c) => ({
      ...c,
      ...(resumen.get(c.id) ?? { visitas: 0, ultimaVisita: null, proximo: null }),
    }))
  );
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  if (!body.nombre?.trim()) {
    return NextResponse.json({ error: "Falta el nombre." }, { status: 400 });
  }

  const { data, error } = await sesion.sb
    .from("clientes")
    .insert(camposDe(body))
    .select()
    .single();

  if (error) return fallo("guardar la clienta", error);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await sesion.sb
    .from("clientes")
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

  const { error } = await sesion.sb.from("clientes").delete().eq("id", id);
  if (error) return fallo("borrar la clienta", error);
  return NextResponse.json({ ok: true });
}
