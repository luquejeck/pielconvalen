import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

/**
 * El historial de stock de un producto: cada unidad que entro o salio,
 * y por que.
 *
 * Es lo que contesta "¿por que tengo 3 si el sistema dice 5?". Antes de
 * esto los ajustes no dejaban rastro y la pregunta no tenia respuesta.
 *
 * Si todavia no se corrio schema-17, la tabla no existe: se devuelve una
 * lista vacia y un aviso, no un error. La pantalla muestra "sin
 * historial" en vez de romperse.
 */
export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el producto" }, { status: 400 });

  const { data, error } = await sesion.sb
    .from("movimientos_stock")
    .select("id, cantidad, motivo, nota, stock_resultante, fecha, creado_en")
    .eq("inventario_id", id)
    .order("creado_en", { ascending: false })
    .limit(100);

  if (error) {
    /* 42P01 = la tabla no existe todavia. */
    if (error.code === "42P01" || error.code === "PGRST205") {
      return NextResponse.json({ lineas: [], falta: "schema-17" });
    }
    return fallo("traer el historial", error);
  }
  return NextResponse.json({ lineas: data ?? [] });
}
