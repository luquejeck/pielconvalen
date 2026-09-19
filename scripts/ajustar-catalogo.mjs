/**
 * Los tres ajustes que decidio Lucas el 19-09-2026.
 *
 *   npm run catalogo:ajustar              muestra, no toca nada
 *   npm run catalogo:ajustar -- --aplicar escribe
 *
 * 1. Las cinco JM Solution, en lugar del "Mask" generico.
 * 2. Despublicar los dos que no vende.
 * 3. Escribirles el texto a los tres que tiene en stock y publicarlos.
 *
 * Es de una sola vez: no esta pensado para volver a correrse salvo que
 * algo haya fallado a mitad de camino, y en ese caso es idempotente.
 */

import { createClient } from "@supabase/supabase-js";

const aplicar = process.argv.includes("--aplicar");
const MARCA_JM = "JM Solution";

/**
 * Las cinco cajas que trajo el remito.
 *
 * Son dos lineas de la marca —"The Effect" y "Be Nature"— y el nombre
 * las conserva porque es lo que dice la caja y lo que Valen va a
 * buscar. Entran en borrador: falta la foto de cada una, y publicar
 * cinco fichas sin imagen al lado de dieciseis que si la tienen se ve
 * peor que no publicarlas.
 *
 * Precio y costo salen de la planilla, donde la fila de JM Solution
 * decia "(todas)": el mismo numero para las cinco.
 */
/*
  EL CODIGO VA A MANO Y NO POR EL GENERADOR.

  El generador arma el codigo con la primera palabra del nombre, y aca
  las primeras palabras son el nombre de la LINEA —"The Effect", "Be
  Nature"—, no del producto. Salian JMS-EFFERETI-X10 y JMS-BEBAKU-X10:
  unicos, largos y sin decir cual es cual.

  Lo que las distingue es el activo, que ademas es como las nombra
  Valen: "la de retinol", "la de calendula". Por eso el codigo es ese.
  La API respeta el codigo escrito a mano justamente para esto.
*/
const JM_SOLUTION = [
  ["JMS-RETI-X10", "The Effect Retinol & Firming Mask", "Retinol en mascarilla, para trabajar la firmeza sin resecar. Diez unidades, una por sesión."],
  ["JMS-PDRN-X10", "The Effect PDRN & Barrier Mask", "PDRN para reforzar la barrera de la piel. Va bien después de un tratamiento o cuando la piel quedó sensible."],
  ["JMS-CERA-X10", "The Effect Ceramide Nourishing Mask", "Ceramidas para la piel que tira. Nutre sin dejar la cara pesada."],
  ["JMS-BAKU-X10", "Be Nature Bakuchiol & Firming Mask", "Bakuchiol, la alternativa suave al retinol. Firmeza para piel que no tolera el retinol clásico."],
  ["JMS-CALE-X10", "Be Nature Calendula & Calming Mask", "Caléndula para la piel irritada o roja. La mascarilla de calmar."],
];
const JM_PRECIO = 24000;
const JM_COSTO_USD = 6.0;
const JM_STOCK = 1; // una caja de cada una, del remito

/** Los que no vende: salen de la web sin borrarse. */
const DESPUBLICAR = ["BOJ-DYNA-50ML", "BOJ-RELINIAC-50ML"];

/**
 * Los tres que tiene en stock y estaban sin texto.
 *
 * La descripcion sigue el tono de las otras dieciseis: que hace y para
 * quien, en dos renglones, sin adjetivos de folleto.
 */
const A_PUBLICAR = {
  "BOJ-RELIPROB-50ML": {
    descripcion:
      "FPS 50+ PA++++ con 30% de extracto de arroz y probióticos. La fórmula original de la línea, para uso diario.",
    beneficios: ["FPS 50+", "Sin residuo blanco"],
  },
  "BOJ-GLOW-150ML": {
    descripcion:
      "Leche de arroz para después de limpiar. Hidrata y empareja el tono sin la sensación pegajosa de una crema.",
    beneficios: ["Hidratación", "Luminosidad", "Uso diario"],
  },
  "ANU-PEAC-150ML": {
    descripcion:
      "77% de extracto de durazno con niacinamida. Repara la barrera y deja la piel suave; va después del limpiador.",
    beneficios: ["Barrera", "Suavidad", "Textura"],
  },
};

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !CLAVE) {
  console.error("\n  Faltan las claves de Supabase en .env.local\n");
  process.exitCode = 1;
}

const sb = createClient(URL, CLAVE, { auth: { persistSession: false } });
const { data: enBase, error } = await sb
  .from("inventario")
  .select("id, codigo, marca, producto, medida, cantidad, publicado, descripcion");

if (error) {
  console.error("  No se pudo leer el inventario:", error.message);
  process.exitCode = 1;
}

const porCodigo = new Map(enBase.filter((f) => f.codigo).map((f) => [f.codigo, f]));

console.log();
console.log("  1. LAS CINCO JM SOLUTION");
console.log();
const aCrear = [];
for (const [codigo, nombre, descripcion] of JM_SOLUTION) {
  const existe = porCodigo.has(codigo);
  console.log(`  ${codigo.padEnd(18)} ${existe ? "ya existe" : "crear   "}  ${nombre}`);
  if (!existe) aCrear.push({ codigo, nombre, descripcion });
}
const generico = porCodigo.get("JMS-MASK-X10");
if (generico) {
  console.log(`\n  Y se borra el generico JMS-MASK-X10 ("${generico.producto}"), que lo reemplazan las cinco.`);
  if (generico.cantidad > 0) console.log(`  OJO: tiene ${generico.cantidad} de stock. No se borra.`);
}

console.log("\n  2. DESPUBLICAR\n");
for (const c of DESPUBLICAR) {
  const f = porCodigo.get(c);
  console.log(`  ${c.padEnd(18)} ${f ? (f.publicado ? "publicado -> borrador" : "ya estaba en borrador") : "NO EXISTE"}  ${f?.producto ?? ""}`);
}

console.log("\n  3. ESCRIBIR Y PUBLICAR\n");
for (const [c, datos] of Object.entries(A_PUBLICAR)) {
  const f = porCodigo.get(c);
  if (!f) { console.log(`  ${c.padEnd(18)} NO EXISTE`); continue; }
  console.log(`  ${c.padEnd(18)} ${f.cantidad} u.  ${f.producto.slice(0, 34)}`);
  console.log(`  ${" ".repeat(18)} ${datos.beneficios.join(" · ")}`);
}

if (!aplicar) {
  console.log(`\n  MUESTRA: no se escribio nada.\n  Para aplicarlo:  npm run catalogo:ajustar -- --aplicar\n`);
} else {
  let n = 0;
  const fallar = (que, e) => { console.error(`  ${que}: ${e.message}`); process.exitCode = 1; };

  for (const { codigo, nombre, descripcion } of aCrear) {
    const { error: e } = await sb.from("inventario").insert({
      codigo,
      marca: MARCA_JM,
      producto: nombre,
      categoria: "Mascarillas",
      medida: "Caja x10",
      descripcion,
      beneficios: ["Mascarilla", "Caja x10"],
      costo_usd: JM_COSTO_USD,
      costo: Math.round(JM_COSTO_USD * 1538),
      precio_venta: JM_PRECIO,
      cantidad: JM_STOCK,
      publicado: false, // falta la foto
      destacado: false,
      orden: 10 + n * 10,
      actualizado_en: new Date().toISOString(),
    });
    if (e) fallar(codigo, e); else n++;
  }

  if (generico && generico.cantidad === 0) {
    const { error: e } = await sb.from("inventario").delete().eq("id", generico.id);
    if (e) fallar("borrar JMS-MASK-X10", e);
  }

  for (const c of DESPUBLICAR) {
    const f = porCodigo.get(c);
    if (!f) continue;
    const { error: e } = await sb
      .from("inventario")
      .update({ publicado: false, actualizado_en: new Date().toISOString() })
      .eq("id", f.id);
    if (e) fallar(c, e);
  }

  for (const [c, datos] of Object.entries(A_PUBLICAR)) {
    const f = porCodigo.get(c);
    if (!f) continue;
    const { error: e } = await sb
      .from("inventario")
      .update({ ...datos, publicado: true, actualizado_en: new Date().toISOString() })
      .eq("id", f.id);
    if (e) fallar(c, e);
  }

  console.log(`\n  ${n} JM Solution creadas, ${DESPUBLICAR.length} despublicados, ${Object.keys(A_PUBLICAR).length} publicados.\n`);
}
