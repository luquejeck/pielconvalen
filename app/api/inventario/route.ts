import { fallo, requerirSesion } from "@/lib/api";
import { codigoDe } from "@/lib/codigo-producto";
import { NextRequest, NextResponse } from "next/server";

/**
 * El producto, entero.
 *
 * `inventario` dejo de ser solo el deposito: ahora es tambien lo que se
 * publica en la web. Por eso esta ruta escribe los dos mundos a la vez
 * —costo y stock por un lado, descripcion y beneficios por el otro— y
 * por eso la lee la pagina publica a traves de la vista
 * `productos_publicos`, que no tiene las columnas de plata.
 *
 * LO QUE ENTRA SE ELIGE A MANO, campo por campo. Pasarle el body crudo
 * a Supabase deja que cualquiera con sesion escriba columnas que la
 * pantalla no muestra —`creado_en`, o el `id`— y eso no se ve hasta que
 * rompe algo.
 */
const camposDe = (body: Record<string, unknown>) => {
  const campos: Record<string, unknown> = {
    marca: body.marca,
    producto: body.producto,
    categoria: body.categoria,
    medida: body.medida || null,
    descripcion: body.descripcion ?? "",
    beneficios: Array.isArray(body.beneficios) ? body.beneficios : [],
    foto: body.foto || null,
    costo: Number(body.costo) || 0,
    precio_venta: Number(body.precio_venta) || 0,
    precio_anterior: body.precio_anterior ? Number(body.precio_anterior) : null,
    cantidad: Number(body.cantidad) || 0,
    publicado: Boolean(body.publicado),
    destacado: Boolean(body.destacado),
    orden: Number(body.orden) || 0,
    actualizado_en: new Date().toISOString(),
  };

  /*
    El costo en dolares admite el vacio y no lo convierte en cero.

    Un cero dice "me sale gratis" y hace que el margen de ese producto
    salga infinito; el nulo dice "todavia no lo cargue", que es lo que
    pasa con los dos que no vinieron en la planilla. Son dos cosas
    distintas y la pantalla las muestra distinto.
  */
  campos.costo_usd =
    body.costo_usd === "" || body.costo_usd === null || body.costo_usd === undefined
      ? null
      : Number(body.costo_usd);

  return campos;
};

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  /* Aca si va el costo: esta ruta pide sesion. La que no lo lleva es la
     vista publica, que es por donde entra la web. */
  const { data, error } = await sesion.sb
    .from("inventario")
    .select("*")
    .order("categoria")
    .order("orden");

  if (error) return fallo("traer el inventario", error);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  if (!body.marca || !body.producto) {
    return NextResponse.json(
      { error: "Falta la marca o el nombre del producto" },
      { status: 400 }
    );
  }

  /*
    EL CODIGO SE ARMA ACA Y NO EN LA PANTALLA.

    Para no repetir uno hay que ver todos los que existen, y eso lo sabe
    el servidor. Si Valen escribio uno a mano se respeta: es un rotulo
    suyo y puede tener razones —un codigo que ya usa en su cuaderno— que
    el generador no conoce.
  */
  let codigo = typeof body.codigo === "string" ? body.codigo.trim() : "";
  if (!codigo) {
    const { data: otros } = await sesion.sb
      .from("inventario")
      .select("codigo, marca, producto, medida");
    codigo = codigoDe(
      { marca: body.marca, nombre: body.producto, medida: body.medida },
      (otros ?? []).map((o) => ({
        marca: o.marca,
        nombre: o.producto,
        medida: o.medida ?? undefined,
        codigo: o.codigo ?? undefined,
      }))
    );
  }

  const { data, error } = await sesion.sb
    .from("inventario")
    .insert({ ...camposDe(body), codigo })
    .select()
    .single();

  if (error) return fallo("guardar el producto", error);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const body = await req.json();
  const campos = camposDe(body);

  /*
    El codigo se edita solo si lo mandan, y NO se recalcula al cambiar
    el nombre. Valen puede tenerlo anotado en una caja o en un cuaderno:
    que se le mueva solo porque corrigio una palabra del nombre es
    exactamente lo que no tiene que pasar.
  */
  if (typeof body.codigo === "string" && body.codigo.trim()) {
    campos.codigo = body.codigo.trim();
  }

  const { data, error } = await sesion.sb
    .from("inventario")
    .update(campos)
    .eq("id", id)
    .select()
    .single();

  if (error) return fallo("guardar los cambios", error);
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  /*
    Se borra el producto y NO sus ventas.

    `movimientos.inventario_id` es `on delete set null`, asi que la
    plata que entro sigue estando en el flujo de caja, con el nombre
    congelado en `producto_nombre`. Un balance que cambia cuando se
    limpia el catalogo no sirve para nada.
  */
  const { error } = await sesion.sb.from("inventario").delete().eq("id", id);
  if (error) return fallo("borrar el producto", error);
  return NextResponse.json({ ok: true });
}
