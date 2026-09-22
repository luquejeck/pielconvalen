/**
 * Los productos de reventa que Valen ofrece por WhatsApp.
 *
 * ESTO YA NO ES EL CATALOGO: ES EL RESPALDO.
 *
 * Desde el 19-09-2026 los productos viven en la tabla `inventario` y
 * Valen los edita desde /admin/productos. La web los lee con
 * `obtenerProductos()` de lib/catalogo-productos.ts.
 *
 * Esta lista queda para un solo caso: que la base no conteste. Ahi la
 * web muestra estos en vez de una pagina vacia. Por eso conviene que no
 * se desactualice del todo —los nombres y los precios se van
 * emparejando cuando se tocan— pero NO es la fuente de la verdad y
 * editar aca no cambia lo que ve nadie.
 *
 * El costo de compra no esta ni va a estar: vive en `inventario`, que
 * pide sesion. Esto es la cara publica.
 */

import { URL_SUPABASE } from "./supabase";
import { formatearPrecio as formatearPesos } from "./tratamientos";

export type Categoria =
  | "Limpiadores"
  | "Tónicos"
  | "Sérums"
  | "Mascarillas"
  | "Cremas"
  | "Contorno de ojos"
  | "Protector solar";

/**
 * El orden en que se recorre el catalogo.
 *
 * No es alfabetico ni por precio: es el orden de la rutina. Primero se
 * limpia, despues se trata, despues se hidrata y al final se protege.
 * Quien esta armando su primera rutina puede leer la pagina de arriba a
 * abajo y lo que le queda es el orden en que se aplica.
 *
 * "TONICOS" YA SE VE; "MASCARILLAS" TODAVIA NO.
 *
 * Las dos entraron el 19-09-2026, con los primeros productos que no
 * eran ni limpiador, ni serum, ni crema. Tonicos aparecio en la web al
 * publicarse el Glow Rice Milk y el Peach 77%. Mascarillas espera a las
 * cinco JM Solution, que estan cargadas y les falta la foto.
 *
 * `porCategoria()` saltea las vacias, asi que una categoria sin
 * productos publicados no dibuja ni pastilla ni seccion.
 */
export const CATEGORIAS: Categoria[] = [
  "Limpiadores",
  "Tónicos",
  "Sérums",
  "Mascarillas",
  "Cremas",
  "Contorno de ojos",
  "Protector solar",
];

/**
 * Las necesidades de piel: como busca quien no conoce las marcas.
 *
 * NO SON LOS BENEFICIOS TAL CUAL. Hay 27 etiquetas de beneficio y casi
 * todas estan en un solo producto: como filtro serian 27 pastillas, la
 * mayoria trayendo una ficha. Y varias no son una necesidad —"Uso
 * diario", "Tres en uno", "Textura liviana" describen el producto, no un
 * problema de la piel—.
 *
 * Asi que se agrupan en cinco, que es como lo diria una clienta: "tengo
 * los poros abiertos", "quiero algo para las arrugas". Cada una junta
 * los beneficios que la resuelven y trae entre dos y cinco productos.
 *
 * Se arman desde `beneficios`, que Valen ya carga en cada producto: un
 * producto nuevo con "Poros" entre sus beneficios aparece solo en
 * "Poros y grasitud", sin tocar nada aca.
 */
export const NECESIDADES: { slug: string; texto: string; beneficios: string[] }[] = [
  {
    slug: "antiedad",
    texto: "Antiedad y firmeza",
    beneficios: ["Firmeza", "Elasticidad", "Antiedad", "Densidad", "Líneas finas", "Reparación", "Contorno"],
  },
  {
    slug: "poros",
    texto: "Poros y grasitud",
    beneficios: ["Poros", "Piel grasa", "Grasitud", "Limpieza profunda"],
  },
  {
    slug: "luminosidad",
    texto: "Luminosidad y textura",
    beneficios: ["Luminosidad", "Manchas", "Tono parejo", "Glass glow", "Textura", "Renovación"],
  },
  {
    slug: "sensible",
    texto: "Piel sensible",
    beneficios: ["Calma", "Piel reactiva", "Piel sensible", "No reseca"],
  },
  {
    slug: "hidratacion",
    texto: "Hidratación",
    beneficios: ["Hidratación", "Nutrición", "Piel seca"],
  },
];

/** Si un producto sirve para una necesidad: comparte algun beneficio. */
export const sirvePara = (p: Producto, slug: string) => {
  const n = NECESIDADES.find((x) => x.slug === slug);
  return Boolean(n && p.beneficios.some((b) => n.beneficios.includes(b)));
};

export type Producto = {
  /**
   * Cuantas unidades quedan. `undefined` = no se sabe.
   *
   * Sale de la base. Los de este archivo son el respaldo y no llevan
   * stock: si la base no contesta, la web no puede saber que hay en el
   * estante y no tiene por que inventar un "sin stock" que espante una
   * venta. Por eso "no se sabe" y "no queda" son dos cosas distintas.
   */
  cantidad?: number;
  /**
   * De los de este archivo, tambien es el nombre de la foto:
   * public/imagenes/productos/<id>.webp. De los que vienen de la base,
   * es el uuid de la fila y la foto va aparte, en `foto`.
   */
  id: string;
  /**
   * El rotulo con el que Valen lo nombra: BOJ-GLOW-30ML. Lo arma
   * lib/codigo-producto.ts y solo lo tienen los que vienen de la base:
   * los de este archivo son el respaldo y no se piden por codigo.
   */
  codigo?: string;
  /**
   * De donde sale la imagen. Con barra adelante es un archivo del repo
   * —"/imagenes/productos/x.webp"—, y sin barra es el nombre de un
   * archivo del bucket, que es como entran las que sube Valen. Esa
   * barra es lo unico que distingue las dos cosas.
   */
  foto?: string;
  marca: string;
  nombre: string;
  /** "50 ml", "120 g". Vacio si no esta confirmada: mejor callar que inventar. */
  medida?: string;
  categoria: Categoria;
  /** En pesos. 0 muestra "Consultar" y manda igual al WhatsApp. */
  precio: number;
  /**
   * Lo que salia antes, para las ofertas. Cargarlo prende solo la
   * etiqueta de descuento y el precio tachado; vacio, la ficha no
   * muestra nada de eso.
   *
   * Es un campo aparte y no un "descuento: 32" a proposito: el numero
   * que la clienta compara es el precio viejo, y el porcentaje se
   * calcula. Al reves, un porcentaje cargado a mano se desincroniza
   * apenas Valen toca el precio.
   */
  precioAnterior?: number;
  /** Dos renglones como mucho: que hace y para quien. */
  descripcion: string;
  /** Para que sirve, en dos o tres palabras. Son las etiquetas de la ficha. */
  beneficios: string[];
  /** Los cuatro que salen en la portada, uno por paso de la rutina. */
  destacado?: boolean;
  /** Se esconde sin borrarlo: falta confirmar precio o descripcion. */
  borrador?: boolean;
};

/*
  AHORA SI SON LOS PRECIOS DE VALEN
  =================================
  Desde el 19-09-2026, 18 de los 20 productos llevan el precio al que
  Valen vende, que paso Lucas en su planilla: la columna "Precio Efectivo
  (ARS)". Antes eran otra cosa —ver mas abajo— y conviene no mezclarlos.

  SOLO SE PUBLICA EL PRECIO DE VENTA.
  La planilla trae tambien el costo de compra en dolares y el margen. Eso
  NO entra aca por la misma razon por la que la tabla `inventario` vive
  detras del login: el costo es de la casa, no de la clienta. Si algun dia
  hace falta tenerlo a mano, va en `inventario`, no en este archivo.

  QUEDA UNO SOLO AFUERA
  El Relief Sun Rice + Niacinamide sigue con el numero del relevamiento,
  $40.000, y por eso esta DESPUBLICADO: no se muestra un precio estimado
  como si fuera definitivo.

  El Dynasty Cream estuvo en la misma situacion hasta que Lucas paso su
  precio real —$65.000, no los $77.000 del relevamiento— y una unidad de
  stock. Volvio a la web con el numero correcto.

  DE DONDE VENIA EL NUMERO ANTES
  Un relevamiento del 18-09-2026 sobre tiendas argentinas de cosmetica
  coreana —SkinFree, K-Beauty Argentina, iFans, Koko, REGY y Mercado
  Libre—, cargando el mas bajo de cada caso. Servia para saber el techo
  antes de quedar cara, no para cobrar.

  Comparado contra lo que Valen efectivamente cobra, el mercado estaba
  arriba en casi todo: la PDRN Pink Collagen bajo de $82.000 a $65.000, la
  Zero Foam de $52.000 a $42.000 y el Revive Serum de $57.000 a $48.000.
  O sea que la web venia pidiendo mas caro de lo que ella cobra.
*/

export const PRODUCTOS: Producto[] = [
  /* ---------------------------------------------------------------- 1. LIMPIAR */
  {
    id: "ariul-deep-clean",
    marca: "Ariul",
    nombre: "Deep Clean Cleansing Foam",
    medida: "80 ml",
    categoria: "Limpiadores",
    precio: 18000,
    descripcion:
      "Limpiador de acción profunda. Levanta el sebo, los restos de maquillaje y el polvo fino con una espuma muy densa.",
    beneficios: ["Piel grasa", "Limpieza profunda"],
  },
  {
    id: "ariul-deep-cera",
    marca: "Ariul",
    nombre: "Deep Cera Cleansing Foam",
    medida: "120 ml",
    categoria: "Limpiadores",
    precio: 22000,
    descripcion:
      "El mismo limpiador, pero con ceramidas: arrastra la suciedad sin dejar la cara tirante.",
    beneficios: ["Piel sensible", "No reseca"],
  },
  {
    id: "medicube-zero-foam",
    marca: "Medicube",
    nombre: "Zero Foam Cleanser",
    medida: "120 g",
    categoria: "Limpiadores",
    precio: 42000,
    descripcion:
      "Espuma de todos los días para destapar poros. Saca el exceso de grasitud y las células muertas sin irritar.",
    beneficios: ["Poros", "Uso diario"],
    destacado: true,
  },

  /* ---------------------------------------------------------------- 2. TRATAR */
  {
    id: "joseon-glow-serum",
    marca: "Beauty of Joseon",
    nombre: "Glow Serum",
    medida: "30 ml",
    categoria: "Sérums",
    precio: 55000,
    descripcion:
      "60% de propóleo y 2% de niacinamida. Para piel apagada o con los poros marcados: calma y empareja el tono.",
    beneficios: ["Luminosidad", "Manchas", "Poros"],
    destacado: true,
  },
  {
    id: "joseon-revive-serum",
    marca: "Beauty of Joseon",
    nombre: "Revive Serum",
    medida: "30 ml",
    categoria: "Sérums",
    precio: 48000,
    descripcion:
      "Ginseng y mucina de caracol. Devuelve elasticidad y repara la barrera de la piel cuando está castigada.",
    beneficios: ["Elasticidad", "Reparación"],
  },
  {
    id: "dalba-first-spray-serum",
    marca: "d'Alba",
    nombre: "White Truffle Spray Serum",
    medida: "100 ml",
    categoria: "Sérums",
    precio: 55000,
    descripcion:
      "Bruma bifásica con trufa blanca. Hace de tónico, sérum e hidratante al mismo tiempo, y se nota al toque.",
    beneficios: ["Luminosidad", "Tres en uno"],
  },

  /* ---------------------------------------------------------------- 3. HIDRATAR */
  {
    id: "medicube-pdrn-pink-collagen",
    marca: "Medicube",
    nombre: "PDRN Pink Collagen Cream",
    medida: "55 g",
    categoria: "Cremas",
    precio: 65000,
    descripcion:
      "Gel con cápsulas de PDRN y niacinamida. Es la más completa de las cuatro: hidrata, da firmeza y deja el efecto glass glow.",
    beneficios: ["Firmeza", "Glass glow", "Tono parejo"],
    destacado: true,
  },
  {
    id: "medicube-triple-collagen",
    marca: "Medicube",
    nombre: "Triple Collagen Cream 4.0",
    medida: "50 ml",
    categoria: "Cremas",
    precio: 65000,
    descripcion:
      "Colágeno triple, elastina y ácido hialurónico. Antiedad: nutre la barrera y sostiene la hidratación.",
    beneficios: ["Antiedad", "Firmeza"],
  },
  {
    id: "medicube-zero-pore",
    marca: "Medicube",
    nombre: "Zero Pore One Day Cream",
    medida: "50 ml",
    categoria: "Cremas",
    precio: 65000,
    descripcion:
      "Hidratante liviana con 5% de pantenol, BHA y niacinamida. Achica el poro dilatado y controla la grasitud.",
    beneficios: ["Poros", "Grasitud"],
  },
  {
    id: "joseon-dynasty-cream",
    marca: "Beauty of Joseon",
    nombre: "Dynasty Cream",
    medida: "50 ml",
    categoria: "Cremas",
    precio: 65000,
    descripcion:
      "29% de agua de salvado de arroz, ginseng y escualano. La más nutritiva, y la que mejor precio tiene.",
    beneficios: ["Nutrición", "Piel seca"],
  },

  /* ---------------------------------------------------------------- 4. OJOS */
  {
    id: "ahc-time-rewind-eye",
    marca: "AHC",
    nombre: "Time Rewind Eye Cream",
    medida: "30 ml",
    categoria: "Contorno de ojos",
    precio: 32000,
    descripcion:
      "Colágeno y elastina para la piel fina del contorno. Se puede usar en toda la cara, no solo en el ojo.",
    beneficios: ["Elasticidad", "Densidad"],
  },

  /* ---------------------------------------------------------------- 5. PROTEGER */
  {
    id: "joseon-relief-sun-probiotics",
    marca: "Beauty of Joseon",
    /*
      SE LLAMA "RICE + NIACINAMIDE" Y NO "RICE + PROBIOTICS".

      Beauty of Joseon reformulo y renombro el producto. El envase que
      habia fotografiado Valen decia "Probiotics" —la formula anterior— y
      la foto de catalogo que entro dice "Niacinamide". El nombre sigue a
      la foto: que la ficha diga una cosa y la imagen otra es lo peor de
      los dos mundos, porque la clienta recibe algo distinto de lo que
      creyo pedir.

      El `id` no se toca: es el nombre del archivo de la foto y la clave
      del pedido guardado en el telefono de cada clienta. Cambiarlo
      romperia las dos cosas por un tema de rotulo.
    */
    nombre: "Relief Sun Rice + Niacinamide",
    medida: "50 ml",
    categoria: "Protector solar",
    precio: 40000,
    descripcion:
      "FPS 50+ PA++++ con 30% de extracto de arroz y niacinamida. El protector que más se pide, y con razón.",
    beneficios: ["FPS 50+", "Sin residuo blanco"],
    /* Oculto tambien aca, igual que en la base: su precio es el del
       relevamiento de mercado, nunca uno de Valen. Si la base no
       contesta, el respaldo no tiene que mostrar lo que la base esconde. */
    borrador: true,
    destacado: true,
  },
  {
    id: "joseon-relief-sun-aqua",
    marca: "Beauty of Joseon",
    nombre: "Relief Sun Aqua-fresh",
    medida: "50 ml",
    categoria: "Protector solar",
    precio: 48000,
    descripcion:
      "La versión fresca del anterior: 30% de agua de arroz y pantenol. Se absorbe al instante y no deja película.",
    beneficios: ["Textura liviana", "Calma"],
  },

  /* ------------------------------------------------------------------------
     SIN DATOS TODAVIA

     Estos tres vinieron en las fotos pero no en la lista de precios y
     descripciones. Los dejo cargados con lo que se lee en la caja para
     que no se pierdan, en borrador: no se muestran en la web hasta que
     tengan precio y descripcion propios.
     --------------------------------------------------------------------- */
  {
    id: "anua-heartleaf-ampoule",
    marca: "Anua",
    nombre: "Heartleaf 80% Ampoule",
    medida: "30 ml",
    categoria: "Sérums",
    precio: 62000,
    descripcion:
      "80% de extracto de heartleaf y pantenol. Calma la piel irritada o reactiva y la hidrata sin dejar sensación pegajosa.",
    beneficios: ["Calma", "Piel reactiva", "Hidratación"],
  },
  {
    id: "vt-cica-reedle-shot",
    /*
      La marca es CICA x HYALON y no VT.

      Tecnicamente es la linea de VT Cosmetics, no la casa. Se publica
      con el nombre de la linea porque es lo que dice el frente del
      envase en letra grande y lo que busca quien ya la conoce; "VT"
      aparece chiquito en un costado. Si algun dia entra otro producto de
      VT que no sea de esta linea, ahi si conviene separarlas.

      El `id` queda como estaba: es el nombre del archivo de la foto y la
      clave del pedido guardado en el telefono de cada clienta. Cambiarlo
      romperia los dos por un tema de rotulo.
    */
    marca: "CICA × HYALON",
    nombre: "Cica Reedle Shot 100",
    medida: "50 ml",
    categoria: "Sérums",
    precio: 62000,
    descripcion:
      "Sérum de primer paso con 95.000 micropartículas. Renueva la piel áspera y las células muertas para dejarla lisa. El 100 es el nivel más suave de la línea.",
    beneficios: ["Textura", "Renovación"],
  },
  {
    id: "joseon-revive-eye-serum",
    marca: "Beauty of Joseon",
    nombre: "Revive Eye Serum",
    medida: "30 ml",
    categoria: "Contorno de ojos",
    precio: 45000,
    descripcion:
      "Ginseng y retinal para la piel fina del contorno. Trabaja las líneas de expresión en la zona más delgada de la cara.",
    beneficios: ["Contorno", "Líneas finas", "Firmeza"],
  },

  /* ------------------------------------------------ BORRADORES 19-09-2026

     Los cuatro salieron de la lista que paso Lucas. Entran en borrador,
     o sea que no se ven en la web: les falta foto, precio y descripcion.

     LA DESCRIPCION Y LOS BENEFICIOS VAN VACIOS A PROPOSITO. Es el mismo
     camino que hizo el Revive Eye Serum, que estuvo en borrador con los
     dos campos en "" hasta que hubo que decir algo cierto sobre el. Un
     texto de relleno escrito de memoria es peor que el vacio: se publica
     sin que nadie lo revise, porque ya parece terminado.
  */
  {
    /*
      OJO CON LOS DOS RELIEF SUN.
      Beauty of Joseon vende las dos formulas y Valen trae las dos, asi
      que son dos fichas y no un cambio de nombre.

      El `id` de la que YA esta publicada dice "probiotics" pero el
      producto es el Rice + Niacinamide: el rotulo cambio despues de que
      se le pusiera nombre al archivo de la foto, y el id no se toca
      porque es la clave del pedido guardado en el telefono de cada
      clienta. Por eso esta, que si es la Probiotics, lleva un id mas
      largo. Mirar el envase de la foto antes de tocar cualquiera de las
      dos: es lo unico que no miente.
    */
    id: "joseon-relief-sun-rice-probiotics",
    marca: "Beauty of Joseon",
    nombre: "Relief Sun Probiotics",
    medida: "50 ml",
    categoria: "Protector solar",
    precio: 48000,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
  {
    id: "joseon-glow-replenishing-rice-milk",
    marca: "Beauty of Joseon",
    nombre: "Glow Replenishing Rice Milk",
    medida: "150 ml",
    categoria: "Tónicos",
    precio: 48000,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
  {
    id: "anua-peach-77-conditioning-milk",
    marca: "Anua",
    nombre: "Peach 77% Conditioning Milk",
    medida: "150 ml",
    categoria: "Tónicos",
    precio: 65000,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
  {
    /*
      PUBLICARLA PIDE DECIDIR QUE SE VENDE.
      La lista dice "Caja x10" y aparte "$3.500 c/u si las vendes
      sueltas": son dos productos distintos para la clienta —una caja y
      una unidad— y la ficha muestra un solo precio. Hasta que eso se
      defina queda en 0, que es "Consultar".

      Ademas es la unica marca del catalogo sin ningun producto
      publicado, asi que el dia que salga hay que sumarle su imagen en
      fotos-marcas/jm-solution.jpg o el mosaico de la portada cae en la
      foto del producto.
    */
    id: "jm-solution-mask",
    marca: "JM Solution",
    nombre: "Mask",
    medida: "Caja x10",
    categoria: "Mascarillas",
    precio: 24000,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
];

/*
  TODAS ESTAS RECIBEN LA LISTA.

  Antes leian PRODUCTOS directo, porque el catalogo era este archivo y
  nada mas. Ahora el catalogo de verdad lo trae `obtenerProductos()`
  desde la base y este archivo es el respaldo, asi que la lista viaja
  como argumento.

  El valor por defecto es PRODUCTOS y no es de adorno: lo usa el
  carrito, que corre en el navegador y no puede leer la base. Si alguna
  pantalla se olvida de pasar la lista, muestra el respaldo en vez de
  romperse, que es el mismo trato que el resto del archivo.
*/

/** Los que se publican. El borrador queda afuera de todo. */
export const productosPublicados = (lista: Producto[] = PRODUCTOS) =>
  lista.filter((p) => !p.borrador);

/** Los de la portada, en el orden de la rutina en que estan cargados. */
/**
 * Cuantos productos muestra la portada como minimo.
 *
 * La fila del carrusel entra de a cuatro en pantalla grande, asi que con
 * menos de cuatro queda media fila vacia y la seccion parece rota. Ocho
 * llena la fila y deja para deslizar.
 */
const MINIMO_EN_PORTADA = 8;

/**
 * Los de la portada: los destacados, completados con el resto.
 *
 * ANTES ERA SOLO `destacado` Y QUEDABA A MERCED DE UNA TILDE.
 * Hoy hay tres productos marcados sobre veintitres publicados: en
 * computadora esos tres ocupaban tres cuartos de la fila y el ultimo
 * cuarto quedaba en blanco. Y si Valen desmarcaba los tres, la seccion
 * de productos de la portada desaparecia entera sin que nada avisara.
 *
 * Marcar destacados sigue sirviendo: son los que van primero. Lo que
 * cambia es que la portada nunca queda a medias por una tilde que
 * alguien puso o saco en el panel.
 */
export function productosDestacados(lista: Producto[] = PRODUCTOS): Producto[] {
  const publicados = productosPublicados(lista);
  const destacados = publicados.filter((p) => p.destacado);
  if (destacados.length >= MINIMO_EN_PORTADA) return destacados;

  /* El relleno respeta el orden del catalogo, que es el de la rutina:
     limpiar, tratar, hidratar, proteger. */
  const resto = publicados.filter((p) => !p.destacado);
  return [...destacados, ...resto].slice(0, MINIMO_EN_PORTADA);
}

/**
 * Si se puede pedir. Sin dato de stock, si.
 *
 * "No se sabe" pasa cuando la base no contesta y la web usa el respaldo
 * de este archivo. Ahi no se puede afirmar que no queda, y frenar una
 * venta por no saber es peor que la venta que despues hay que avisar.
 */
export const hayStock = (p: Producto) => p.cantidad === undefined || p.cantidad > 0;

/** El ultimo: es cierto y apura la decision. */
export const ultimaUnidad = (p: Producto) => p.cantidad === 1;

/** Los que estan en oferta hoy, con su precio de antes tachado. */
export const productosEnOferta = (lista: Producto[] = PRODUCTOS) =>
  productosPublicados(lista).filter((p) => descuentoDe(p) !== null && hayStock(p));

/** Agrupados por categoria, salteando las que quedaron vacias. */
export function porCategoria(
  lista: Producto[] = PRODUCTOS
): { categoria: Categoria; items: Producto[] }[] {
  const publicados = productosPublicados(lista);
  return CATEGORIAS.map((categoria) => ({
    categoria,
    items: publicados.filter((p) => p.categoria === categoria),
  })).filter((grupo) => grupo.items.length > 0);
}

/** Las marcas que hay, ordenadas como se leen. */
export const marcas = (lista: Producto[] = PRODUCTOS) =>
  [...new Set(productosPublicados(lista).map((p) => p.marca))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

/**
 * La imagen del producto, venga de donde venga.
 *
 * Tres casos, y el orden importa:
 *
 *   `foto` con barra adelante  -> archivo del repo, tal cual
 *   `foto` sin barra           -> archivo que subio Valen, al bucket
 *   sin `foto`                 -> los de este archivo, por su id
 *
 * El bucket se arma aca y no se importa de lib/galeria.ts porque ese
 * archivo es `server-only` y esto lo usa el carrito, que corre en el
 * navegador. Es la misma URL: el bucket `casos` es publico.
 */
export const fotoDe = (p: Producto) => {
  if (!p.foto) return `/imagenes/productos/${p.id}.webp`;
  if (p.foto.startsWith("/")) return p.foto;
  return `${URL_SUPABASE}/storage/v1/object/public/casos/${p.foto}`;
};

/** El porcentaje de descuento, o null si el producto no esta en oferta. */
export function descuentoDe(p: Producto): number | null {
  if (!p.precioAnterior || p.precioAnterior <= p.precio) return null;
  return Math.round((1 - p.precio / p.precioAnterior) * 100);
}

export const aSlug = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type MarcaConFoto = {
  nombre: string;
  slug: string;
  cuantos: number;
  /** La foto que la representa: la del producto mas caro de esa marca. */
  foto: string;
};

/**
 * Las marcas para el mosaico, de la que mas productos tiene a la que
 * menos.
 *
 * El orden no es alfabetico porque el mosaico no trata a todas igual: la
 * primera ocupa el doble que las demas. Que ese lugar se lo lleve la
 * marca con mas productos es lo unico que se sostiene solo cuando Valen
 * cargue o saque cosas, sin tener que acordarse de reordenar nada.
 *
 * La foto de cada una es la del producto mas caro: no por el precio en
 * si, sino porque suele ser el envase mas vistoso de la linea.
 */
export function marcasConFoto(lista: Producto[] = PRODUCTOS): MarcaConFoto[] {
  const publicados = productosPublicados(lista);

  return marcas(lista)
    .map((nombre) => {
      const suyos = publicados.filter((p) => p.marca === nombre);
      const cara = suyos.reduce((a, b) => (b.precio > a.precio ? b : a));
      return {
        nombre,
        slug: aSlug(nombre),
        cuantos: suyos.length,
        foto: fotoDe(cara),
      };
    })
    .sort((a, b) => b.cuantos - a.cuantos || a.nombre.localeCompare(b.nombre, "es"));
}

/** Los de una marca, buscada por slug. Vacio si el slug no existe. */
export const productosDeMarca = (slug: string, lista: Producto[] = PRODUCTOS) =>
  productosPublicados(lista).filter((p) => aSlug(p.marca) === slug);

/**
 * El precio como se muestra en la ficha.
 *
 * Reusa el formateador de los tratamientos —misma moneda, mismo
 * redondeo— y solo cambia que dice cuando no hay numero: un tratamiento
 * sin precio es "A convenir" porque se define mirando la piel, y un
 * producto sin precio es "Consultar" porque el numero existe y todavia
 * no esta cargado.
 */
export const precioDe = (p: Producto) =>
  p.precio === 0 ? "Consultar" : formatearPesos(p.precio);
