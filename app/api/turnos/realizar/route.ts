import { fallo, requerirSesion } from "@/lib/api";
import { obtenerTratamientos } from "@/lib/catalogo";
import { hoyEnArgentina } from "@/lib/fechas";
import { CODIGO_GIFTCARD, fechaConAnio, MEDIO_GIFTCARD } from "@/lib/giftcards";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * "Atendida y cobrada" — el boton que le saca dos cargas de encima.
 *
 * Antes, un turno atendido eran tres viajes: aceptarlo en Turnos, volver
 * a escribirlo como ingreso en Economia, y volver a escribirlo como
 * sesion en la ficha de la clienta. Los datos ya estaban todos en la
 * fila del turno.
 *
 * El trabajo pesado lo hace `registrar_turno_realizado` en la base, para
 * que las tres escrituras entren juntas o no entre ninguna: un ingreso
 * cargado con el turno sin marcar seria peor que no hacer nada.
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { turnoId, monto, medioPago, notas, tratamientoId, giftcard } = await req.json();

  if (!turnoId) {
    return NextResponse.json({ error: "Falta el turno." }, { status: 400 });
  }

  const importe = Number(monto);
  if (!Number.isFinite(importe) || importe < 0) {
    return NextResponse.json(
      { error: "El monto cobrado no es válido." },
      { status: 400 }
    );
  }

  /*
    PAGADO CON GIFTCARD: la giftcard queda usada en este turno.

    Va primero, antes de tocar el turno: si el codigo no sirve, Valen se
    entera sin que nada haya cambiado. Y si despues el cobro falla, se
    devuelve a vigente, para que no quede gastada en un turno que no se
    cobro.
  */
  let giftcardUsada: string | null = null;
  if (medioPago === MEDIO_GIFTCARD) {
    const uso = await usarGiftcard(sesion.sb, giftcard, turnoId);
    if (!uso.ok) return uso.respuesta;
    giftcardUsada = uso.id;
  }

  /*
    Que tratamiento se hizo.

    Los turnos de la web entran todos como consulta, asi que el nombre
    real lo pone Valen recien aca. Se escribe ANTES de cobrar porque el
    ingreso y la sesion se arman con lo que dice la fila del turno: si se
    guardara despues, en Economia quedaria "Consulta y Evaluación
    Facial".

    El nombre y el precio salen del catalogo del servidor y no del
    navegador, igual que en el alta publica.

    El `is("movimiento_id", null)` es el seguro: un turno ya cobrado no
    se toca, ni siquiera el nombre del tratamiento, porque el movimiento
    que ya se emitio diria otra cosa. Si estaba cobrado, esta linea no
    cambia nada y la funcion de abajo devuelve el 409 de siempre.
  */
  if (tratamientoId) {
    const tratamiento = (await obtenerTratamientos()).find(
      (t) => t.id === tratamientoId
    );

    if (tratamiento) {
      const { error: falloTratamiento } = await sesion.sb
        .from("turnos")
        .update({ tratamiento: tratamiento.nombre, precio: tratamiento.precio })
        .eq("id", turnoId)
        .is("movimiento_id", null);

      if (falloTratamiento) {
        await devolverGiftcard(sesion.sb, giftcardUsada);
        return fallo("guardar el tratamiento", falloTratamiento);
      }
    }
  }

  const { data, error } = await sesion.sb.rpc("registrar_turno_realizado", {
    p_turno_id: turnoId,
    p_monto: Math.round(importe),
    p_medio_pago: medioPago || null,
    p_notas: notas?.trim() || null,
  });

  if (error) {
    await devolverGiftcard(sesion.sb, giftcardUsada);

    // P0001 = ya estaba cobrado. Es informacion util, no un error tecnico.
    if (error.code === "P0001" || error.code === "P0002") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    // 42883 / PGRST202 = falta correr schema-8 en Supabase.
    if (error.code === "42883" || error.code === "PGRST202") {
      return NextResponse.json(
        { error: "Falta correr schema-8-tanda2.sql en Supabase." },
        { status: 501 }
      );
    }
    return fallo("registrar el cobro", error);
  }

  return NextResponse.json({ movimientoId: data });
}

/** Deshace el cobro: borra el ingreso y la sesion, y vuelve a confirmado. */
export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const turnoId = req.nextUrl.searchParams.get("turnoId");
  if (!turnoId) {
    return NextResponse.json({ error: "Falta el turno." }, { status: 400 });
  }

  const { error } = await sesion.sb.rpc("anular_turno_realizado", {
    p_turno_id: turnoId,
  });

  if (error) return fallo("deshacer el cobro", error);

  /* Si se pago con giftcard, vuelve a estar vigente: el turno ya no la
     usa. Sin la tabla (schema-22 sin correr) no hay nada que devolver,
     y el cobro ya se deshizo igual. */
  await sesion.sb
    .from("giftcards")
    .update({ estado: "vigente", usada_el: null, turno_id: null })
    .eq("turno_id", turnoId)
    .eq("estado", "usada");

  return NextResponse.json({ ok: true });
}

type Uso =
  | { ok: true; id: string }
  | { ok: false; respuesta: NextResponse };

/**
 * Marca la giftcard como usada en este turno, en un solo `update` que
 * pide que este vigente: dos cobros a la vez con el mismo codigo no
 * pueden gastarla los dos.
 *
 * Una vencida se acepta. Que la tome o no lo decide Valen, que la tiene
 * enfrente: el formulario ya le mostro la fecha antes de confirmar.
 */
async function usarGiftcard(sb: SupabaseClient, crudo: unknown, turnoId: string): Promise<Uso> {
  const codigo = typeof crudo === "string" ? crudo.trim().toUpperCase() : "";
  const no = (error: string, status: number): Uso => ({
    ok: false,
    respuesta: NextResponse.json({ error }, { status }),
  });

  if (!CODIGO_GIFTCARD.test(codigo)) {
    return no("Poné el código de la giftcard, como G-4K7M9P.", 400);
  }

  const { data: usada, error } = await sb
    .from("giftcards")
    .update({ estado: "usada", usada_el: hoyEnArgentina(), turno_id: turnoId })
    .eq("codigo", codigo)
    .eq("estado", "vigente")
    .select("id")
    .maybeSingle();

  // 42P01 / PGRST205 = la tabla no existe: falta correr schema-22.
  if (error?.code === "42P01" || error?.code === "PGRST205") {
    return no("Falta correr schema-22-giftcards.sql en Supabase.", 501);
  }
  if (error) return { ok: false, respuesta: fallo("usar la giftcard", error) };
  if (usada) return { ok: true, id: usada.id };

  /* No estaba vigente: se busca por que, para decirlo con palabras. */
  const { data: g } = await sb
    .from("giftcards")
    .select("estado, usada_el")
    .eq("codigo", codigo)
    .maybeSingle();

  if (!g) return no(`No hay ninguna giftcard con el código ${codigo}.`, 404);
  if (g.estado === "nueva") {
    return no(`La giftcard ${codigo} todavía no está cobrada. Marcala como cobrada en Giftcards.`, 409);
  }
  if (g.estado === "usada") {
    return no(
      `La giftcard ${codigo} ya se usó${g.usada_el ? ` el ${fechaConAnio(g.usada_el)}` : ""}.`,
      409
    );
  }
  return no(`La giftcard ${codigo} está anulada.`, 409);
}

/** Si el cobro no llego a entrar, la giftcard vuelve a estar vigente. */
async function devolverGiftcard(sb: SupabaseClient, id: string | null) {
  if (!id) return;
  await sb
    .from("giftcards")
    .update({ estado: "vigente", usada_el: null, turno_id: null })
    .eq("id", id);
}
