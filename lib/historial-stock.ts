import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { hoyEnArgentina } from "./fechas";

/**
 * Anota un cambio de stock en el historial.
 *
 * Se llama desde los tres lugares que mueven unidades: la compra y el
 * ajuste (/api/inventario/stock) y la venta (/api/movimientos). Esta
 * sola, en un lugar, para que las tres anoten lo mismo de la misma
 * forma.
 *
 * NUNCA HACE FALLAR LA OPERACION QUE LA LLAMA.
 * Si el historial no se puede escribir —porque todavia no se corrio
 * supabase/schema-17-historial-stock.sql, o por cualquier otra cosa—, la
 * venta o la compra igual tienen que entrar: perder un cobro de Valen
 * por un registro de auditoria seria poner el orden al reves. El error
 * se deja en el log del servidor y se sigue.
 */
export type MotivoStock = "compra" | "venta" | "ajuste" | "inicial";

export async function registrarStock(
  sb: SupabaseClient,
  datos: {
    inventario_id: string;
    /** Positivo entra, negativo sale. */
    cantidad: number;
    motivo: MotivoStock;
    nota?: string | null;
    movimiento_id?: string | null;
    stock_resultante?: number | null;
    producto_nombre?: string | null;
    fecha?: string;
  }
): Promise<void> {
  try {
    const { error } = await sb.from("movimientos_stock").insert({
      inventario_id: datos.inventario_id,
      cantidad: datos.cantidad,
      motivo: datos.motivo,
      nota: datos.nota?.trim() || null,
      movimiento_id: datos.movimiento_id ?? null,
      stock_resultante: datos.stock_resultante ?? null,
      producto_nombre: datos.producto_nombre ?? null,
      /* Siempre con fecha de Argentina: el `current_date` por defecto de
         la base es UTC, y un ajuste a las 22 h quedaba con la de mañana. */
      fecha: datos.fecha || hoyEnArgentina(),
    });
    if (error) console.error("[historial-stock]", error.message);
  } catch (e) {
    console.error("[historial-stock]", e instanceof Error ? e.message : e);
  }
}
