import { NextRequest, NextResponse } from "next/server";
import { fallo, requerirSesion } from "@/lib/api";
import { obtenerCombos } from "@/lib/catalogo-combos";
import { obtenerProductos } from "@/lib/catalogo-productos";
import { comboComoProducto, resolverCombos } from "@/lib/combos";
import { hayBaseDeDatos } from "@/lib/supabase";
import { clienteServidor } from "@/lib/supabase-servidor";

export const dynamic = "force-dynamic";

/** P-4K7M: el mismo formato que exige la tabla (schema-21). */
const CODIGO = /^P-[A-Z0-9]{4,6}$/;

/**
 * POST /api/pedidos — registra el pedido que la clienta manda por WhatsApp.
 * Body: { codigo, lineas: [{ id, cantidad }] }
 *
 * EL CODIGO LO ARMA EL NAVEGADOR y no este servidor. WhatsApp se abre en
 * el mismo toque del boton, con el codigo ya adentro del mensaje: si se
 * esperara la respuesta de aca para armarlo, el telefono bloquearia la
 * ventana como emergente. Con cuatro caracteres de 32 posibles hay mas
 * de un millon de codigos; si alguna vez se repitiera, la base lo
 * rechaza y el pedido igual viaja por WhatsApp.
 *
 * LOS PRECIOS LOS PONE ESTE SERVIDOR, sacados del catalogo de ahora.
 * Del navegador solo se aceptan que productos y cuantos: un total que
 * llegara escrito desde afuera seria el que cualquiera quisiera.
 */
export async function POST(request: NextRequest) {
  if (!hayBaseDeDatos) return NextResponse.json({ guardado: false, motivo: "sin-base" });

  let cuerpo: { codigo?: unknown; lineas?: unknown };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const codigo = typeof cuerpo.codigo === "string" ? cuerpo.codigo : "";
  const lineas = Array.isArray(cuerpo.lineas) ? cuerpo.lineas : [];
  if (!CODIGO.test(codigo) || lineas.length === 0 || lineas.length > 30) {
    return NextResponse.json({ error: "Pedido invalido" }, { status: 400 });
  }

  const productos = await obtenerProductos();
  const catalogo = [
    ...productos,
    ...resolverCombos(productos, await obtenerCombos()).map(comboComoProducto),
  ];

  const items = lineas.flatMap((l) => {
    const { id, cantidad } = (l ?? {}) as { id?: unknown; cantidad?: unknown };
    const p = catalogo.find((x) => x.id === id);
    const n = Number(cantidad);
    if (!p || !Number.isInteger(n) || n < 1 || n > 20) return [];
    return [{ marca: p.marca, nombre: p.nombre, medida: p.medida ?? null, cantidad: n, precio: p.precio }];
  });
  if (items.length === 0) {
    return NextResponse.json({ error: "Pedido invalido" }, { status: 400 });
  }
  const total = items.reduce((n, i) => n + i.precio * i.cantidad, 0);

  const supabase = await clienteServidor();
  const { error } = await supabase.from("pedidos").insert({ codigo, items, total });
  if (error) return fallo("registrar el pedido", error);

  return NextResponse.json({ guardado: true });
}

/** GET /api/pedidos — los que Valen todavia no cruzo con el WhatsApp. */
export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { data, error } = await sesion.sb
    .from("pedidos")
    .select("id, codigo, items, total, estado, creado_en")
    .eq("estado", "nuevo")
    .order("creado_en", { ascending: false })
    .limit(50);

  if (error) return fallo("traer los pedidos", error);
  return NextResponse.json(data);
}

/** PATCH /api/pedidos?id= — Body: { estado: "recibido" | "no-llego" } */
export async function PATCH(request: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = request.nextUrl.searchParams.get("id");
  const { estado } = (await request.json().catch(() => ({}))) as { estado?: string };
  if (!id || (estado !== "recibido" && estado !== "no-llego")) {
    return NextResponse.json({ error: "Falta el pedido o el estado" }, { status: 400 });
  }

  const { error } = await sesion.sb.from("pedidos").update({ estado }).eq("id", id);
  if (error) return fallo("actualizar el pedido", error);
  return NextResponse.json({ ok: true });
}
