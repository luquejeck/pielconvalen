/**
 * Lleva los productos del codigo a la base, una sola vez.
 *
 *   npm run productos:cargar            muestra que haria, no toca nada
 *   npm run productos:cargar -- --aplicar   escribe
 *
 * MIRA ANTES DE ESCRIBIR, A PROPOSITO.
 * El entorno local apunta a la base de produccion: no hay staging. Un
 * script que escriba apenas se lo llama es una forma facil de ensuciarle
 * el panel a Valen sin querer. Por eso el modo normal imprime la tabla
 * que va a cargar y sale, y escribir pide decirlo.
 *
 * SE PUEDE CORRER DOS VECES.
 * La clave es el `codigo`, que sale del nombre y la medida y por lo
 * tanto es estable. Si el producto ya esta, se actualiza lo que Valen no
 * toca —categoria, medida, descripcion, beneficios, foto— y NO se pisa
 * lo que si toca: precio de venta, costo, cantidad y publicado. La idea
 * es poder resincronizar el catalogo sin borrarle el trabajo.
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { codigosParaLote } from "../lib/codigo-producto.ts";

const CATALOGO = "lib/productos.ts";
const aplicar = process.argv.includes("--aplicar");

/**
 * Los productos, leidos del codigo.
 *
 * Con expresion regular y no importando el modulo, por lo mismo que
 * hace scripts/preparar-fotos.mjs: es TypeScript y esto es JavaScript
 * suelto. Si algun dia no encuentra nada, avisa en vez de seguir como si
 * el catalogo estuviera vacio y dejar la base a medias.
 */
async function leerCatalogo() {
  const fuente = await readFile(CATALOGO, "utf8");
  const ids = [...fuente.matchAll(/\n\s*id:\s*"([^"]+)"/g)];
  const uno = (bloque, re) => {
    const m = bloque.match(re);
    return m ? m[1] : "";
  };

  const productos = [];
  for (let i = 0; i < ids.length; i++) {
    const desde = ids[i].index;
    const hasta = i + 1 < ids.length ? ids[i + 1].index : fuente.length;
    const b = fuente.slice(desde, hasta);

    const beneficios = (uno(b, /beneficios:\s*\[([^\]]*)\]/s).match(/"[^"]*"/g) || [])
      .map((s) => s.slice(1, -1));

    productos.push({
      slug: ids[i][1],
      marca: uno(b, /\n\s*marca:\s*"([^"]*)"/),
      nombre: uno(b, /\n\s*nombre:\s*"([^"]*)"/),
      medida: uno(b, /\n\s*medida:\s*"([^"]*)"/) || null,
      categoria: uno(b, /\n\s*categoria:\s*"([^"]*)"/),
      precio: Number(uno(b, /\n\s*precio:\s*(\d+)/) || 0),
      descripcion: uno(b, /descripcion:\s*(?:\r?\n\s*)?"([^"]*)"/),
      beneficios,
      destacado: /\n\s*destacado:\s*true/.test(b),
      publicado: !/\n\s*borrador:\s*true/.test(b),
    });
  }

  if (productos.length === 0) {
    throw new Error(
      `No se encontro ningun producto en ${CATALOGO}. Si cambio el formato del archivo, hay que actualizar leerCatalogo().`
    );
  }
  return productos;
}

const productos = await leerCatalogo();
const codigos = codigosParaLote(productos);

/* El orden de la rutina: la posicion que ya tiene dentro de su
   categoria en el archivo. No es alfabetico ni por precio. */
const contador = new Map();
for (const p of productos) {
  const n = (contador.get(p.categoria) ?? 0) + 1;
  contador.set(p.categoria, n);
  p.orden = n * 10; // de a 10 para poder meter uno en el medio sin renumerar
  p.codigo = codigos.get(p);
  /* Las fotos de los 20 de hoy son archivos del repo. Las que suba
     Valen van al bucket y se guardan sin barra inicial: esa barra es lo
     que distingue las dos cosas al leerlas. */
  p.foto = `/imagenes/productos/${p.slug}.webp`;
}

const ancho = Math.max(...productos.map((p) => p.codigo.length));
console.log(`\n${productos.length} productos en ${CATALOGO}\n`);
console.log("  " + "codigo".padEnd(ancho) + "  cat.".padEnd(20) + "precio".padStart(10) + "  estado");
for (const p of productos) {
  console.log(
    "  " +
      p.codigo.padEnd(ancho) +
      "  " +
      p.categoria.slice(0, 17).padEnd(18) +
      (p.precio ? "$" + p.precio.toLocaleString("es-AR") : "—").padStart(10) +
      "  " +
      (p.publicado ? "publicado" : "borrador")
  );
}

if (!aplicar) {
  console.log(`
  Esto es una MUESTRA: no se escribio nada.
  Para cargarlo de verdad:  npm run productos:cargar -- --aplicar
`);
  process.exit(0);
}

/* ------------------------------------------------------------------ */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !CLAVE) {
  console.error(`
  Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
  Salen de .env.local. Sin eso no hay a donde escribir.
`);
  process.exit(1);
}

console.log(`\n  Escribiendo en ${URL}\n`);
const sb = createClient(URL, CLAVE, { auth: { persistSession: false } });

const { data: existentes, error: fallaLectura } = await sb
  .from("inventario")
  .select("id, codigo");
if (fallaLectura) {
  console.error("  No se pudo leer el inventario:", fallaLectura.message);
  console.error("  ¿Corriste supabase/schema-14-productos.sql?");
  process.exit(1);
}

const porCodigo = new Map((existentes ?? []).filter((f) => f.codigo).map((f) => [f.codigo, f.id]));
let nuevos = 0;
let actualizados = 0;

for (const p of productos) {
  /* Lo que se sincroniza siempre: es del catalogo y lo edito yo. */
  const delCatalogo = {
    codigo: p.codigo,
    marca: p.marca,
    producto: p.nombre,
    categoria: p.categoria,
    medida: p.medida,
    descripcion: p.descripcion,
    beneficios: p.beneficios,
    foto: p.foto,
    destacado: p.destacado,
    orden: p.orden,
    actualizado_en: new Date().toISOString(),
  };

  const id = porCodigo.get(p.codigo);
  if (id) {
    /* Existe: NO se tocan precio_venta, costo, cantidad ni publicado.
       Son de Valen y resincronizar no puede borrarle el trabajo. */
    const { error } = await sb.from("inventario").update(delCatalogo).eq("id", id);
    if (error) {
      console.error(`  ${p.codigo}: ${error.message}`);
      process.exit(1);
    }
    actualizados++;
  } else {
    const { error } = await sb.from("inventario").insert({
      ...delCatalogo,
      precio_venta: p.precio,
      costo: 0, // lo carga Valen: el costo no sale del catalogo publico
      cantidad: 0,
      publicado: p.publicado,
    });
    if (error) {
      console.error(`  ${p.codigo}: ${error.message}`);
      process.exit(1);
    }
    nuevos++;
  }
}

console.log(`  ${nuevos} cargados, ${actualizados} actualizados.`);
if (nuevos) {
  console.log(`
  Los nuevos entraron con costo 0 y stock 0: eso lo carga Valen desde
  el panel, que es donde sabe cuanto pago y cuantos tiene.
`);
}
