import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Vuelca los gastos fijos activos al mes indicado.
 *
 * Se puede tocar dos veces sin miedo: el indice unico
 * (gasto_fijo_id, mes) hace que el segundo intento choque, y esos choques
 * se cuentan como "ya estaba" en vez de romper la operacion. Asi Valen no
 * tiene que llevar registro mental de si ya lo hizo este mes.
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { mes } = await req.json(); // "YYYY-MM"
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Falta el mes." }, { status: 400 });
  }

  const { data: gastos, error } = await sesion.sb
    .from("gastos_fijos")
    .select("*")
    .eq("activo", true);

  if (error) return fallo("traer los gastos fijos", error);
  if (!gastos?.length) {
    return NextResponse.json({ cargados: 0, yaEstaban: 0 });
  }

  let cargados = 0;
  let yaEstaban = 0;

  for (const g of gastos) {
    const dia = String(g.dia_del_mes).padStart(2, "0");

    const { error: fallaAlta } = await sesion.sb.from("movimientos").insert({
      fecha: `${mes}-${dia}`,
      tipo: "gasto",
      categoria: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto,
      gasto_fijo_id: g.id,
    });

    if (!fallaAlta) cargados++;
    else if (fallaAlta.code === "23505") yaEstaban++;
    else return fallo("cargar los gastos del mes", fallaAlta);
  }

  return NextResponse.json({ cargados, yaEstaban });
}
