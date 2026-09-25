import { NextRequest, NextResponse } from "next/server";
import { fallo, requerirSesion } from "@/lib/api";
import { hoyEnArgentina } from "@/lib/fechas";
import { CODIGO_GIFTCARD, GIFTCARD, sumarMeses } from "@/lib/giftcards";
import { COLUMNAS_GIFTCARD as COLUMNAS, resolverRegalo, texto } from "@/lib/giftcards-servidor";
import { hayBaseDeDatos } from "@/lib/supabase";
import { clienteServidor } from "@/lib/supabase-servidor";

export const dynamic = "force-dynamic";

/**
 * POST /api/giftcards — registra la giftcard que se pide por WhatsApp.
 * Body: { codigo, para, de, mensaje?, tratamientoId? | monto? }
 *
 * Igual que los pedidos: el codigo lo arma el navegador, porque tiene
 * que ir adentro del mensaje que se abre en el mismo toque. Entra como
 * `nueva`: sin cobrar, la tarjeta todavia no sirve para nada.
 */
export async function POST(request: NextRequest) {
  if (!hayBaseDeDatos) return NextResponse.json({ guardado: false, motivo: "sin-base" });

  const cuerpo = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!cuerpo) return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });

  const codigo = typeof cuerpo.codigo === "string" ? cuerpo.codigo : "";
  const para = texto(cuerpo.para, GIFTCARD.largoNombre);
  const de = texto(cuerpo.de, GIFTCARD.largoNombre);
  const mensaje = texto(cuerpo.mensaje, GIFTCARD.largoMensaje);
  const regalo = await resolverRegalo(cuerpo.tratamientoId, cuerpo.monto);

  if (!CODIGO_GIFTCARD.test(codigo) || !para || !de || !regalo) {
    return NextResponse.json({ error: "Giftcard invalida" }, { status: 400 });
  }

  const supabase = await clienteServidor();
  const { error } = await supabase
    .from("giftcards")
    .insert({ codigo, para, de, mensaje: mensaje || null, ...regalo });
  if (error) return fallo("registrar la giftcard", error);

  return NextResponse.json({ guardado: true });
}

/**
 * GET /api/giftcards — todas, las mas nuevas primero.
 * GET /api/giftcards?estado=nueva — las de un estado (el aviso de Turnos).
 * GET /api/giftcards?codigo=G-4K7M9P — una sola, para el cobro del turno.
 */
export async function GET(request: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const codigo = request.nextUrl.searchParams.get("codigo")?.trim().toUpperCase();
  if (codigo) {
    const { data, error } = await sesion.sb
      .from("giftcards")
      .select(COLUMNAS)
      .eq("codigo", codigo)
      .maybeSingle();
    if (error) return fallo("buscar la giftcard", error);
    if (!data) return NextResponse.json({ error: "No hay ninguna giftcard con ese código." }, { status: 404 });
    return NextResponse.json(data);
  }

  let consulta = sesion.sb
    .from("giftcards")
    .select(COLUMNAS)
    .order("creado_en", { ascending: false })
    .limit(300);
  const estado = request.nextUrl.searchParams.get("estado");
  if (estado) consulta = consulta.eq("estado", estado);

  const { data, error } = await consulta;

  if (error) return fallo("traer las giftcards", error);
  return NextResponse.json(data);
}

/**
 * PATCH /api/giftcards?id= — Body: { accion, medioPago? }
 *
 *   cobrar    nueva   -> vigente   Valen recibio la plata. Arranca a
 *                                  correr la vigencia desde hoy.
 *   usar      vigente -> usada     Se uso sin pasar por el cobro de un
 *                                  turno (se lo anoto en otro lado).
 *   anular    nueva o vigente -> anulada
 *   deshacer  el paso de antes, por si se toco sin querer.
 *
 * Cada cambio pide el estado de origen en el mismo `update`: si dos
 * pestañas del panel tocan a la vez, la segunda no pisa a la primera.
 */
export async function PATCH(request: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = request.nextUrl.searchParams.get("id");
  const { accion, medioPago } = (await request.json().catch(() => ({}))) as {
    accion?: string;
    medioPago?: string;
  };
  if (!id) return NextResponse.json({ error: "Falta la giftcard." }, { status: 400 });

  const { data: g, error: eLeer } = await sesion.sb
    .from("giftcards")
    .select("estado, cobrada_el, turno_id")
    .eq("id", id)
    .maybeSingle();
  if (eLeer) return fallo("buscar la giftcard", eLeer);
  if (!g) return NextResponse.json({ error: "Esa giftcard ya no existe." }, { status: 404 });

  const hoy = hoyEnArgentina();
  let desde: string[];
  let cambios: Record<string, unknown>;

  switch (accion) {
    case "cobrar":
      if (!medioPago?.trim()) {
        return NextResponse.json({ error: "Falta cómo te la pagaron." }, { status: 400 });
      }
      desde = ["nueva"];
      cambios = {
        estado: "vigente",
        medio_pago: medioPago.trim().slice(0, 40),
        cobrada_el: hoy,
        vence_el: sumarMeses(hoy, GIFTCARD.vigenciaMeses),
      };
      break;
    case "usar":
      desde = ["vigente"];
      cambios = { estado: "usada", usada_el: hoy };
      break;
    case "anular":
      desde = ["nueva", "vigente"];
      cambios = { estado: "anulada" };
      break;
    case "deshacer":
      /* Una usada en un turno se devuelve deshaciendo ESE cobro: si se
         la reactivara desde aca, el ingreso del turno seguiria diciendo
         que se pago con ella. */
      if (g.estado === "usada" && g.turno_id) {
        return NextResponse.json(
          { error: "Se usó al cobrar un turno. Para devolverla, deshacé el cobro de ese turno." },
          { status: 409 }
        );
      }
      desde = [g.estado];
      cambios =
        g.estado === "usada"
          ? { estado: "vigente", usada_el: null }
          : g.estado === "vigente"
            ? { estado: "nueva", medio_pago: null, cobrada_el: null, vence_el: null }
            : g.estado === "anulada"
              ? { estado: g.cobrada_el ? "vigente" : "nueva" }
              : {};
      break;
    default:
      return NextResponse.json({ error: "No sé qué hacer con esa giftcard." }, { status: 400 });
  }

  if (!desde.includes(g.estado) || Object.keys(cambios).length === 0) {
    return NextResponse.json({ error: "La giftcard ya cambió. Actualizá la página." }, { status: 409 });
  }

  const { data: cambiada, error } = await sesion.sb
    .from("giftcards")
    .update(cambios)
    .eq("id", id)
    .eq("estado", g.estado)
    .select(COLUMNAS)
    .maybeSingle();

  if (error) return fallo("actualizar la giftcard", error);
  if (!cambiada) {
    return NextResponse.json({ error: "La giftcard ya cambió. Actualizá la página." }, { status: 409 });
  }
  return NextResponse.json(cambiada);
}
