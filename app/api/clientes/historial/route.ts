import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Todo lo que sabemos de una clienta, junto.
 *
 * `turnos.cliente_id` y `movimientos.cliente_id` se venian escribiendo
 * desde siempre y no los leia NADIE: el boton "Vincular clienta" del
 * panel de turnos guardaba una relacion que despues no se consultaba en
 * ningun lado. La ficha mostraba solo las sesiones cargadas a mano, asi
 * que no habia forma de saber cuando vino por ultima vez ni cuanto gasto.
 */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const clienteId = req.nextUrl.searchParams.get("cliente_id");
  if (!clienteId) {
    return NextResponse.json({ error: "Falta cliente_id" }, { status: 400 });
  }

  const [{ data: turnos, error: errorTurnos }, { data: movimientos, error: errorMovs }] =
    await Promise.all([
      sesion.sb
        .from("turnos")
        .select("id, fecha, hora, estado, tratamiento, precio")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: false }),
      sesion.sb
        .from("movimientos")
        .select("id, fecha, monto, descripcion, medio_pago, tipo")
        .eq("cliente_id", clienteId)
        .order("fecha", { ascending: false }),
    ]);

  if (errorTurnos) return fallo("traer los turnos de la clienta", errorTurnos);
  if (errorMovs) return fallo("traer los pagos de la clienta", errorMovs);

  const hoy = new Date().toISOString().slice(0, 10);

  const realizados = (turnos ?? []).filter((t) => t.estado === "realizado");
  const proximos = (turnos ?? []).filter(
    (t) => t.fecha >= hoy && (t.estado === "confirmado" || t.estado === "pendiente")
  );

  const gastado = (movimientos ?? [])
    .filter((m) => m.tipo === "ingreso" || m.tipo === "venta_producto")
    .reduce((s, m) => s + (m.monto ?? 0), 0);

  // La ultima visita sale de los turnos realizados; si todavia no hay
  // ninguno —porque el historial viene de antes del panel— vale la
  // sesion mas reciente cargada a mano.
  const ultimaVisita = realizados[0]?.fecha ?? null;

  const diasSinVenir = ultimaVisita
    ? Math.floor(
        (Date.now() - new Date(`${ultimaVisita}T00:00:00`).getTime()) / 86400000
      )
    : null;

  return NextResponse.json({
    turnos: turnos ?? [],
    movimientos: movimientos ?? [],
    resumen: {
      visitas: realizados.length,
      gastado,
      ultimaVisita,
      diasSinVenir,
      proximoTurno: proximos.sort((a, b) => a.fecha.localeCompare(b.fecha))[0] ?? null,
    },
  });
}
