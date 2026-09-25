import "server-only";

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fallo } from "./api";
import { obtenerAgenda } from "./catalogo";
import { horariosDelDia } from "./config";
import { desdeClave, hoyEnArgentina } from "./fechas";
import { codigoEnNotas } from "./giftcards";
import { CONSULTA } from "./tratamientos";

type Resultado = { ok: true } | { ok: false; respuesta: NextResponse };

const no = (error: string, status: number): Resultado => ({
  ok: false,
  respuesta: NextResponse.json({ error }, { status }),
});

/** Lo que hace falta saber de la giftcard para darle turno. */
export type GiftcardParaTurno = {
  para: string;
  tratamiento: string | null;
  monto: number;
  turno_id: string | null;
};

/**
 * Darle turno a quien recibio la giftcard, en un horario libre.
 *
 * Si la giftcard ya tiene un turno que todavia no paso, ese turno SE
 * MUEVE al horario nuevo: la persona cambio de dia, no saco otro. Si no
 * tiene, se crea uno confirmado —ya lo arreglo con Valen— a su nombre,
 * con el tratamiento de la giftcard, y queda asociado.
 *
 * El horario lo vuelve a controlar la base: la restriccion unica de
 * (fecha, hora) hace imposible pisar un turno que se tomo mientras
 * Valen elegia.
 */
export async function agendarTurno(
  sb: SupabaseClient,
  giftcardId: string,
  g: GiftcardParaTurno,
  pedido: { fecha?: unknown; hora?: unknown; telefono?: unknown }
): Promise<Resultado> {
  const fecha = typeof pedido.fecha === "string" ? pedido.fecha : "";
  const hora = typeof pedido.hora === "string" ? pedido.hora : "";
  const telefono = typeof pedido.telefono === "string" ? pedido.telefono.trim().slice(0, 40) : "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < hoyEnArgentina()) {
    return no("Elegí un día de hoy en adelante.", 400);
  }
  const agenda = await obtenerAgenda();
  if (!horariosDelDia(agenda, desdeClave(fecha).getDay()).includes(hora)) {
    return no("Ese horario no está en tu agenda.", 400);
  }
  const { data: cerrado } = await sb.from("dias_cerrados").select("fecha").eq("fecha", fecha).maybeSingle();
  if (cerrado) return no("Ese día está cerrado.", 409);

  /* Ya tiene turno: se mueve ese mismo. */
  if (g.turno_id) {
    const { data: movido, error } = await sb
      .from("turnos")
      .update({ fecha, hora, ...(telefono ? { telefono } : {}) })
      .eq("id", g.turno_id)
      .in("estado", ["pendiente", "confirmado"])
      .select("id")
      .maybeSingle();
    if (error?.code === "23505") return no("Ese horario ya está tomado. Elegí otro.", 409);
    if (error) return { ok: false, respuesta: fallo("mover el turno", error) };
    if (movido) return { ok: true };
    /* El turno de antes ya se atendio o no existe: se crea uno nuevo. */
  }

  const { data: nuevo, error } = await sb
    .from("turnos")
    .insert({
      fecha,
      hora,
      estado: "confirmado",
      cliente: g.para,
      telefono: telefono || null,
      tratamiento: g.tratamiento ?? CONSULTA.nombre,
      /* El precio sugerido al cobrar: lo que vale la giftcard. */
      precio: g.monto,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return no("Ese horario ya está tomado. Elegí otro.", 409);
  if (error) return { ok: false, respuesta: fallo("crear el turno", error) };

  const { data: asociada, error: eAsociar } = await sb
    .from("giftcards")
    .update({ turno_id: nuevo.id })
    .eq("id", giftcardId)
    .eq("estado", "vigente")
    .select("id")
    .maybeSingle();

  /* Si la giftcard cambio mientras tanto, el turno no queda suelto. */
  if (eAsociar || !asociada) {
    await sb.from("turnos").delete().eq("id", nuevo.id);
    return eAsociar
      ? { ok: false, respuesta: fallo("asociar el turno", eAsociar) }
      : no("La giftcard ya cambió. Actualizá la página.", 409);
  }
  return { ok: true };
}

/**
 * Cancelar el turno de la giftcard: se borra de la agenda y el horario
 * queda libre. La giftcard sigue vigente, sin turno (la base le saca el
 * `turno_id` sola al borrarse el turno).
 */
export async function cancelarTurno(sb: SupabaseClient, g: GiftcardParaTurno): Promise<Resultado> {
  if (!g.turno_id) return no("Esa giftcard no tiene turno.", 409);
  const { data, error } = await sb
    .from("turnos")
    .delete()
    .eq("id", g.turno_id)
    .in("estado", ["pendiente", "confirmado"])
    .select("id");
  if (error) return { ok: false, respuesta: fallo("cancelar el turno", error) };
  if (!data?.length) return no("Ese turno ya se atendió: no se puede cancelar desde acá.", 409);
  return { ok: true };
}

/**
 * Las reservas hechas desde la tarjeta, asociadas solas.
 *
 * Quien reserva desde /giftcard/G-4K7M9P deja el turno con el codigo en
 * las notas. La web no puede tocar las giftcards (es la clave publica),
 * asi que la asociacion se hace aca, con la sesion de Valen, cada vez
 * que abre Turnos (el aviso de giftcards para cobrar la pide) o
 * Giftcards. Solo si la giftcard esta vigente y todavia no tiene turno:
 * si Valen ya le dio uno, no se pisa.
 */
export async function vincularReservasWeb(sb: SupabaseClient) {
  const { data: turnos } = await sb
    .from("turnos")
    .select("id, notas")
    .like("notas", "Giftcard G-%")
    .in("estado", ["pendiente", "confirmado"])
    .gte("fecha", hoyEnArgentina());

  for (const t of turnos ?? []) {
    const codigo = codigoEnNotas(t.notas);
    if (!codigo) continue;
    await sb
      .from("giftcards")
      .update({ turno_id: t.id })
      .eq("codigo", codigo)
      .eq("estado", "vigente")
      .is("turno_id", null);
  }
}
