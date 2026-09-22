import { fallo, requerirSesion } from "@/lib/api";
import { hoyEnArgentina } from "@/lib/fechas";
import { registrarVentaProducto } from "@/lib/venta-producto";
import { NextRequest, NextResponse } from "next/server";

/**
 * Vender un combo.
 *
 * SE GUARDA UNA VENTA POR PRODUCTO Y NO UNA SOLA POR EL COMBO.
 *
 * Un combo de tres productos que se vende como una linea suelta rompe
 * las dos cosas que el panel contesta hoy: el stock de cada producto
 * —hay que descontar uno de cada uno— y la ganancia por producto, que
 * sale de sumar los movimientos que tienen `inventario_id`. Con una
 * linea sola, los tres productos se venderian sin bajar del deposito y
 * la plata quedaria en una bolsa que no pertenece a ninguno.
 *
 * Asi que el combo se reparte: cada producto recibe SU PARTE del precio
 * del combo, en proporcion a lo que vale. El Glow Serum de $48.000
 * dentro de un combo de $88.200 se lleva $48.000/$98.000 de esos
 * $88.200. La suma de las partes da exactamente el precio del combo
 * —la ultima linea absorbe el redondeo—, asi que la caja cierra.
 *
 * Es tambien la unica forma honesta de calcular el margen: el descuento
 * lo paga cada producto en la medida en que participa, y no el ultimo
 * de la lista.
 *
 * EL PRECIO LO CALCULA EL SERVIDOR, con los precios de hoy y el
 * descuento del combo, igual que la web. El formulario puede mandar un
 * total distinto —si Valen cobro otra cosa— y entonces se reparte ese.
 */
const aCentena = (n: number) => Math.floor(n / 100) * 100;

type Linea = {
  inventario_id: string;
  nombre: string;
  precio: number;
  parte: number;
};

export async function POST(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();
  const comboId = body.combo_id;
  if (!comboId) return NextResponse.json({ error: "Falta el combo" }, { status: 400 });

  const unidades = Math.max(1, Number(body.unidades) || 1);
  const fecha = body.fecha || hoyEnArgentina();

  const { data: combo, error } = await sesion.sb
    .from("combos")
    .select("id, nombre, descuento, combo_productos(orden, inventario:inventario(id, marca, producto, precio_venta))")
    .eq("id", comboId)
    .maybeSingle();

  if (error) return fallo("traer el combo", error);
  if (!combo) return NextResponse.json({ error: "No existe ese combo" }, { status: 404 });

  type FilaCombo = {
    orden: number;
    inventario: { id: string; marca: string; producto: string; precio_venta: number | null } | null;
  };

  const productos = ((combo.combo_productos ?? []) as unknown as FilaCombo[])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((l) => l.inventario)
    .filter(Boolean) as NonNullable<FilaCombo["inventario"]>[];

  if (productos.length < 2) {
    return NextResponse.json(
      { error: "El combo tiene menos de dos productos" },
      { status: 400 }
    );
  }

  const suma = productos.reduce((n, p) => n + (p.precio_venta ?? 0), 0);
  if (suma <= 0) {
    return NextResponse.json(
      { error: "Los productos del combo no tienen precio cargado" },
      { status: 400 }
    );
  }

  /* El total de UN combo. El de la pantalla manda, si vino. */
  const total = Number(body.precio) > 0 ? Math.round(Number(body.precio)) : aCentena(suma * (1 - combo.descuento / 100));

  /*
    El reparto. Todas las partes menos la ultima se redondean al peso;
    la ultima es el resto, asi la suma da EXACTO el total del combo.
    Sin eso, tres redondeos hacia arriba hacen que la caja diga un peso
    mas de lo que Valen cobro.
  */
  const lineas: Linea[] = productos.map((p, i) => {
    const precio = p.precio_venta ?? 0;
    const parte =
      i < productos.length - 1 ? Math.round((total * precio) / suma) : 0;
    return { inventario_id: p.id, nombre: `${p.marca} ${p.producto}`.trim(), precio, parte };
  });
  lineas[lineas.length - 1].parte = total - lineas.slice(0, -1).reduce((n, l) => n + l.parte, 0);

  const guardadas = [];
  for (const l of lineas) {
    const { movimiento, error: e } = await registrarVentaProducto(sesion.sb, {
      inventario_id: l.inventario_id,
      unidades,
      monto: l.parte * unidades,
      /* La descripcion dice de que combo salio: en el flujo de caja se
         ven tres lineas del mismo dia y hay que poder reconocerlas. */
      descripcion: `Combo ${combo.nombre} · ${l.nombre}`,
      fecha,
      medio_pago: body.medio_pago ?? null,
      cliente_id: body.cliente_id ?? null,
    });
    /*
      Si una linea falla, las anteriores YA ENTRARON. Se corta y se
      avisa cuales quedaron, en vez de seguir como si nada: es plata y
      stock, y Valen tiene que poder mirar que paso. Un rollback de
      verdad pide una transaccion, que PostgREST no da desde aca.
    */
    if (e) {
      return NextResponse.json(
        {
          error: `Se registraron ${guardadas.length} de ${lineas.length} productos del combo. Revisá Caja.`,
        },
        { status: 500 }
      );
    }
    guardadas.push(movimiento);
  }

  return NextResponse.json({ total: total * unidades, lineas: guardadas }, { status: 201 });
}
