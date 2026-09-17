/**
 * Prepara las fotos de productos para la web.
 *
 *   npm run fotos          procesa lo que haya en fotos-productos/
 *   npm run fotos:lista    imprime como se tiene que llamar cada archivo
 *
 * Lee los originales de `fotos-productos/` —tal cual salen del celular,
 * pesen lo que pesen— y deja en public/imagenes/productos/<id>.webp la
 * version que usa la web: cuadrada, aclarada y de unos 25 KB.
 *
 * EL NOMBRE DEL ARCHIVO ES LO QUE IDENTIFICA AL PRODUCTO.
 * Una foto llamada `joseon-glow-serum.jpg` es la del Glow Serum. No hay
 * ninguna otra lista que mantener: los ids salen de lib/productos.ts, que
 * es donde ya viven los productos, asi que no hay dos lugares que se
 * puedan desincronizar.
 *
 * POR QUE CUADRADA
 * La ficha es cuadrada y asi entran ocho productos por pantalla de
 * celular; en 4:5 entraban seis. Los envases altos pierden un poco de
 * aire arriba y abajo, y a cambio se ven al lado de los otros doce.
 *
 * POR QUE SE ACLARAN
 * Las fotos de referencia salieron de noche y con flash: el envase queda
 * quemado y el fondo, negro. `normalise` estira el histograma y
 * `modulate` levanta el medio. No arregla una foto mala, pero la deja
 * mirable al lado de las otras. Cuando lleguen fotos sacadas con luz de
 * dia conviene bajar AJUSTE a 0 y que pasen sin tocar.
 */

import { readdir, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ORIGENES = "fotos-productos";
const DESTINO = "public/imagenes/productos";
const CATALOGO = "lib/productos.ts";

/*
  Las imagenes de marca son otra cosa que las de producto y por eso van
  aparte: no son envases sobre una base oscura, son las piezas de marca
  que publica cada casa —el banner de Medicube, la linea completa de
  Beauty of Joseon—. Vienen bien iluminadas y con su propio fondo, asi
  que no se aclaran ni se funden los bordes: se recortan y se achican.

  El nombre del archivo es el slug de la marca, el mismo que arma
  `aSlug()` en lib/productos.ts y el que viaja en /productos?marca=.
*/
const MARCAS_ORIGENES = "fotos-marcas";
const MARCAS_DESTINO = "public/imagenes/marcas";
const MARCAS_LADO = 900;

/** Lado final. El doble del que ocupa la ficha en pantalla, para retina. */
const LADO = 640;

/** 0 = no tocar la luz. 1 = corregir a fondo. */
const AJUSTE = 1;

/** Lo que puede salir de un celular o una camara. */
const EXTENSIONES = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

/**
 * El color al que se funden los bordes.
 *
 * TIENE QUE SER EXACTAMENTE --color-tinta de app/globals.css, que es la
 * base oscura sobre la que se apoya el envase en cada ficha —y el mismo
 * negro teñido de vino que usa el pie de pagina, asi que la tienda no
 * trae un color que la web no tenga. Si los dos valores se separan
 * aparece un halo rectangular alrededor de cada producto.
 */
const TINTA = "29,15,20";

/**
 * La mascara que funde los bordes con la base de la ficha.
 *
 * Son cuatro degrades rectos —uno por lado— y NO un viñeteo redondo.
 *
 * El primer intento fue una elipse. Cerraba bien en las cuatro esquinas
 * y no cerraba en el medio de cada lado: el punto medio del borde de
 * arriba queda a 0,806 del radio, o sea todavia adentro del degrade, y
 * ahi la mascara iba al 58% en vez del 100%. Se medía: ese pixel daba
 * rgb(37,85,100) —el celeste del envase asomando— contra el rgb(29,15,20)
 * del fondo. En pantalla era un rectangulo clarito alrededor de cada
 * producto, justo lo que la mascara venia a evitar. Cerrar la elipse del
 * todo pedia un radio tan chico que se comia medio envase.
 *
 * Cuatro bandas resuelven las dos cosas: cada lado cierra opaco contra su
 * borde y el centro queda intacto. Donde se cruzan, en las esquinas, se
 * suman y cierran antes, que es lo que hace falta ahi.
 *
 * FUNDE es 0,16: la banda mide el 16% del lado. Con menos se veia el
 * corte y con mas empezaba a comerse el envase, que en varias fotos llega
 * bastante al borde.
 */
const FUNDE = 0.16;

const banda = (id, x1, y1, x2, y2) => `
  <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    <stop offset="0%"   stop-color="rgb(${TINTA})" stop-opacity="1"/>
    <stop offset="55%"  stop-color="rgb(${TINTA})" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="rgb(${TINTA})" stop-opacity="0"/>
  </linearGradient>`;

const b = Math.round(LADO * FUNDE);

const mascara = Buffer.from(
  `<svg width="${LADO}" height="${LADO}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       ${banda("arriba", "0", "0", "0", "1")}
       ${banda("abajo", "0", "1", "0", "0")}
       ${banda("izq", "0", "0", "1", "0")}
       ${banda("der", "1", "0", "0", "0")}
     </defs>
     <rect x="0" y="0" width="${LADO}" height="${b}" fill="url(#arriba)"/>
     <rect x="0" y="${LADO - b}" width="${LADO}" height="${b}" fill="url(#abajo)"/>
     <rect x="0" y="0" width="${b}" height="${LADO}" fill="url(#izq)"/>
     <rect x="${LADO - b}" y="0" width="${b}" height="${LADO}" fill="url(#der)"/>
   </svg>`
);

/**
 * Los productos, leidos de lib/productos.ts.
 *
 * Se sacan con una expresion regular y no importando el archivo porque es
 * TypeScript y este script es JavaScript suelto: importarlo pediria un
 * compilador para algo que se usa dos veces al año. La contra es que
 * depende del formato del archivo, asi que si algun dia no encuentra
 * nada, avisa en vez de seguir como si no hubiera productos.
 */
async function leerCatalogo() {
  const fuente = await readFile(CATALOGO, "utf8");
  const productos = [];

  const bloques = fuente.matchAll(
    /id:\s*"([^"]+)",\s*\n\s*marca:\s*"([^"]+)",\s*\n\s*nombre:\s*"([^"]+)"/g
  );
  for (const [, id, marca, nombre] of bloques) {
    productos.push({ id, marca, nombre });
  }

  if (productos.length === 0) {
    throw new Error(
      `No se encontro ningun producto en ${CATALOGO}. ` +
        `Si cambio el formato del archivo, hay que actualizar leerCatalogo().`
    );
  }
  return productos;
}

async function preparar(entrada, id) {
  let img = sharp(entrada).rotate(); // respeta la orientacion del celular

  if (AJUSTE > 0) {
    img = img.normalise().modulate({ brightness: 1 + 0.08 * AJUSTE });
  }

  /*
    Recorte al centro y no `position: "attention"`.

    `attention` busca la zona de mas contraste, y en estas fotos esa zona
    no siempre es el envase: en la del Relief Sun agarro una pata de silla
    iluminada del fondo y dejo la caja cortada al ras. Los envases estan
    centrados en el encuadre, asi que el centro acierta siempre y, sobre
    todo, acierta de forma predecible.
  */
  await img
    .resize(LADO, LADO, { fit: "cover", position: "centre" })
    .composite([{ input: mascara, blend: "over" }])
    .webp({ quality: 82 })
    .toFile(path.join(DESTINO, `${id}.webp`));
}

/**
 * El slug de una marca. Tiene que dar EXACTAMENTE lo mismo que `aSlug()`
 * de lib/productos.ts, que es lo que la web usa para pedir el archivo.
 */
const aSlug = (texto) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Las imagenes de marca: recorte al centro y nada mas.
 *
 * Al centro porque en las cinco el logo esta centrado, y tres de ellas
 * son banners apaisados (Medicube 2,05; AHC 1,78; d'Alba 2,18) que al
 * pasar a cuadrado pierden los costados. El logo se salva siempre; lo
 * que se va es fondo.
 */
async function prepararMarca(entrada, slug) {
  await sharp(entrada)
    .rotate()
    .resize(MARCAS_LADO, MARCAS_LADO, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toFile(path.join(MARCAS_DESTINO, `${slug}.webp`));
}

/* ------------------------------------------------------------------ */

const productos = await leerCatalogo();
const marcas = [...new Set(productos.map((p) => p.marca))];

if (process.argv[2] === "lista") {
  console.log(`\nAsi se tiene que llamar cada archivo en ${ORIGENES}/`);
  console.log(`La extension puede ser ${EXTENSIONES.join(", ")}\n`);
  const ancho = Math.max(...productos.map((p) => p.id.length));
  for (const p of productos) {
    console.log(`  ${p.id.padEnd(ancho)}.jpg   ${p.marca} — ${p.nombre}`);
  }

  console.log(`
Y asi en ${MARCAS_ORIGENES}/ (una por marca)
`);
  const anchoM = Math.max(...marcas.map((m) => aSlug(m).length));
  for (const m of marcas) {
    console.log(`  ${aSlug(m).padEnd(anchoM)}.jpg   ${m}`);
  }
  console.log("");
  process.exit(0);
}

await mkdir(DESTINO, { recursive: true });
await mkdir(ORIGENES, { recursive: true });
await mkdir(MARCAS_DESTINO, { recursive: true });
await mkdir(MARCAS_ORIGENES, { recursive: true });

const archivos = await readdir(ORIGENES);
const porId = new Map();
const sueltos = [];

for (const archivo of archivos) {
  const ext = path.extname(archivo).toLowerCase();
  if (!EXTENSIONES.includes(ext)) continue; // LEEME.md y demas

  const id = path.basename(archivo, path.extname(archivo));
  if (productos.some((p) => p.id === id)) porId.set(id, archivo);
  else sueltos.push(archivo);
}

let listas = 0;
for (const [id, archivo] of porId) {
  await preparar(path.join(ORIGENES, archivo), id);
  listas++;
}

console.log(`\n${listas} de ${productos.length} fotos listas en ${DESTINO}/`);

const faltan = productos.filter((p) => !porId.has(p.id));
if (faltan.length) {
  console.log(`\nSin foto (${faltan.length}):`);
  for (const p of faltan) {
    console.log(`  ${p.id}.jpg   ${p.marca} — ${p.nombre}`);
  }
}

/*
  Los que no coinciden con ningun producto se avisan aparte. Casi siempre
  es un nombre mal escrito, y sin este aviso la foto simplemente no
  aparecia en la web sin que nada dijera por que.
*/
if (sueltos.length) {
  console.log(`\nEstos archivos no coinciden con ningun producto:`);
  for (const a of sueltos) console.log(`  ${a}`);
  console.log(`\n  Corre "npm run fotos:lista" para ver los nombres validos.`);
}

/* --- marcas --------------------------------------------------------- */

const archivosMarca = await readdir(MARCAS_ORIGENES);
let marcasListas = 0;
const marcasSinFoto = [];

for (const m of marcas) {
  const slug = aSlug(m);
  const archivo = archivosMarca.find(
    (a) =>
      path.basename(a, path.extname(a)) === slug &&
      EXTENSIONES.includes(path.extname(a).toLowerCase())
  );
  if (!archivo) {
    marcasSinFoto.push(`${slug}.jpg   ${m}`);
    continue;
  }
  await prepararMarca(path.join(MARCAS_ORIGENES, archivo), slug);
  marcasListas++;
}

console.log(
  `${marcasListas} de ${marcas.length} imagenes de marca listas en ${MARCAS_DESTINO}/`
);

/* La marca sin imagen no rompe nada: el mosaico cae en la foto del
   producto mas caro de esa marca, que es como venia funcionando. */
if (marcasSinFoto.length) {
  console.log(`
Marcas sin imagen propia (${marcasSinFoto.length}):`);
  for (const m of marcasSinFoto) console.log(`  ${m}`);
}

console.log("");
