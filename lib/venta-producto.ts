import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyEnArgentina } from "./fechas";
import { registrarStock } from "./historial-stock";

/**
 * Registrar la venta de un producto: la plata, el stock y el historial.
 *
 * ESTA EN UN SOLO LUGAR PORQUE AHORA HAY DOS PUERTAS.
 * La venta suelta entra por /api/movimientos y la del combo por
 * /api/combos/venta, que registra una venta por cada producto que lo
 * forma. Si cada ruta hiciera su propia version, la del combo se iba a
 * olvidar de algo —el costo congelado, la cotizacion, el historial— y el
 * seguimiento de ganancia iba a mentir justo en las ventas mas grandes.
 *
 * LO QUE PONE EL SERVIDOR Y NO EL FORMULARIO: el costo en pesos, el
 * costo en dolares, la cotizacion del dia y el nombre del producto. Se
 * leen de la base y se congelan en el movimiento, para que el margen de
 * una venta de marzo se siga leyendo igual dentro de un año.
 */
export type DatosVenta = {
  inventario_id: string;
  unidades: number;
  /** Lo que entro de plata por esta linea, total (no por unidad). */
  monto: number;
  descripcion: string;
  fecha?: string;
  medio_pago?: string | null;
  cliente_id?: string | null;
  tipo?: string;
  categoria?: string;
};

/**
 * Descuenta unidades del inventario.
 *
 * Primero intenta la funcion de la base (schema-7), que hace la resta en
 * una sola operacion atomica: `cantidad = cantidad - n` con el candado de
 * Postgres, sin leer antes. Si esa funcion todavia no esta creada, cae en
 * el metodo viejo —leer y despues escribir— para no romper la venta.
 */
export async function descontarStock(
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

export async function registrarVentaProducto(sb: SupabaseClient, v: DatosVenta) {
  const [{ data: prod }, { data: cfg }] = await Promise.all([
    sb
      .from("inventario")
      .select("marca, producto, costo, costo_usd")
      .eq("id", v.inventario_id)
      .maybeSingle(),
    sb.from("configuracion").select("valor").eq("clave", "cotizacion_usd").maybeSingle(),
  ]);

  const nombre = prod ? `${prod.marca} ${prod.producto}`.trim() : null;
  const fecha = v.fecha || hoyEnArgentina();

  const { data, error } = await sb
    .from("movimientos")
    .insert({
      fecha,
      tipo: v.tipo ?? "venta_producto",
      categoria: v.categoria ?? "producto",
      descripcion: v.descripcion,
      monto: v.monto,
      costo: prod?.costo ?? null,
      costo_usd: prod?.costo_usd ?? null,
      cotizacion: cfg?.valor ? Number(cfg.valor) : null,
      cliente_id: v.cliente_id ?? null,
      medio_pago: v.medio_pago ?? null,
      inventario_id: v.inventario_id,
      unidades: v.unidades,
      producto_nombre: nombre,
    })
    .select()
    .single();

  if (error) return { movimiento: null, error };

  const queda = await descontarStock(sb, v.inventario_id, v.unidades);
  /* La venta en el historial de stock, atada a su ingreso en la caja. */
  await registrarStock(sb, {
    inventario_id: v.inventario_id,
    cantidad: -v.unidades,
    motivo: "venta",
    movimiento_id: data.id,
    stock_resultante: queda,
    producto_nombre: nombre,
    fecha,
  });

  return { movimiento: data, error: null };
}
