import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

/**
 * Las unidades que entran al deposito.
 *
 * Dos motivos, y la diferencia importa:
 *
 *   COMPRA   Valen repuso mercaderia. Suma stock Y deja un movimiento
 *            de plata, porque salio dinero de la caja.
 *   AJUSTE   Conto lo que hay y no coincidia. Solo toca el stock: no
 *            hubo plata de por medio, y anotar un gasto que no existio
 *            le ensucia el balance.
 *
 * El que descuenta es /api/movimientos, cuando se registra una venta.
 */
export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  const id = String(body.inventario_id ?? "");
  const unidades = Math.trunc(Number(body.unidades) || 0);
  const motivo = body.motivo === "ajuste" ? "ajuste" : "compra";

  if (!id) return NextResponse.json({ error: "Falta el producto" }, { status: 400 });
  if (unidades === 0) {
    return NextResponse.json({ error: "Las unidades no pueden ser cero" }, { status: 400 });
  }

  const { data: producto, error: eProducto } = await sesion.sb
    .from("inventario")
    .select("id, marca, producto, codigo, cantidad, costo, costo_usd")
    .eq("id", id)
    .single();
  if (eProducto || !producto) {
    return NextResponse.json({ error: "Ese producto no existe" }, { status: 404 });
  }

  /*
    La suma la hace Postgres sobre la fila, con su candado. Leer,
    sumar y escribir desde aca se pisa si entran dos reposiciones
    juntas, que es el mismo motivo por el que descontar_stock() existe
    desde schema-7.

    Para restar —un ajuste hacia abajo— se manda negativo a
    descontar_stock, que ademas nunca deja el stock bajo cero.
  */
  const { data: cantidadNueva, error: eStock } =
    unidades > 0
      ? await sesion.sb.rpc("sumar_stock", { p_inventario_id: id, p_unidades: unidades })
      : await sesion.sb.rpc("descontar_stock", { p_inventario_id: id, p_unidades: -unidades });

  if (eStock) return fallo("mover el stock", eStock);

  /* Un ajuste no es plata: termina aca. */
  if (motivo === "ajuste") {
    return NextResponse.json({ cantidad: cantidadNueva, movimiento: null });
  }

  /*
    La compra, en pesos y en dolares.

    Si no mandan costo, se usa el que tiene cargado el producto: es lo
    que pasa cuando repone al mismo precio de siempre. Si mandan uno
    distinto, ese manda, porque es lo que efectivamente pago hoy.
  */
  const costoUnitario = body.costo_unitario != null ? Number(body.costo_unitario) : Number(producto.costo) || 0;
  const costoUsdUnitario =
    body.costo_usd_unitario != null && body.costo_usd_unitario !== ""
      ? Number(body.costo_usd_unitario)
      : producto.costo_usd != null
        ? Number(producto.costo_usd)
        : null;
  const cotizacion = body.cotizacion != null && body.cotizacion !== "" ? Number(body.cotizacion) : null;

  const nombre = `${producto.marca} ${producto.producto}`.trim();

  const { data: movimiento, error: eMov } = await sesion.sb
    .from("movimientos")
    .insert({
      fecha: body.fecha || new Date().toISOString().slice(0, 10),
      tipo: "compra_producto",
      categoria: "producto",
      descripcion: `Compra ${unidades} u. de ${nombre}`,
      monto: Math.round(costoUnitario * unidades),
      inventario_id: id,
      unidades,
      /* El nombre congelado: si algun dia Valen borra el producto, el
         movimiento sigue diciendo de que fue. */
      producto_nombre: nombre,
      costo: Math.round(costoUnitario),
      costo_usd: costoUsdUnitario,
      cotizacion,
    })
    .select()
    .single();

  if (eMov) {
    /*
      El stock ya subio y el movimiento no entro. Se avisa en vez de
      callarlo: es mejor que Valen sepa que tiene que cargar el gasto a
      mano y no que el balance quede corto sin que nadie se entere.
    */
    return NextResponse.json(
      {
        cantidad: cantidadNueva,
        movimiento: null,
        aviso:
          "Las unidades entraron al stock, pero no se pudo registrar el gasto. Cargalo a mano desde Economía.",
      },
      { status: 207 }
    );
  }

  return NextResponse.json({ cantidad: cantidadNueva, movimiento }, { status: 201 });
}
