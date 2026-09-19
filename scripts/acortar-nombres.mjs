/**
 * Acorta los nombres de producto y corrige el Dynasty Cream.
 *
 *   npm run nombres:corregir              muestra, no toca nada
 *   npm run nombres:corregir -- --aplicar escribe
 *
 * POR QUE SE ACORTAN.
 * En celular la ficha mide 161 px y el titulo entra en dos renglones,
 * o sea unos 34 caracteres contando la marca. Diez de los diecisiete
 * productos pasaban de ahi y quedaban cortados con puntos suspensivos,
 * justo en la parte que los distingue: "Beauty of Joseon Revive Eye
 * Ser…" no dice si es el de ojos o el otro.
 *
 * Lo que sobra casi siempre es el nombre de la LINEA —"Smooth & Pure",
 * "The Effect"— o palabras de relleno del fabricante: "Real", "For
 * Face", "Moisture Soothing". Sacarlas no pierde nada que la clienta
 * necesite y deja el nombre entero a la vista.
 *
 * LO QUE NO SE TOCA: el codigo. Valen puede tenerlo anotado en una caja
 * y no puede moverse porque se corrigio un rotulo. Por eso esto escribe
 * directo y no pasa por la API, que tampoco lo recalcularia.
 *
 * Se actualiza la base Y lib/productos.ts, que es el respaldo: si algun
 * dia la base no contesta, la web tiene que mostrar los mismos nombres
 * y no los largos de antes.
 */

import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const aplicar = process.argv.includes("--aplicar");
const CATALOGO = "lib/productos.ts";

/** codigo -> [nombre nuevo, id en lib/productos.ts] */
const NOMBRES = {
  "ARL-SMOO-80ML": ["Deep Clean Cleansing Foam", "ariul-deep-clean"],
  "ARL-SMOO-120ML": ["Deep Cera Cleansing Foam", "ariul-deep-cera"],
  "ANU-HEAR-30ML": ["Heartleaf 80% Ampoule", "anua-heartleaf-ampoule"],
  "MDC-PDRN-55G": ["PDRN Pink Collagen Cream", "medicube-pdrn-pink-collagen"],
  "AHC-TIME-30ML": ["Time Rewind Eye Cream", "ahc-time-rewind-eye"],
  "BOJ-REVIEYE-30ML": ["Revive Eye Serum", "joseon-revive-eye-serum"],
  "BOJ-RELIAQUA-50ML": ["Relief Sun Aqua-fresh", "joseon-relief-sun-aqua"],
  "BOJ-RELIPROB-50ML": ["Relief Sun Probiotics", "joseon-relief-sun-rice-probiotics"],
  /* Lucas lo llamo "White Truffle" las dos veces que paso la lista, y es
     lo que dice el frente del envase. "Piedmont" es la linea. */
  "ALB-PIED-100ML": ["White Truffle Spray Serum", "dalba-first-spray-serum"],
  /* Las cinco mascarillas: se va el nombre de la linea. Lo que las
     separa es el activo, que ademas es como las pide la clienta. */
  "JMS-RETI-X10": ["Retinol & Firming Mask", null],
  "JMS-PDRN-X10": ["PDRN & Barrier Mask", null],
  "JMS-CERA-X10": ["Ceramide Nourishing Mask", null],
  "JMS-BAKU-X10": ["Bakuchiol & Firming Mask", null],
  "JMS-CALE-X10": ["Calendula & Calming Mask", null],
};

/**
 * El Dynasty Cream vuelve.
 *
 * Se habia despublicado porque no tenia precio propio, ni costo, ni
 * stock: las tres señales decian que no se vendia. Lucas confirma que
 * si, con una unidad y a 65.000 —no los 77.000 del relevamiento de
 * mercado, que era el ultimo numero inventado que quedaba en la web—.
 *
 * El costo sigue sin cargarse, asi que el margen va a salir vacio en el
 * panel hasta que Valen lo ponga.
 */
const DYNASTY = { codigo: "BOJ-DYNA-50ML", precio_venta: 65000, cantidad: 1, publicado: true };

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !CLAVE) {
  console.error("\n  Faltan las claves de Supabase en .env.local\n");
  process.exitCode = 1;
}
const sb = createClient(URL, CLAVE, { auth: { persistSession: false } });

const { data: enBase, error } = await sb
  .from("inventario")
  .select("id, codigo, marca, producto, precio_venta, cantidad, publicado");
if (error) {
  console.error("  No se pudo leer:", error.message);
  process.exitCode = 1;
}
const porCodigo = new Map(enBase.filter((f) => f.codigo).map((f) => [f.codigo, f]));

console.log();
console.log("  NOMBRES (el limite en celular es ~34 con la marca)");
console.log();
const cambios = [];
for (const [codigo, [nuevo]] of Object.entries(NOMBRES)) {
  const f = porCodigo.get(codigo);
  if (!f) {
    console.log("  " + codigo.padEnd(19) + "NO EXISTE");
    continue;
  }
  const antes = `${f.marca} ${f.producto}`;
  const despues = `${f.marca} ${nuevo}`;
  const yaEsta = f.producto === nuevo;
  console.log(`  ${codigo.padEnd(19)} ${String(antes.length).padStart(3)} -> ${String(despues.length).padStart(3)}  ${yaEsta ? "ya estaba" : despues}`);
  if (!yaEsta) cambios.push({ id: f.id, nuevo, codigo });
}

console.log();
console.log("  DYNASTY CREAM");
console.log();
const d = porCodigo.get(DYNASTY.codigo);
if (d) {
  console.log(`  precio    ${d.precio_venta} -> ${DYNASTY.precio_venta}`);
  console.log(`  stock     ${d.cantidad} -> ${DYNASTY.cantidad}`);
  console.log(`  en la web ${d.publicado ? "si" : "no"} -> si`);
} else {
  console.log("  NO EXISTE");
}

if (!aplicar) {
  console.log(`\n  MUESTRA: no se escribio nada.\n  Para aplicarlo:  npm run nombres:corregir -- --aplicar\n`);
} else {
  for (const c of cambios) {
    const { error: e } = await sb
      .from("inventario")
      .update({ producto: c.nuevo, actualizado_en: new Date().toISOString() })
      .eq("id", c.id);
    if (e) {
      console.error(`  ${c.codigo}: ${e.message}`);
      process.exitCode = 1;
    }
  }
  if (d) {
    const { error: e } = await sb
      .from("inventario")
      .update({ ...DYNASTY, codigo: undefined, actualizado_en: new Date().toISOString() })
      .eq("id", d.id);
    if (e) {
      console.error(`  Dynasty: ${e.message}`);
      process.exitCode = 1;
    }
  }

  /* El respaldo del codigo, para que diga lo mismo si la base falla. */
  let fuente = await readFile(CATALOGO, "utf8");
  let tocados = 0;
  for (const [, [nuevo, id]] of Object.entries(NOMBRES)) {
    if (!id) continue;
    const i = fuente.indexOf(`id: "${id}"`);
    if (i === -1) continue;
    const fin = fuente.indexOf("\n  },", i);
    const bloque = fuente.slice(i, fin);
    const reemplazado = bloque.replace(/(\n\s*nombre:\s*)"[^"]*"/, `$1"${nuevo}"`);
    if (reemplazado !== bloque) {
      fuente = fuente.slice(0, i) + reemplazado + fuente.slice(fin);
      tocados++;
    }
  }
  await writeFile(CATALOGO, fuente, "utf8");

  console.log(`\n  ${cambios.length} nombres en la base, ${tocados} en ${CATALOGO}, y el Dynasty corregido.\n`);
}
