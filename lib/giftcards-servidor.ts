import "server-only";

import { obtenerTratamientos } from "./catalogo";
import { GIFTCARD } from "./giftcards";

/** Lo que el panel lee de cada giftcard: todo, y el turno asociado. */
export const COLUMNAS_GIFTCARD =
  "id, codigo, para, de, mensaje, tratamiento, monto, estado, medio_pago, cobrada_el, vence_el, usada_el, turno_id, creado_en, turno:turnos(fecha, hora, cliente, estado)";

/** Un texto del formulario, recortado y con tope. Vacio -> "". */
export const texto = (v: unknown, largo: number) =>
  typeof v === "string" ? v.trim().slice(0, largo) : "";

/**
 * Que se regala, con el precio que pone ESTE servidor.
 *
 * Del navegador llega el id del tratamiento o un monto, nunca un precio
 * de tratamiento: un importe que llegara escrito desde afuera seria el
 * que cualquiera quisiera. Lo usa tambien la carga a mano del panel.
 */
export async function resolverRegalo(
  tratamientoId: unknown,
  monto: unknown
): Promise<{ tratamiento: string | null; monto: number } | null> {
  if (typeof tratamientoId === "string" && tratamientoId) {
    const t = (await obtenerTratamientos()).find((x) => x.id === tratamientoId && x.precio > 0);
    return t ? { tratamiento: t.nombre, monto: t.precio } : null;
  }
  const n = Number(monto);
  if (!Number.isInteger(n) || n < GIFTCARD.montoMinimo || n > GIFTCARD.montoMaximo) return null;
  return { tratamiento: null, monto: n };
}
