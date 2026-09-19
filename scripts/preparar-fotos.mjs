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

import { readdir, mkdir, readFile, writeFile } from "node:fs/promises";
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

/**
 * Lado de la pieza de marca. Lo manda LA TARJETA GRANDE del mosaico.
 *
 * Estuvo en 900 y se veia estirada, porque 900 no le alcanza a la
 * destacada en pantallas densas. Lo que pide cada caso, en pixeles
 * reales (css x densidad):
 *
 *   iPhone Pro Max   92vw de 430 = 396 css  x3 = 1188
 *   iPhone 13/14     92vw de 390 = 359 css  x3 = 1077
 *   Notebook retina  34rem       = 544 css  x2 = 1088
 *
 * Con 900 el navegador estiraba entre un 16% y un 24% justo en la
 * imagen mas grande de la portada. 1600 cubre los tres casos con aire y
 * entra holgado en los originales, que son de 2048.
 *
 * Las tarjetas chicas nunca pasaron de 582 y las fotos de producto de
 * 582 tambien, asi que ninguna de las dos necesitaba esto: LADO se
 * queda donde estaba.
 *
 * El archivo pasa de unos 30 KB a unos 60 KB, y eso NO es lo que baja
 * la clienta: Next sirve la variante del tamaño que pide la pantalla.
 * Lo que cambia es que ahora hay pixeles de donde sacarla.
 */
const MARCAS_LADO = 1600;

/** Lado final. El doble del que ocupa la ficha en pantalla, para retina. */
const LADO = 640;

/**
 * Cuanto se corrige la luz de una foto OSCURA. Las claras no se tocan.
 * 0 = nada, 1 = a fondo.
 */
const AJUSTE = 1;

/**
 * Debajo de este brillo medio de borde, la foto se considera oscura.
 *
 * 140 sobre 255 separa con holgura los dos casos que hay: las fotos de
 * catalogo de las marcas cierran arriba de 240 —fondo blanco— y las que
 * mando Valen por WhatsApp, sacadas de noche, no pasan de 60. No hay
 * nada en el medio, asi que el umbral no es delicado.
 */
const UMBRAL_CLARO = 140;

/** Lo que puede salir de un celular o una camara. */
const EXTENSIONES = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".heic",
  ".heif",
];

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

/** --color-papel: el blanco roto de las tarjetas de la web. */
const PAPEL = "253,251,252";

/**
 * Si la foto es clara o es oscura, mirando el borde.
 *
 * La foto de catalogo de una marca viene recortada sobre blanco y la de
 * Valen sobre una mesa de noche, asi que el borde alcanza y sobra para
 * distinguirlas. Se mide despues de achicar a 32x32, que promedia el
 * ruido y cuesta nada.
 *
 * Esto es lo que permite tener las dos cosas conviviendo mientras se
 * consiguen las fotos que faltan: cada producto se funde al color que le
 * corresponde, y la ficha se pinta de ese mismo color. El dia que entre
 * la ultima foto de catalogo, la grilla queda blanca entera sola, sin
 * tocar una linea de codigo.
 */
async function esClara(entrada) {
  const { data, info } = await sharp(entrada)
    .rotate()
    .resize(32, 32, { fit: "cover" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = info;
  let suma = 0;
  let n = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const enBorde = x < 2 || y < 2 || x >= w - 2 || y >= h - 2;
      if (enBorde) {
        suma += data[y * w + x];
        n++;
      }
    }
  }
  return suma / n >= UMBRAL_CLARO;
}

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

const banda = (id, x1, y1, x2, y2, color) => `
  <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    <stop offset="0%"   stop-color="rgb(${color})" stop-opacity="1"/>
    <stop offset="55%"  stop-color="rgb(${color})" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="rgb(${color})" stop-opacity="0"/>
  </linearGradient>`;

const b = Math.round(LADO * FUNDE);

const mascaraDe = (color) =>
  Buffer.from(
    `<svg width="${LADO}" height="${LADO}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       ${banda("arriba", "0", "0", "0", "1", color)}
       ${banda("abajo", "0", "1", "0", "0", color)}
       ${banda("izq", "0", "0", "1", "0", color)}
       ${banda("der", "1", "0", "0", "0", color)}
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

  /*
    Se parte el archivo en bloques, uno por producto, y recien ahi se
    leen los campos.

    Antes era una sola expresion que pedia `id`, `marca` y `nombre` en
    renglones seguidos. Alcanzaba hasta que a un producto se le puso un
    comentario entre el `id` y la `marca` para explicar por que se
    publica con el nombre de la linea: ese producto desaparecio de la
    lista sin que nada avisara, y con el su marca, asi que ni la foto ni
    la tarjeta de marca se generaron. Partir por bloques deja meter
    comentarios donde haga falta.
  */
  const ids = [...fuente.matchAll(/\n\s*id:\s*"([^"]+)"/g)];

  for (let i = 0; i < ids.length; i++) {
    const desde = ids[i].index;
    const hasta = i + 1 < ids.length ? ids[i + 1].index : fuente.length;
    const bloque = fuente.slice(desde, hasta);

    const marca = bloque.match(/\n\s*marca:\s*"([^"]+)"/);
    const nombre = bloque.match(/\n\s*nombre:\s*"([^"]+)"/);
    if (marca && nombre) {
      productos.push({ id: ids[i][1], marca: marca[1], nombre: nombre[1] });
    }
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
  const clara = await esClara(entrada);
  let img = sharp(entrada).rotate(); // respeta la orientacion del celular

  /* La correccion de luz es solo para las fotos de Valen. Una foto de
     catalogo ya viene medida; `normalise` sobre fondo blanco le comeria
     los grises claros del envase. */
  if (!clara && AJUSTE > 0) {
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
  /* `contain` para las claras y `cover` para las oscuras.

     Una foto de catalogo trae el envase entero y centrado sobre blanco:
     recortarla a cuadrado le corta la tapa o la base. `contain` la mete
     completa y rellena con el mismo blanco del fondo, asi que no se nota
     que sobro lugar. Las de Valen, en cambio, son verticales y con mesa
     alrededor: ahi conviene recortar. */
  await img
    .resize(LADO, LADO, {
      fit: clara ? "contain" : "cover",
      position: "centre",
      background: clara
        ? { r: 253, g: 251, b: 252 }
        : { r: 29, g: 15, b: 20 },
    })
    .composite([{ input: mascaraDe(clara ? PAPEL : TINTA), blend: "over" }])
    .webp({ quality: 82 })
    .toFile(path.join(DESTINO, `${id}.webp`));

  return clara;
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
 * Las imagenes de marca, con la misma deteccion que las de producto.
 *
 * Hay dos clases conviviendo y no se pueden tratar igual:
 *
 *   LOGOS sobre blanco (Medicube, Ariul, AHC). Van con `contain`: el
 *   logo de Ariul es 2:1 y recortarlo a cuadrado le come las puntas de
 *   la firma. Se rellena con el mismo blanco y no se nota que sobro
 *   lugar. Ademas se achica al 70% del cuadro, porque un logo pegado
 *   contra los cuatro bordes se lee como un recorte mal hecho: el aire
 *   alrededor es parte de como se dibujo la marca.
 *
 *   FOTOS (la linea de Beauty of Joseon, el fondo de d'Alba). Van con
 *   `cover`: traen fondo de sobra y el recorte al centro no pierde nada
 *   importante.
 *
 * Cual es cual NO se decide por el brillo del borde, como en los
 * productos: las cinco imagenes de marca son claras, incluida la foto de
 * la linea de Beauty of Joseon, que esta sobre crema. Lo que las separa
 * es cuanto de la imagen es casi blanco: un logo es casi todo fondo
 * —Medicube 94%, Ariul 89%, AHC 90%— y una foto no —Beauty of Joseon 1%,
 * d'Alba 19%. Entre 19 y 89 no hay nada, asi que el 60% del medio es un
 * umbral comodo.
 *
 * Devuelve si es un logo, que es lo que el mosaico necesita saber para
 * escribir el nombre en tinta o en crema.
 */
async function esLogo(entrada) {
  const { data } = await sharp(entrada)
    .rotate()
    .resize(64, 64, { fit: "cover" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let blancos = 0;
  for (const v of data) if (v >= 235) blancos++;
  return blancos / data.length >= 0.6;
}

async function prepararMarca(entrada, slug) {
  const clara = await esLogo(entrada);
  const L = MARCAS_LADO;

  const base = sharp(entrada).rotate();

  const imagen = clara
    ? await base
        .resize(Math.round(L * 0.7), Math.round(L * 0.7), {
          fit: "inside",
          withoutEnlargement: false,
        })
        .toBuffer()
    : await base.resize(L, L, { fit: "cover", position: "centre" }).toBuffer();

  const lienzo = clara
    ? sharp({
        create: {
          width: L,
          height: L,
          channels: 3,
          background: { r: 253, g: 251, b: 252 },
        },
      }).composite([{ input: imagen, gravity: "centre" }])
    : sharp(imagen);

  await lienzo.webp({ quality: 85 }).toFile(
    path.join(MARCAS_DESTINO, `${slug}.webp`)
  );

  return clara;
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
const claras = [];
const oscuras = [];

for (const [id, archivo] of porId) {
  const clara = await preparar(path.join(ORIGENES, archivo), id);
  (clara ? claras : oscuras).push(id);
  listas++;
}

/*
  El manifiesto que lee la ficha para saber de que color pintar la base.

  Se escribe desde aca y no se calcula en la web porque la web no ve los
  originales: solo ve el .webp ya fundido, donde el fondo de origen ya no
  se puede distinguir. Y se guarda como archivo y no a mano en
  lib/productos.ts para que nadie tenga que acordarse de actualizarlo
  cuando cambie una foto: sale del mismo comando que genera la imagen.
*/
await writeFile(
  path.join(DESTINO, "fondos.json"),
  JSON.stringify(
    Object.fromEntries(claras.map((id) => [id, "claro"])),
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`\n${listas} de ${productos.length} fotos listas en ${DESTINO}/`);
console.log(
  `  ${claras.length} sobre fondo claro, ${oscuras.length} sobre fondo oscuro`
);

/* Las oscuras son las que todavia tienen la foto de WhatsApp: son justo
   las que hay que ir a reemplazar, asi que se nombran. */
if (oscuras.length) {
  console.log(`\nTodavia con foto oscura (${oscuras.length}):`);
  for (const id of oscuras) {
    const pr = productos.find((x) => x.id === id);
    console.log(`  ${id}   ${pr.marca} — ${pr.nombre}`);
  }
}

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
const marcasClaras = [];
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
  const clara = await prepararMarca(path.join(MARCAS_ORIGENES, archivo), slug);
  if (clara) marcasClaras.push(slug);
  marcasListas++;
}

await writeFile(
  path.join(MARCAS_DESTINO, "fondos.json"),
  JSON.stringify(
    Object.fromEntries(marcasClaras.map((s) => [s, "claro"])),
    null,
    2
  ) + "\n",
  "utf8"
);

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
