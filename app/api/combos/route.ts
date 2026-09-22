import type { SupabaseClient } from "@supabase/supabase-js";
import { fallo, requerirSesion } from "@/lib/api";
import { aSlug } from "@/lib/productos";
import { NextRequest, NextResponse } from "next/server";

/**
 * Los combos del panel.
 *
 * Un combo es un nombre, un descuento y una lista de productos. El
 * precio NO se guarda: lo calcula la web sumando lo que valen hoy sus
 * productos. Por eso aca nunca hay un numero de plata.
 *
 * LOS PRODUCTOS VIAJAN COMO IDS Y SE GUARDAN EN `combo_productos`.
 * La pantalla manda la lista entera —es como se piensa un combo, no de
 * a uno— y el servidor la reemplaza completa: borra las lineas viejas y
 * escribe las nuevas. Asi no hay forma de que quede una linea de un
 * producto que Valen ya saco.
 */
type Body = {
  nombre?: string;
  descripcion?: string;
  descuento?: number;
  publicado?: boolean;
  orden?: number;
  productos?: string[];
};

const LIMITE = 6;

/**
 * El slug, unico, a partir del nombre.
 *
 * Es la clave con la que el combo viaja en el carrito guardado en el
 * telefono de la clienta, asi que se calcula UNA vez, al crearlo, y no
 * se vuelve a tocar aunque despues le cambien el nombre: cambiarlo
 * vaciaria el pedido a medio armar de quien lo tenga abierto.
 */
async function slugLibre(sb: SupabaseClient, nombre: string): Promise<string> {
  const base = aSlug(nombre) || "combo";
  const { data } = await sb.from("combos").select("slug");
  const usados = new Set((data ?? []).map((c: { slug: string }) => c.slug));
  if (!usados.has(base)) return base;
  for (let i = 2; i < 100; i++) if (!usados.has(`${base}-${i}`)) return `${base}-${i}`;
  return `${base}-${Date.now()}`;
}

/** Lo que se puede escribir, campo por campo. Nunca el body crudo. */
function camposDe(body: Body) {
  const campos: Record<string, unknown> = {};
  if ("nombre" in body) campos.nombre = String(body.nombre ?? "").trim();
  if ("descripcion" in body) campos.descripcion = String(body.descripcion ?? "").trim();
  if ("descuento" in body) {
    /* La base tiene un check de 1 a 90; se recorta antes para que un
       error de tipeo no vuelva como "violates check constraint". */
    campos.descuento = Math.min(90, Math.max(1, Math.round(Number(body.descuento) || 0)));
  }
  if ("publicado" in body) campos.publicado = Boolean(body.publicado);
  if ("orden" in body) campos.orden = Number(body.orden) || 0;
  return campos;
}

/** Reemplaza la lista de productos de un combo. */
async function guardarProductos(sb: SupabaseClient, comboId: string, ids: string[]) {
  await sb.from("combo_productos").delete().eq("combo_id", comboId);
  const limpios = [...new Set(ids.filter(Boolean))].slice(0, LIMITE);
  if (limpios.length === 0) return null;
  const { error } = await sb
    .from("combo_productos")
    .insert(limpios.map((inventario_id, orden) => ({ combo_id: comboId, inventario_id, orden })));
  return error;
}

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  /* Con sus productos en una sola consulta: la pantalla los necesita
     para dibujar el combo y calcular lo que sale. */
  const { data, error } = await sesion.sb
    .from("combos")
    .select("*, combo_productos(inventario_id, orden)")
    .order("orden");

  if (error) return fallo("traer los combos", error);

  const combos = (data ?? []).map((c: { combo_productos?: { inventario_id: string; orden: number }[] }) => ({
    ...c,
    productos: (c.combo_productos ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((l) => l.inventario_id),
  }));
  return NextResponse.json(combos);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = (await req.json()) as Body;
  const nombre = String(body.nombre ?? "").trim();
  if (!nombre) return NextResponse.json({ error: "Ponele un nombre al combo" }, { status: 400 });

  const slug = await slugLibre(sesion.sb, nombre);
  const { data, error } = await sesion.sb
    .from("combos")
    .insert({ ...camposDe(body), nombre, slug })
    .select()
    .single();

  if (error) return fallo("guardar el combo", error);

  const errorProductos = await guardarProductos(sesion.sb, data.id, body.productos ?? []);
  if (errorProductos) return fallo("guardar los productos del combo", errorProductos);

  return NextResponse.json({ ...data, productos: body.productos ?? [] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = (await req.json()) as Body;

  /*
    Igual que en productos: un PATCH toca solo lo que le mandan. El
    boton de publicar manda `{ publicado }` y no tiene por que acordarse
    del nombre, el descuento y la lista de productos.
  */
  const campos = camposDe(body);
  if (Object.keys(campos).length > 0) {
    campos.actualizado_en = new Date().toISOString();
    const { error } = await sesion.sb.from("combos").update(campos).eq("id", id);
    if (error) return fallo("guardar el combo", error);
  }

  if (Array.isArray(body.productos)) {
    const errorProductos = await guardarProductos(sesion.sb, id, body.productos);
    if (errorProductos) return fallo("guardar los productos del combo", errorProductos);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  /* Las lineas de `combo_productos` se van solas: `on delete cascade`.
     No se borra ningun producto, obvio: el combo es una agrupacion. */
  const { error } = await sesion.sb.from("combos").delete().eq("id", id);
  if (error) return fallo("borrar el combo", error);
  return NextResponse.json({ ok: true });
}
