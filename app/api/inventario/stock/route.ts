import { fallo, requerirSesion } from "@/lib/api";
import { registrarStock } from "@/lib/historial-stock";
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

  const nombre = `${producto.marca} ${producto.producto}`.trim();

  /*
    Un ajuste no es plata: no deja nada en la caja. Pero SI queda en el
    historial, con el motivo que escribio Valen. Es el unico cambio de
    stock que antes no dejaba rastro, y el que mas importa poder mirar
    cuando el numero no coincide con lo que hay en el estante.
  */
  if (motivo === "ajuste") {
    await registrarStock(sesion.sb, {
      inventario_id: id,
      cantidad: unidades,
      motivo: "ajuste",
      nota: typeof body.nota === "string" ? body.nota : null,
      stock_resultante: typeof cantidadNueva === "number" ? cantidadNueva : null,
      producto_nombre: nombre,
    });
    return NextResponse.json({ cantidad: cantidadNueva, movimiento: null });
  }

  /* La cotizacion sale de la base, no del formulario, igual que en las
     ventas: es la vigente el dia de la compra y queda congelada. */
  let cotizacion: number | null =
    body.cotizacion != null && body.cotizacion !== "" ? Number(body.cotizacion) : null;
  if (cotizacion == null) {
    const { data: cfg } = await sesion.sb
      .from("configuracion")
      .select("valor")
      .eq("clave", "cotizacion_usd")
      .maybeSingle();
    cotizacion = cfg?.valor ? Number(cfg.valor) : null;
  }

  /*
    La compra, en pesos y en dolares.

    Si mandan el costo, ese manda: es lo que efectivamente pago hoy.

    Si NO lo mandan, el de pesos se recalcula desde los dolares con la
    cotizacion de hoy, y no se toma el `costo` guardado del producto. Ese
    quedo congelado el dia que se cargo —a 1.538 para los primeros
    veinte— y reponer con el dolar en otro lado anotaria un gasto que no
    es el real. Es justo el desfasaje que llevo a guardar el costo en las
    dos monedas. El `costo` guardado queda de ultimo recurso, para los
    productos que no tienen costo en dolares.
  */
  const costoUsdUnitario =
    body.costo_usd_unitario != null && body.costo_usd_unitario !== ""
      ? Number(body.costo_usd_unitario)
      : producto.costo_usd != null
        ? Number(producto.costo_usd)
        : null;

  const costoUnitario =
    body.costo_unitario != null && body.costo_unitario !== ""
      ? Number(body.costo_unitario)
      : costoUsdUnitario != null && cotizacion
        ? Math.round(costoUsdUnitario * cotizacion)
        : Number(producto.costo) || 0;

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

  /* La compra queda en el historial atada a su gasto en la caja, asi
     desde cualquiera de los dos lados se llega al otro. */
  await registrarStock(sesion.sb, {
    inventario_id: id,
    cantidad: unidades,
    motivo: "compra",
    movimiento_id: movimiento?.id ?? null,
    stock_resultante: typeof cantidadNueva === "number" ? cantidadNueva : null,
    producto_nombre: nombre,
    fecha: body.fecha || undefined,
  });

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
