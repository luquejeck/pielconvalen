import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * "Atendida y cobrada" — el boton que le saca dos cargas de encima.
 *
 * Antes, un turno atendido eran tres viajes: aceptarlo en Turnos, volver
 * a escribirlo como ingreso en Economia, y volver a escribirlo como
 * sesion en la ficha de la clienta. Los datos ya estaban todos en la
 * fila del turno.
 *
 * El trabajo pesado lo hace `registrar_turno_realizado` en la base, para
 * que las tres escrituras entren juntas o no entre ninguna: un ingreso
 * cargado con el turno sin marcar seria peor que no hacer nada.
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { turnoId, monto, medioPago, notas } = await req.json();

  if (!turnoId) {
    return NextResponse.json({ error: "Falta el turno." }, { status: 400 });
  }

  const importe = Number(monto);
  if (!Number.isFinite(importe) || importe < 0) {
    return NextResponse.json(
      { error: "El monto cobrado no es válido." },
      { status: 400 }
    );
  }

  const { data, error } = await sesion.sb.rpc("registrar_turno_realizado", {
    p_turno_id: turnoId,
    p_monto: Math.round(importe),
    p_medio_pago: medioPago || null,
    p_notas: notas?.trim() || null,
  });

  if (error) {
    // P0001 = ya estaba cobrado. Es informacion util, no un error tecnico.
    if (error.code === "P0001" || error.code === "P0002") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // 42883 / PGRST202 = falta correr schema-8 en Supabase.
    if (error.code === "42883" || error.code === "PGRST202") {
      return NextResponse.json(
        { error: "Falta correr schema-8-tanda2.sql en Supabase." },
        { status: 501 }
      );
    }
    return fallo("registrar el cobro", error);
  }

  return NextResponse.json({ movimientoId: data });
}

/** Deshace el cobro: borra el ingreso y la sesion, y vuelve a confirmado. */
export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const turnoId = req.nextUrl.searchParams.get("turnoId");
  if (!turnoId) {
    return NextResponse.json({ error: "Falta el turno." }, { status: 400 });
  }

  const { error } = await sesion.sb.rpc("anular_turno_realizado", {
    p_turno_id: turnoId,
  });

  if (error) return fallo("deshacer el cobro", error);
  return NextResponse.json({ ok: true });
}
