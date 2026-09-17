/**
 * Los productos de reventa que Valen ofrece por WhatsApp.
 *
 * NO es la tabla `inventario` del panel. Esa guarda el costo de compra y
 * el stock, y vive detras del login por algo: el costo no se publica.
 * Esto es la cara publica —lo que la clienta ve y elige— y por ahora vive
 * en el codigo, igual que TRATAMIENTOS_POR_DEFECTO.
 *
 * Cuando haga falta que Valen los edite sin tocar el codigo, el camino ya
 * esta marcado por `lib/catalogo.ts`: tabla en Supabase, y esta lista
 * queda de respaldo para que la web nunca se quede sin catalogo.
 */

import { formatearPrecio as formatearPesos } from "./tratamientos";

export type Categoria =
  | "Limpiadores"
  | "Sérums"
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
 */
export const CATEGORIAS: Categoria[] = [
  "Limpiadores",
  "Sérums",
  "Cremas",
  "Contorno de ojos",
  "Protector solar",
];

export type Producto = {
  /** Tambien es el nombre de la foto: public/imagenes/productos/<id>.webp */
  id: string;
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
  ATENCION — PRECIOS PROVISORIOS
  ------------------------------
  Los numeros de abajo son el punto medio del rango estimado que vino en
  la lista, redondeado al mil. NO son precios que haya fijado Valen.

  El rango original salia de convertir lo que sale el producto en
  YesStyle, eBay o Target, y en varios casos era enorme: la Triple
  Collagen iba de $43.000 a $62.000, o sea un 44% de diferencia entre
  una punta y la otra.

  Antes de publicar esta pagina hay que reemplazarlos por la lista de
  precios de venta reales. Mientras tanto sirven para ver la grilla con
  numeros verosimiles y para probar el largo de cada ficha.
*/

export const PRODUCTOS: Producto[] = [
  /* ---------------------------------------------------------------- 1. LIMPIAR */
  {
    id: "ariul-deep-clean",
    marca: "Ariul",
    nombre: "Smooth & Pure Deep Clean Cleansing Foam",
    categoria: "Limpiadores",
    precio: 21000,
    descripcion:
      "Limpiador de acción profunda. Levanta el sebo, los restos de maquillaje y el polvo fino con una espuma muy densa.",
    beneficios: ["Piel grasa", "Limpieza profunda"],
  },
  {
    id: "ariul-deep-cera",
    marca: "Ariul",
    nombre: "Smooth & Pure Deep Cera Cleansing Foam",
    categoria: "Limpiadores",
    precio: 21000,
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
    precio: 37000,
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
    categoria: "Sérums",
    precio: 25000,
    descripcion:
      "60% de propóleo y 2% de niacinamida. Para piel apagada o con los poros marcados: calma y empareja el tono.",
    beneficios: ["Luminosidad", "Manchas", "Poros"],
    destacado: true,
  },
  {
    id: "joseon-revive-serum",
    marca: "Beauty of Joseon",
    nombre: "Revive Serum",
    categoria: "Sérums",
    precio: 25000,
    descripcion:
      "Ginseng y mucina de caracol. Devuelve elasticidad y repara la barrera de la piel cuando está castigada.",
    beneficios: ["Elasticidad", "Reparación"],
  },
  {
    id: "dalba-first-spray-serum",
    marca: "d'Alba",
    nombre: "Piedmont First Spray Serum",
    categoria: "Sérums",
    precio: 39000,
    descripcion:
      "Bruma bifásica con trufa blanca. Hace de tónico, sérum e hidratante al mismo tiempo, y se nota al toque.",
    beneficios: ["Luminosidad", "Tres en uno"],
  },

  /* ---------------------------------------------------------------- 3. HIDRATAR */
  {
    id: "medicube-pdrn-pink-collagen",
    marca: "Medicube",
    nombre: "PDRN Pink Collagen Capsule Cream",
    medida: "55 g",
    categoria: "Cremas",
    precio: 72000,
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
    precio: 52000,
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
    precio: 42000,
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
    precio: 31000,
    descripcion:
      "29% de agua de salvado de arroz, ginseng y escualano. La más nutritiva, y la que mejor precio tiene.",
    beneficios: ["Nutrición", "Piel seca"],
  },

  /* ---------------------------------------------------------------- 4. OJOS */
  {
    id: "ahc-time-rewind-eye",
    marca: "AHC",
    nombre: "Time Rewind Real Eye Cream For Face",
    categoria: "Contorno de ojos",
    precio: 34000,
    descripcion:
      "Colágeno y elastina para la piel fina del contorno. Se puede usar en toda la cara, no solo en el ojo.",
    beneficios: ["Elasticidad", "Densidad"],
  },

  /* ---------------------------------------------------------------- 5. PROTEGER */
  {
    id: "joseon-relief-sun-probiotics",
    marca: "Beauty of Joseon",
    nombre: "Relief Sun Rice + Probiotics",
    categoria: "Protector solar",
    precio: 46000,
    descripcion:
      "FPS 50+ PA++++ con 30% de extracto de arroz y probióticos. El protector que más se pide, y con razón.",
    beneficios: ["FPS 50+", "Sin residuo blanco"],
    destacado: true,
  },
  {
    id: "joseon-relief-sun-aqua",
    marca: "Beauty of Joseon",
    nombre: "Relief Sun Aqua-fresh Rice + B5",
    categoria: "Protector solar",
    precio: 42000,
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
    nombre: "Heartleaf 80 Moisture Soothing Ampoule",
    medida: "30 ml",
    categoria: "Sérums",
    precio: 0,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
  {
    id: "vt-cica-reedle-shot",
    marca: "VT",
    nombre: "Cica Reedle Shot 100",
    medida: "50 ml",
    categoria: "Sérums",
    precio: 0,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
  {
    id: "joseon-revive-eye-serum",
    marca: "Beauty of Joseon",
    nombre: "Revive Eye Serum — Ginseng + Retinal",
    categoria: "Contorno de ojos",
    precio: 0,
    descripcion: "",
    beneficios: [],
    borrador: true,
  },
];

/** Los que se publican. El borrador queda afuera de todo. */
export const productosPublicados = () => PRODUCTOS.filter((p) => !p.borrador);

/** Los de la portada, en el orden de la rutina en que estan cargados. */
export const productosDestacados = () =>
  productosPublicados().filter((p) => p.destacado);

/** Agrupados por categoria, salteando las que quedaron vacias. */
export function porCategoria(): { categoria: Categoria; items: Producto[] }[] {
  const publicados = productosPublicados();
  return CATEGORIAS.map((categoria) => ({
    categoria,
    items: publicados.filter((p) => p.categoria === categoria),
  })).filter((grupo) => grupo.items.length > 0);
}

/** Las marcas que hay, ordenadas como se leen. */
export const marcas = () =>
  [...new Set(productosPublicados().map((p) => p.marca))].sort((a, b) =>
    a.localeCompare(b, "es")
  );

export const fotoDe = (p: Producto) => `/imagenes/productos/${p.id}.webp`;

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
export function marcasConFoto(): MarcaConFoto[] {
  const publicados = productosPublicados();

  return marcas()
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
export const productosDeMarca = (slug: string) =>
  productosPublicados().filter((p) => aSlug(p.marca) === slug);

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
