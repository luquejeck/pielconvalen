import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ESTADOS = ["pendiente", "confirmado", "bloqueado", "realizado", "no_vino"];

/** Cambia el estado de un turno. La usa la bandeja de pedidos pendientes. */
export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { id, estado } = await req.json();

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  if (!ESTADOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { error } = await sesion.sb.from("turnos").update({ estado }).eq("id", id);
  if (error) return fallo("cambiar el estado del turno", error);

  return NextResponse.json({ ok: true });
}

/** Libera el horario. */
export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sesion.sb.from("turnos").delete().eq("id", id);
  if (error) return fallo("liberar el horario", error);

  return NextResponse.json({ ok: true });
}
