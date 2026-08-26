import { fallo, requerirSesion } from "@/lib/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Los pedidos sin responder, de TODOS los dias.
 *
 * El panel de turnos mira un dia por vez. Si entraba un pedido para
 * dentro de tres semanas, Valen no lo veia en ningun lado salvo que
 * navegara a esa fecha exacta: si se le pasaba el mensaje de WhatsApp,
 * el horario quedaba bloqueado y la clienta esperando.
 *
 * Devuelve tambien si el pedido ya se vencio (mas de 24 horas sin
 * responder). Los vencidos ya no ocupan el horario en la web —la vista
 * `turnos_publicos` los ignora— pero siguen figurando aca para que Valen
 * sepa que existieron y los pueda limpiar.
 */
const HORAS_PARA_VENCER = 24;

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const hoy = new Date();
  const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(
    hoy.getDate()
  ).padStart(2, "0")}`;

  const { data, error } = await sesion.sb
    .from("turnos")
    .select("id, fecha, hora, cliente, telefono, tratamiento, precio, cliente_id, creado_en")
    .eq("estado", "pendiente")
    .gte("fecha", desde)
    .order("fecha")
    .order("hora");

  if (error) return fallo("traer los pedidos pendientes", error);

  const limite = Date.now() - HORAS_PARA_VENCER * 3600 * 1000;

  return NextResponse.json(
    (data ?? []).map((t) => ({
      ...t,
      vencido: new Date(t.creado_en).getTime() < limite,
    }))
  );
}
