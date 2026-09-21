import { fallo, requerirSesion } from "@/lib/api";
import { registrarStock } from "@/lib/historial-stock";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { hoyEnArgentina } from "@/lib/fechas";

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
async function descontarStock(
  sb: SupabaseClient,
  id: string,
  unidades = 1
): Promise<number | null> {
  const { data, error } = await sb.rpc("descontar_stock", {
    p_inventario_id: id,
    p_unidades: unidades,
  });

  /* La funcion devuelve la cantidad que quedo: el historial la guarda
     para poder leerse sin recalcular. */
  if (!error) return typeof data === "number" ? data : null;

  // 42883 = la funcion no existe todavia. PGRST202 = idem, visto por PostgREST.
  const faltaLaFuncion = error.code === "42883" || error.code === "PGRST202";
  if (!faltaLaFuncion) {
    console.error("[api] descontar stock:", error.code, error.message);
    return null;
  }

  const { data: item } = await sb
    .from("inventario")
    .select("cantidad")
    .eq("id", id)
    .single();

  if (item && item.cantidad > 0) {
    const queda = Math.max(0, item.cantidad - unidades);
    await sb.from("inventario").update({ cantidad: queda }).eq("id", id);
    return queda;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();

  /*
    SI ES UNA VENTA DE PRODUCTO, LOS DATOS LOS PONE EL SERVIDOR.

    El costo, el costo en dolares, la cotizacion del dia y el nombre se
    leen de la base y se congelan aca, no se aceptan del formulario. Asi
    cualquier forma de registrar una venta —la pantalla de Economia hoy,
    otra mañana— queda bien sin depender de que se acuerde de mandarlos.

    Antes el formulario mandaba solo el costo en pesos y la venta
    quedaba sin costo en dolares, sin cotizacion y sin nombre: justo lo
    que hace falta para que la ganancia no se desfase con el dolar.
  */
  let delProducto: {
    costo: number | null;
    costo_usd: number | null;
    cotizacion: number | null;
    producto_nombre: string | null;
  } | null = null;

  if (body.inventario_id) {
    const [{ data: prod }, { data: cfg }] = await Promise.all([
      sesion.sb
        .from("inventario")
        .select("marca, producto, costo, costo_usd")
        .eq("id", body.inventario_id)
        .maybeSingle(),
      sesion.sb
        .from("configuracion")
        .select("valor")
        .eq("clave", "cotizacion_usd")
        .maybeSingle(),
    ]);
    if (prod) {
      delProducto = {
        costo: prod.costo ?? null,
        costo_usd: prod.costo_usd ?? null,
        cotizacion: cfg?.valor ? Number(cfg.valor) : null,
        producto_nombre: `${prod.marca} ${prod.producto}`.trim(),
      };
    }
  }

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
      /*
        El costo llega del inventario y se guarda CONGELADO en la venta.
        Leerlo despues del inventario daria el costo de hoy, no el del
        dia en que se vendio, y el margen historico quedaria falseado
        cada vez que cambie un precio de compra.
      */
      costo: delProducto?.costo ?? body.costo ?? null,
      /*
        Y el costo en dolares con la cotizacion del dia, por lo mismo.
        Sin la cotizacion guardada, el margen historico en dolares se
        recalcularia solo cada vez que se mueve el tipo de cambio, y
        una venta de marzo mostraria un numero distinto segun el dia en
        que se la mire.
      */
      costo_usd: delProducto?.costo_usd ?? body.costo_usd ?? null,
      cotizacion: delProducto?.cotizacion ?? body.cotizacion ?? null,
      cliente_id: body.cliente_id ?? null,
      /*
        El formulario siempre lo mando y esta ruta lo tiraba: nunca
        estuvo en este insert. No se noto porque los cobros de Valen
        entran por /api/turnos, que si lo guarda, y ella todavia no habia
        registrado una venta de producto desde aca. La primera vez que lo
        hiciera, el medio de pago se perdia.
      */
      medio_pago: body.medio_pago ?? null,
      /*
        QUE PRODUCTO SE VENDIO.

        Antes `inventario_id` llegaba, se usaba para descontar stock y
        se tiraba: el movimiento quedaba con una descripcion de texto y
        nada que lo atara al producto. Por eso era imposible contestar
        "cuanto gane con el Glow Serum".

        El nombre va congelado al lado: el dia que Valen borre un
        producto, el id queda en null y sin esto el movimiento se
        quedaria sin decir de que fue.
      */
      inventario_id: body.inventario_id ?? null,
      unidades: body.unidades ?? (body.inventario_id ? 1 : null),
      producto_nombre: delProducto?.producto_nombre ?? body.producto_nombre ?? null,
    })
    .select()
    .single();

  if (error) return fallo("guardar el movimiento", error);

  if (body.inventario_id) {
    const unidades = Number(body.unidades) || 1;
    const queda = await descontarStock(sesion.sb, body.inventario_id, unidades);
    /* La venta en el historial de stock, atada a su ingreso en la caja. */
    await registrarStock(sesion.sb, {
      inventario_id: body.inventario_id,
      cantidad: -unidades,
      motivo: "venta",
      movimiento_id: data.id,
      stock_resultante: queda,
      producto_nombre: delProducto?.producto_nombre ?? null,
      fecha: body.fecha || undefined,
    });
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
