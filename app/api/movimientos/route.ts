import { fallo, requerirSesion } from "@/lib/api";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

/**
 * Descuenta unidades del inventario.
 *
 * Primero intenta la funcion de la base (schema-7), que hace la resta en
 * una sola operacion atomica: `cantidad = cantidad - n` con el candado de
 * Postgres, sin leer antes. Si esa funcion todavia no esta creada, cae en
 * el metodo viejo —leer y despues escribir— para no romper la venta.
 *
 * VALEN / LUCAS: corriendo schema-7-correcciones.sql en Supabase, se usa
 * siempre el camino bueno.
 */
async function descontarStock(sb: SupabaseClient, id: string, unidades = 1) {
  const { error } = await sb.rpc("descontar_stock", {
    p_inventario_id: id,
    p_unidades: unidades,
  });

  if (!error) return;

  // 42883 = la funcion no existe todavia. PGRST202 = idem, visto por PostgREST.
  const faltaLaFuncion = error.code === "42883" || error.code === "PGRST202";
  if (!faltaLaFuncion) {
    console.error("[api] descontar stock:", error.code, error.message);
    return;
  }

  const { data: item } = await sb
    .from("inventario")
    .select("cantidad")
    .eq("id", id)
    .single();

  if (item && item.cantidad > 0) {
    await sb
      .from("inventario")
      .update({ cantidad: Math.max(0, item.cantidad - unidades) })
      .eq("id", id);
  }
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();

  const { data, error } = await sesion.sb
    .from("movimientos")
    .insert({
      fecha: body.fecha,
      tipo: body.tipo,
      categoria: body.categoria,
      descripcion: body.descripcion,
      monto: body.monto,
      /*
        El costo llega del inventario y se guarda CONGELADO en la venta.
        Leerlo despues del inventario daria el costo de hoy, no el del
        dia en que se vendio, y el margen historico quedaria falseado
        cada vez que cambie un precio de compra.
      */
      costo: body.costo ?? null,
      cliente_id: body.cliente_id ?? null,
    })
    .select()
    .single();

  if (error) return fallo("guardar el movimiento", error);

  if (body.inventario_id) {
    await descontarStock(sesion.sb, body.inventario_id);
  }

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
