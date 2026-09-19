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
 * Lo que le cuesta cada producto a Valen, EN DOLARES.
 *
 * De la planilla de Lucas del 19-09-2026. Va en dolares y no en pesos
 * porque es lo que ella efectivamente le paga al proveedor: el costo en
 * pesos se mueve con el dolar aunque el producto no haya cambiado de
 * precio, y un costo en pesos escrito hoy miente en tres meses.
 *
 * La clave es el codigo y no el nombre: el nombre se puede editar desde
 * el panel y esto dejaria de matchear en silencio.
 *
 * FALTAN DOS. El Dynasty Cream y el Relief Sun Rice + Niacinamide no
 * estaban en la planilla —son los mismos dos que tampoco tenian precio
 * de venta—. Entran con costo nulo, que el panel muestra como "sin
 * cargar" y no como cero: un cero diria que se los regalan.
 */
const COSTOS_USD = {
  "ARL-SMOO-80ML": 3.5,
  "ARL-SMOO-120ML": 5.5,
  "MDC-ZERO-120G": 14.5,
  "BOJ-GLOW-30ML": 21.5,
  "BOJ-REVI-30ML": 15.0,
  "ALB-PIED-100ML": 21.0,
  "MDC-PDRN-55G": 24.0,
  "MDC-TRIP-50ML": 23.5,
  "MDC-ZERO-50ML": 24.0,
  "AHC-TIME-30ML": 10.0,
  "BOJ-RELIAQUA-50ML": 16.0,
  "ANU-HEAR-30ML": 31.5,
  "VT-CICA-50ML": 20.0,
  "BOJ-REVIEYE-30ML": 15.0,
  "BOJ-RELIPROB-50ML": 16.0,
  "BOJ-GLOW-150ML": 16.0,
  "ANU-PEAC-150ML": 26.0,
  "JMS-MASK-X10": 6.0,
};

/**
 * El dolar con el que se convierte la carga inicial.
 *
 * Sale de la propia planilla, que era consistente: 18.000/11,7 y
 * 62.000/40,3 dan los dos 1.538. Es solo el punto de partida —despues
 * la cotizacion vive en `configuracion` y la cambia Valen— y por eso el
 * costo en pesos que se escribe aca es una foto de hoy, no una verdad
 * permanente. La verdad permanente es el numero en dolares.
 */
const COTIZACION = 1538;

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

for (const p of productos) {
  p.costoUsd = COSTOS_USD[p.codigo] ?? null;
  p.costoArs = p.costoUsd === null ? null : Math.round(p.costoUsd * COTIZACION);
  /* El margen que deja hoy, para poder mirarlo antes de escribir. */
  p.margen =
    p.costoArs && p.precio ? Math.round((p.precio / p.costoArs - 1) * 100) : null;
}

const ancho = Math.max(...productos.map((p) => p.codigo.length));
const $ = (n) => (n ? "$" + n.toLocaleString("es-AR") : "—");
console.log(`\n${productos.length} productos en ${CATALOGO}`);
console.log(`Costos convertidos a $${COTIZACION} por dolar\n`);
console.log(
  "  " + "codigo".padEnd(ancho) + "  costo USD".padStart(10) + "costo $".padStart(11) +
  "venta $".padStart(11) + "margen".padStart(9) + "  estado"
);
for (const p of productos) {
  console.log(
    "  " + p.codigo.padEnd(ancho) +
      (p.costoUsd === null ? "—" : "u$s " + p.costoUsd.toFixed(2)).padStart(10) +
      $(p.costoArs).padStart(11) +
      $(p.precio).padStart(11) +
      (p.margen === null ? "—" : p.margen + "%").padStart(9) +
      "  " + (p.publicado ? "publicado" : "borrador")
  );
}
const sinCosto = productos.filter((p) => p.costoUsd === null);
if (sinCosto.length) {
  console.log(`\n  Sin costo cargado (${sinCosto.length}): ${sinCosto.map((p) => p.codigo).join(", ")}`);
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
      /* El de dolares es el que vale: el de pesos es su equivalente a la
         cotizacion de hoy y Valen lo va a ver recalculado en el panel. */
      costo_usd: p.costoUsd,
      costo: p.costoArs ?? 0,
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
  Entraron con STOCK 0: cuantas unidades hay lo carga Valen desde el
  panel, que es donde lo sabe.

  Los ${sinCosto.length} sin costo quedan con costo_usd nulo y costo 0. La columna
  \`costo\` no admite nulos, asi que el cero no significa "gratis" sino
  "todavia no se cargo": lo que lo distingue es el nulo de al lado.
`);
}
