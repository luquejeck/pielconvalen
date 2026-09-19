/**
 * Carga el stock real contado por Valen.
 *
 *   npm run stock:cargar              muestra el cruce, no toca nada
 *   npm run stock:cargar -- --aplicar escribe
 *
 * Igual que la carga de productos: muestra antes de escribir, porque la
 * base es la de produccion y no hay staging.
 *
 * POR QUE FIJA Y NO SUMA.
 * Esto es un recuento, no una compra: el numero que paso Valen es lo
 * que HAY en el estante hoy. Sumarlo al que ya estaba duplicaria el
 * stock si el comando se corre dos veces. Para reponer mercaderia esta
 * /api/inventario/stock, que si suma y ademas anota el gasto.
 */

import { createClient } from "@supabase/supabase-js";

const aplicar = process.argv.includes("--aplicar");

/**
 * El remito de Valen, mapeado a los codigos del catalogo.
 *
 * La clave es el codigo y el texto de al lado es como figura en el
 * remito, para poder revisarlo a ojo sin abrir otra pantalla.
 */
const CONTADO = [
  ["BOJ-RELIAQUA-50ML", 3, "BOJ RELIEF SUN AQUA-FRESH RICE + B5 50 ML"],
  ["BOJ-RELIPROB-50ML", 3, "BOJ RELIEF SUN: RICE + PROBIOTICS 50 ML"],
  ["ANU-PEAC-150ML", 1, "ANUA PEACH 77% NIACIN CONDITIONING MILK 150 ML"],
  ["ARL-SMOO-120ML", 3, "ARIUL SMOOTH & PURE DEEP CERA CLEANSING FOAM 120 ML"],
  ["ARL-SMOO-80ML", 3, "ARIUL SMOOTH & PURE DEEP CLEAN CLEANSING FOAM 80 ML"],
  ["BOJ-GLOW-150ML", 1, "BOJ GLOW REPLENISHING RICE MILK 150 ML"],
  ["BOJ-REVIEYE-30ML", 3, "BOJ REVIVE EYE SERUM GINSENG + RETINAL 30 ML"],
  ["MDC-ZERO-120G", 2, "MEDICUBE ZERO PORE FOAM CLEANSER 120 ML"],
  ["MDC-ZERO-50ML", 3, "MEDICUBE ZERO PORE ONE DAY CREAM 50 ML"],
  ["MDC-TRIP-50ML", 3, "MEDICUBE TRIPLE COLLAGEN CREAM 4.0 50 ML"],
  ["ANU-HEAR-30ML", 4, "ANUA HEARTLEAF 80% SOOTHING AMPOULE 30 ML"],
  ["ALB-PIED-100ML", 2, "D ALBA WHITE TRUFFLE FIRST SPRAY SERUM 100 ML"],
  ["BOJ-REVI-30ML", 4, "BOJ REVIVE SERUM GINSENG + SNAIL MUCIN 30 ML"],
  ["BOJ-GLOW-30ML", 4, "BOJ GLOW SERUM PROPOLIS + NIACINAMIDE 30 ML"],
  ["VT-CICA-50ML", 3, "VT REEDLESHOT 100 50 ML"],
  ["AHC-TIME-30ML", 3, "AHC TIME REWIND REAL EYE CREAM FOR FACE 30 ML"],
  ["MDC-PDRN-55G", 2, "MEDICUBE PDRN PINK COLLAGEN CAPSULE CREAM 55 G"],
];

/**
 * Las cinco cajas de JM Solution del remito.
 *
 * En el catalogo hay UN solo producto, "Mask", cargado en borrador
 * cuando todavia no sabiamos cuales eran. El remito muestra que son
 * cinco variantes distintas, una caja de cada una. Son cinco SKU y no
 * cinco nombres del mismo: la clienta elige cual quiere.
 *
 * No se cargan desde aca porque crear productos es otra cosa que contar
 * stock. Se listan para que se vea que faltan.
 */
const JM_SOLUTION = [
  ["The Effect Retinol & Firming", 1],
  ["The Effect PDRN & Barrier", 1],
  ["The Effect Ceramide Nourishing", 1],
  ["Be Nature Bakuchiol & Firming", 1],
  ["Be Nature Calendula & Calming", 1],
];

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !CLAVE) {
  console.error("\n  Faltan las claves de Supabase en .env.local\n");
  process.exit(1);
}
const sb = createClient(URL, CLAVE, { auth: { persistSession: false } });

const { data: enBase, error } = await sb
  .from("inventario")
  .select("id, codigo, marca, producto, cantidad, precio_venta, costo_usd, publicado");
if (error) {
  console.error("  No se pudo leer el inventario:", error.message);
  process.exit(1);
}

const porCodigo = new Map(enBase.filter((f) => f.codigo).map((f) => [f.codigo, f]));
const w = (s, n) => String(s).padEnd(n);

console.log("\n  EL RECUENTO\n");
console.log("  " + w("codigo", 19) + w("hoy", 5) + w("queda", 7) + "producto");
const cambios = [];
for (const [codigo, unidades, texto] of CONTADO) {
  const fila = porCodigo.get(codigo);
  if (!fila) {
    console.log("  " + w(codigo, 19) + "NO EXISTE EN EL CATALOGO — " + texto);
    continue;
  }
  console.log("  " + w(codigo, 19) + w(fila.cantidad, 5) + w("-> " + unidades, 7) + fila.producto.slice(0, 38));
  if (fila.cantidad !== unidades) cambios.push({ id: fila.id, codigo, unidades });
}

const contados = new Set(CONTADO.map(([c]) => c));
const sinContar = enBase.filter((f) => f.codigo && !contados.has(f.codigo) && f.codigo !== "JMS-MASK-X10");
if (sinContar.length) {
  console.log("\n  NO APARECEN EN EL REMITO (quedan en 0)\n");
  for (const f of sinContar) {
    const señales = [
      f.precio_venta ? null : "sin precio",
      f.costo_usd == null ? "sin costo" : null,
      "sin stock",
    ].filter(Boolean);
    console.log("  " + w(f.codigo, 19) + w(f.producto.slice(0, 32), 34) + señales.join(", "));
  }
}

console.log("\n  LAS JM SOLUTION SON CINCO, NO UNA\n");
console.log("  En el catalogo hay un solo 'Mask' en borrador. El remito trae:");
for (const [nombre, u] of JM_SOLUTION) console.log(`    ${u} caja  JM Solution ${nombre}`);
console.log("  Son cinco SKU distintos: hay que crearlos antes de poder contarlos.");

const total = CONTADO.reduce((n, [, u]) => n + u, 0);
console.log(`\n  ${total} unidades en ${CONTADO.length} productos, mas 5 cajas de JM Solution.`);

if (!aplicar) {
  console.log(`
  MUESTRA: no se escribio nada.
  Para aplicarlo:  npm run stock:cargar -- --aplicar
`);
} else {
  let hechos = 0;
  for (const c of cambios) {
    const { error: e } = await sb
      .from("inventario")
      .update({ cantidad: c.unidades, actualizado_en: new Date().toISOString() })
      .eq("id", c.id);
    if (e) {
      console.error(`  ${c.codigo}: ${e.message}`);
      process.exitCode = 1;
      break;
    }
    hechos++;
  }
  console.log(`
  ${hechos} productos actualizados.
`);
}

/*
  Se sale con `process.exitCode` y no con `process.exit()`.

  El segundo corta el proceso con los handles de la conexion todavia
  abiertos, y Node tira un "Assertion failed" de libuv que parece un
  error grave y no es nada. Dejarlo asi haria dudar de una carga que
  salio bien.
*/
