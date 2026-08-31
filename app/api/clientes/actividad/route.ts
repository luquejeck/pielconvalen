import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Que tiene cargado una clienta ALREDEDOR de una fecha.
 *
 * Existe para una sola cosa: avisar antes de anotar dos veces la misma
 * atencion. Hay tres lugares que registran "la atendi" —la ficha de la
 * clienta, Economia y el cobro del turno— y ninguno se entera de los
 * otros. El 31/08/2026 quedaron dos sesiones de la misma clienta el
 * mismo dia por ese camino: una cargada a mano en la ficha y otra
 * generada por el cobro.
 *
 * La ventana es de dias y no del dia exacto a proposito: el ingreso
 * suelto se carga con la fecha de HOY —es lo que propone el formulario—
 * mientras que el turno queda en el dia en que realmente atendio.
 * Pidiendo coincidencia exacta, justo ese caso se escapaba.
 *
 * GET /api/clientes/actividad?cliente_id=…&fecha=2026-08-31&dias=7
 */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { searchParams } = req.nextUrl;
  const clienteId = searchParams.get("cliente_id");
  const fecha = searchParams.get("fecha");
  const dias = Math.min(Number(searchParams.get("dias")) || 7, 60);

  if (!clienteId || !fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json(
      { error: "Faltan cliente_id o fecha" },
      { status: 400 }
    );
  }

  const corrida = (n: number) => {
    const [a, m, d] = fecha.split("-").map(Number);
    const x = new Date(a, m - 1, d + n);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(
      x.getDate()
    ).padStart(2, "0")}`;
  };

  const desde = corrida(-dias);
  const hasta = corrida(dias);

  const [{ data: sesiones, error: errorSesiones }, { data: ingresos, error: errorIngresos }] =
    await Promise.all([
      sesion.sb
        .from("sesiones")
        .select("id, fecha, tratamiento, precio")
        .eq("cliente_id", clienteId)
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: false }),
      sesion.sb
        .from("movimientos")
        .select("id, fecha, descripcion, monto")
        .eq("cliente_id", clienteId)
        .in("tipo", ["ingreso", "venta_producto"])
        .gte("fecha", desde)
        .lte("fecha", hasta)
        .order("fecha", { ascending: false }),
    ]);

  if (errorSesiones) return fallo("buscar sesiones de la clienta", errorSesiones);
  if (errorIngresos) return fallo("buscar cobros de la clienta", errorIngresos);

  return NextResponse.json({
    sesiones: sesiones ?? [],
    ingresos: ingresos ?? [],
  });
}
