/**
 * Prepara las fotos de productos para la web.
 *
 *   node scripts/preparar-fotos.mjs "<carpeta con los originales>"
 *
 * Lee los originales (lo que sale del celular: JPEG grandes, verticales,
 * con nombre de WhatsApp), los recorta a 4:5, los achica y los guarda
 * como .webp en public/imagenes/productos/<id>.webp.
 *
 * El nombre de salida es el `id` del producto en lib/productos.ts, no el
 * del archivo original: la web pide la foto por id y no le importa como
 * se llamaba el archivo que mando el proveedor.
 *
 * POR QUE 4:5 Y NO CUADRADO
 * Los envases de skincare son casi todos mas altos que anchos. En
 * cuadrado, una caja de serum queda flotando en el medio con aire a los
 * costados; en 4:5 llena la ficha. Las cremas, que son chatas, se ven
 * bien igual porque el recorte va centrado en el envase.
 *
 * POR QUE SE ACLARAN
 * Las fotos de referencia salieron de noche y con flash: el envase queda
 * quemado y el fondo, negro. `normalise` estira el histograma para que el
 * negro sea negro y el blanco, blanco, y `modulate` levanta un poco el
 * medio. No arregla una foto mala, pero la deja mirable al lado de las
 * otras. Cuando lleguen fotos sacadas con luz de dia conviene bajar
 * AJUSTE a 0 y que pasen sin tocar.
 */

import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Ancho final. El doble del que ocupa la ficha en pantalla, para retina.
 *
 * CUADRADO, no 4:5. Con la ficha vertical entraban seis productos por
 * pantalla de celular; en cuadrado la ficha pierde 128px de alto y
 * entran ocho, que es lo que se le pide a una grilla de tienda: poder
 * comparar sin scrollear. Los envases altos —los serums, el Reedle
 * Shot— pierden un poco de aire arriba y abajo, y a cambio se ven al
 * lado de los otros doce.
 */
const ANCHO = 640;
const ALTO = 640;

/** 0 = no tocar la luz. 1 = corregir a fondo. */
const AJUSTE = 1;

/**
 * El color al que se funden los bordes.
 *
 * TIENE QUE SER EXACTAMENTE --color-tienda-escena de app/globals.css,
 * que es la base oscura sobre la que se apoya el envase en cada ficha.
 * Si los dos valores se separan aparece un halo rectangular alrededor de
 * cada producto.
 *
 * El fondo de estas fotos —sacadas de noche contra una mesa oscura— cae
 * entre rgb(23,16,15) y rgb(40,27,24), o sea a un paso de este valor.
 * Fundiendo el borde ahi, la foto deja de ser un rectangulo pegado
 * sobre la ficha y pasa a ser parte de ella.
 *
 * Es ademas lo que empareja las 16: las que salieron con mas luz
 * alrededor (la Dynasty Cream llega a rgb(97,65,75) en las esquinas)
 * mostraban el corte, y ahora terminan todas igual.
 */
const ESCENA = "43,43,46";

/*
  De que archivo sale cada producto.

  Las claves son los nombres que mando Valen por WhatsApp. Se dejan
  escritos tal cual: si manana manda otra tanda, se agrega el par nuevo
  y listo, sin renombrar nada a mano en el explorador de archivos.
*/
const ORIGEN = {
  "WhatsApp Image 2026-09-17 at 16.41.09.jpeg": "medicube-triple-collagen",
  "WhatsApp Image 2026-09-17 at 16.41.17.jpeg": "medicube-zero-pore",
  "WhatsApp Image 2026-09-17 at 16.41.25.jpeg": "medicube-pdrn-pink-collagen",
  "WhatsApp Image 2026-09-17 at 16.41.47.jpeg": "joseon-dynasty-cream",
  "WhatsApp Image 2026-09-17 at 16.41.59.jpeg": "ariul-deep-cera",
  "WhatsApp Image 2026-09-17 at 16.42.28.jpeg": "ariul-deep-clean",
  "WhatsApp Image 2026-09-17 at 16.42.38.jpeg": "medicube-zero-foam",
  "WhatsApp Image 2026-09-17 at 16.42.45.jpeg": "dalba-first-spray-serum",
  "WhatsApp Image 2026-09-17 at 16.42.54.jpeg": "joseon-glow-serum",
  "WhatsApp Image 2026-09-17 at 16.43.02.jpeg": "joseon-revive-serum",
  "WhatsApp Image 2026-09-17 at 16.43.11.jpeg": "anua-heartleaf-ampoule",
  "WhatsApp Image 2026-09-17 at 16.43.20.jpeg": "vt-cica-reedle-shot",
  "WhatsApp Image 2026-09-17 at 16.43.31.jpeg": "joseon-revive-eye-serum",
  "WhatsApp Image 2026-09-17 at 16.43.51.jpeg": "ahc-time-rewind-eye",
  "WhatsApp Image 2026-09-17 at 16.44.03.jpeg": "joseon-relief-sun-aqua",
  "WhatsApp Image 2026-09-17 at 16.44.23.jpeg": "joseon-relief-sun-probiotics",
};

const DESTINO = "public/imagenes/productos";

/**
 * La mascara que funde los bordes con el fondo de la seccion.
 *
 * Son cuatro degrades rectos —uno por lado— y NO un viñeteo redondo.
 *
 * El primer intento fue una elipse. Cerraba bien en las cuatro esquinas
 * y no cerraba en el medio de cada lado: para una foto de 640x800, el
 * punto medio del borde de arriba queda a 0,806 del radio, o sea todavia
 * adentro del degrade, y ahi la mascara iba al 58% en vez del 100%. Se
 * medía: ese pixel daba rgb(37,85,100) —el celeste del envase asomando—
 * contra el rgb(29,15,20) del fondo. En pantalla era un rectangulo
 * clarito alrededor de cada producto, justo lo que la mascara venia a
 * evitar. Cerrar la elipse del todo pedia un radio tan chico que se
 * comia medio envase.
 *
 * Cuatro bandas resuelven las dos cosas: cada lado cierra opaco contra
 * su borde y el centro queda intacto. Donde se cruzan, en las esquinas,
 * se suman y cierran antes, que es lo que hace falta ahi.
 *
 * FUNDE es 0,16: la banda mide el 16% del lado. Con menos se veia el
 * corte y con mas empezaba a comerse el envase, que en varias fotos
 * llega bastante al borde.
 */
const FUNDE = 0.16;

const banda = (x, y, w, h, x1, y1, x2, y2, id) => `
  <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    <stop offset="0%"   stop-color="rgb(${ESCENA})" stop-opacity="1"/>
    <stop offset="55%"  stop-color="rgb(${ESCENA})" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="rgb(${ESCENA})" stop-opacity="0"/>
  </linearGradient>`;

const bx = Math.round(ANCHO * FUNDE);
const by = Math.round(ALTO * FUNDE);

const mascara = Buffer.from(
  `<svg width="${ANCHO}" height="${ALTO}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       ${banda(0, 0, 0, 0, "0", "0", "0", "1", "arriba")}
       ${banda(0, 0, 0, 0, "0", "1", "0", "0", "abajo")}
       ${banda(0, 0, 0, 0, "0", "0", "1", "0", "izq")}
       ${banda(0, 0, 0, 0, "1", "0", "0", "0", "der")}
     </defs>
     <rect x="0" y="0" width="${ANCHO}" height="${by}" fill="url(#arriba)"/>
     <rect x="0" y="${ALTO - by}" width="${ANCHO}" height="${by}" fill="url(#abajo)"/>
     <rect x="0" y="0" width="${bx}" height="${ALTO}" fill="url(#izq)"/>
     <rect x="${ANCHO - bx}" y="0" width="${bx}" height="${ALTO}" fill="url(#der)"/>
   </svg>`
);

async function preparar(entrada, id) {
  const salida = path.join(DESTINO, `${id}.webp`);

  let img = sharp(entrada).rotate(); // respeta la orientacion del celular

  if (AJUSTE > 0) {
    img = img.normalise().modulate({ brightness: 1 + 0.08 * AJUSTE });
  }

  /*
    Recorte al centro y no `position: "attention"`.

    `attention` busca la zona de mas contraste, y en estas fotos esa zona
    no siempre es el envase: en la del Relief Sun agarro una pata de
    silla iluminada del fondo y dejo la caja cortada al ras. Los envases
    estan centrados en el encuadre original, asi que el centro acierta
    siempre y, sobre todo, acierta de forma predecible.
  */
  await img
    .resize(ANCHO, ALTO, { fit: "cover", position: "centre" })
    .composite([{ input: mascara, blend: "over" }])
    .webp({ quality: 82 })
    .toFile(salida);

  return salida;
}

const carpeta = process.argv[2];
if (!carpeta) {
  console.error(
    'Falta la carpeta. Ej: node scripts/preparar-fotos.mjs "C:/Users/lucas/Downloads/fotos"'
  );
  process.exit(1);
}

await mkdir(DESTINO, { recursive: true });

const hay = new Set(await readdir(carpeta));
let listas = 0;
const faltan = [];

for (const [archivo, id] of Object.entries(ORIGEN)) {
  if (!hay.has(archivo)) {
    faltan.push(`${archivo}  ->  ${id}`);
    continue;
  }
  await preparar(path.join(carpeta, archivo), id);
  listas++;
}

console.log(`${listas} fotos listas en ${DESTINO}/`);
if (faltan.length) {
  console.log(`\nNo se encontraron ${faltan.length}:`);
  for (const f of faltan) console.log(`  ${f}`);
}
