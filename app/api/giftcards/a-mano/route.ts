import { NextRequest, NextResponse } from "next/server";
import { fallo, requerirSesion } from "@/lib/api";
import { hoyEnArgentina } from "@/lib/fechas";
import { GIFTCARD, nuevoCodigoGiftcard, sumarMeses } from "@/lib/giftcards";
import { COLUMNAS_GIFTCARD, resolverRegalo, texto } from "@/lib/giftcards-servidor";

export const dynamic = "force-dynamic";

/**
 * POST /api/giftcards/a-mano — una giftcard que Valen vende por fuera de
 * la web: en el consultorio, por Instagram, por telefono.
 * Body: { para, de, mensaje?, tratamientoId? | monto?, medioPago? }
 *
 * Con `medioPago` entra ya cobrada; sin el, queda para cobrar, igual que
 * las que llegan por la web. Aca el codigo lo arma el servidor: no hay
 * ningun WhatsApp que lo tenga que llevar en el mismo toque.
 */
export async function POST(request: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!cuerpo) return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });

  const para = texto(cuerpo.para, GIFTCARD.largoNombre);
  const de = texto(cuerpo.de, GIFTCARD.largoNombre);
  const mensaje = texto(cuerpo.mensaje, GIFTCARD.largoMensaje);
  const medioPago = texto(cuerpo.medioPago, 40);
  const regalo = await resolverRegalo(cuerpo.tratamientoId, cuerpo.monto);

  if (!para) return NextResponse.json({ error: "Falta para quién es." }, { status: 400 });
  if (!de) return NextResponse.json({ error: "Falta de parte de quién." }, { status: 400 });
  if (!regalo) {
    return NextResponse.json(
      { error: "Elegí un tratamiento o poné un monto válido." },
      { status: 400 }
    );
  }

  const hoy = hoyEnArgentina();
  const fila = {
    para,
    de,
    mensaje: mensaje || null,
    ...regalo,
    ...(medioPago
      ? {
          estado: "vigente",
          medio_pago: medioPago,
          cobrada_el: hoy,
          vence_el: sumarMeses(hoy, GIFTCARD.vigenciaMeses),
        }
      : {}),
  };

  /* Un codigo repetido lo rechaza la base (23505). Con casi 900
     millones de combinaciones no deberia pasar nunca, pero si pasa se
     prueba con otro en vez de devolver un error. */
  for (let intento = 0; intento < 3; intento++) {
    const { data, error } = await sesion.sb
      .from("giftcards")
      .insert({ ...fila, codigo: nuevoCodigoGiftcard() })
      .select(COLUMNAS_GIFTCARD)
      .single();

    if (!error) return NextResponse.json(data);
    if (error.code !== "23505") return fallo("crear la giftcard", error);
  }
  return NextResponse.json({ error: "No se pudo crear la giftcard. Probá de nuevo." }, { status: 500 });
}
