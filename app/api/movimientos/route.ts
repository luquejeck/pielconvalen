import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";
import { hoyEnArgentina } from "@/lib/fechas";
import { registrarVentaProducto } from "@/lib/venta-producto";

/**
 * "2026-02" -> "2026-03-01"
 *
 * El filtro por mes armaba el final del rango como `${mes}-31`. Para
 * febrero eso da "2026-02-31", que no es una fecha: Postgres corta con
 * error de rango. Lo mismo en abril, junio, septiembre y noviembre.
 * Preguntar por "menor que el primero del mes siguiente" no tiene ese
 * problema en ningun mes.
 */
function primeroDelMesSiguiente(mes: string): string {
  const [anio, m] = mes.split("-").map(Number);
  const d = new Date(anio, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function GET(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { searchParams } = req.nextUrl;
  const mes = searchParams.get("mes"); // "YYYY-MM"
  const desde = searchParams.get("desde"); // "YYYY-MM-DD"
  const hasta = searchParams.get("hasta"); // "YYYY-MM-DD", sin incluir

  let query = sesion.sb
    .from("movimientos")
    .select("*")
    .order("fecha", { ascending: false });

  if (mes && /^\d{4}-\d{2}$/.test(mes)) {
    query = query.gte("fecha", `${mes}-01`).lt("fecha", primeroDelMesSiguiente(mes));
  } else if (desde && /^\d{4}-\d{2}-\d{2}$/.test(desde)) {
    // El panel pide una ventana, no el historial entero: el dashboard
    // necesita seis meses —o los doce del año— y el flujo de caja el mes
    // que se este mirando.
    query = query.gte("fecha", desde);

    /*
      Con `hasta` la ventana se cierra de los dos lados. Sin esto, mirar
      el año 2025 desde 2027 traia tambien todo 2026 y todo 2027: cuanto
      mas atras mira, mas filas viajan, que es justo al reves de lo que
      conviene.
    */
    if (hasta && /^\d{4}-\d{2}-\d{2}$/.test(hasta)) {
      query = query.lt("fecha", hasta);
    }
  }

  const { data, error } = await query;
  if (error) return fallo("traer los movimientos", error);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();

  /*
    SI ES UNA VENTA DE PRODUCTO, LOS DATOS LOS PONE EL SERVIDOR.

    El costo, el costo en dolares, la cotizacion del dia y el nombre se
    leen de la base y se congelan; ademas se descuenta el stock y queda
    la linea en el historial. Todo eso vive en lib/venta-producto.ts,
    que es lo que usa tambien la venta de un combo: una venta registrada
    de dos maneras distintas segun por donde entre es como se desfasa la
    ganancia sin que nadie se entere.
  */
  if (body.inventario_id) {
    const { movimiento, error } = await registrarVentaProducto(sesion.sb, {
      inventario_id: body.inventario_id,
      unidades: Number(body.unidades) || 1,
      monto: body.monto,
      descripcion: body.descripcion,
      fecha: body.fecha || undefined,
      medio_pago: body.medio_pago ?? null,
      cliente_id: body.cliente_id ?? null,
      tipo: body.tipo,
      categoria: body.categoria,
    });
    if (error) return fallo("guardar el movimiento", error);
    return NextResponse.json(movimiento, { status: 201 });
  }

  /* Lo demas —cobros, gastos, compras— entra tal cual: no toca stock ni
     tiene producto al que atarse. */
  const { data, error } = await sesion.sb
    .from("movimientos")
    .insert({
      /* Sin fecha, la de hoy EN ARGENTINA: el default de la base es
         UTC y desde las 21 h ya es mañana. */
      fecha: body.fecha || hoyEnArgentina(),
      tipo: body.tipo,
      categoria: body.categoria,
      descripcion: body.descripcion,
      monto: body.monto,
      costo: body.costo ?? null,
      costo_usd: body.costo_usd ?? null,
      cotizacion: body.cotizacion ?? null,
      cliente_id: body.cliente_id ?? null,
      medio_pago: body.medio_pago ?? null,
      producto_nombre: body.producto_nombre ?? null,
    })
    .select()
    .single();

  if (error) return fallo("guardar el movimiento", error);
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const { error } = await sesion.sb.from("movimientos").delete().eq("id", id);
  if (error) return fallo("borrar el movimiento", error);
  return NextResponse.json({ ok: true });
}
