import { requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Los movimientos del mes, en una planilla que se abre en Excel.
 *
 * Hasta ahora no habia forma de sacar los numeros del panel: para el
 * contador o para el monotributo, Valen tenia que copiarlos a mano de la
 * pantalla.
 *
 * Va con punto y coma y con BOM a proposito: es lo que espera el Excel
 * en español. Con coma, mete todo en una sola columna; sin BOM, los
 * acentos salen rotos.
 */
const SEPARADOR = ";";

const escapar = (v: unknown) => {
  const t = String(v ?? "");
  return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const mes = req.nextUrl.searchParams.get("mes");
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return NextResponse.json({ error: "Falta el mes." }, { status: 400 });
  }

  const [anio, m] = mes.split("-").map(Number);
  const finExclusivo = new Date(anio, m, 1);
  const hasta = `${finExclusivo.getFullYear()}-${String(
    finExclusivo.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const { data, error } = await sesion.sb
    .from("movimientos")
    .select("fecha, tipo, categoria, descripcion, monto, costo, medio_pago")
    .gte("fecha", `${mes}-01`)
    .lt("fecha", hasta)
    .order("fecha");

  if (error) {
    return NextResponse.json(
      { error: "No se pudo armar la planilla." },
      { status: 500 }
    );
  }

  const ETIQUETA: Record<string, string> = {
    ingreso: "Tratamiento",
    venta_producto: "Producto",
    gasto: "Gasto",
    compra_producto: "Compra",
  };

  const esIngreso = (t: string) => t === "ingreso" || t === "venta_producto";

  const encabezado = [
    "Fecha",
    "Tipo",
    "Categoría",
    "Detalle",
    "Entra",
    "Sale",
    "Costo",
    "Medio de pago",
  ];

  const filas = (data ?? []).map((mv) =>
    [
      mv.fecha,
      ETIQUETA[mv.tipo] ?? mv.tipo,
      mv.categoria,
      mv.descripcion,
      esIngreso(mv.tipo) ? mv.monto : "",
      esIngreso(mv.tipo) ? "" : mv.monto,
      mv.costo ?? "",
      mv.medio_pago ?? "",
    ]
      .map(escapar)
      .join(SEPARADOR)
  );

  // Total al final, que es lo primero que mira un contador
  const entra = (data ?? [])
    .filter((mv) => esIngreso(mv.tipo))
    .reduce((s, mv) => s + mv.monto, 0);
  const sale = (data ?? [])
    .filter((mv) => !esIngreso(mv.tipo))
    .reduce((s, mv) => s + mv.monto, 0);

  const totales = ["", "", "", "TOTAL", entra, sale, "", ""]
    .map(escapar)
    .join(SEPARADOR);

  const csv =
    "\uFEFF" + [encabezado.join(SEPARADOR), ...filas, "", totales].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="piel-con-valen-${mes}.csv"`,
    },
  });
}
