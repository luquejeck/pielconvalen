import { fotoDe, hayStock, type Categoria, type Producto } from "./productos";

/**
 * Los combos: tres productos que se complementan, con descuento.
 *
 * SE DEFINEN POR CODIGO Y EL PRECIO SE CALCULA EN VIVO.
 * El combo no tiene precio propio escrito en ningun lado: es la suma de
 * lo que valen hoy sus tres productos, menos el descuento. Si Valen
 * cambia el precio de uno desde el panel, el combo se actualiza solo, y
 * nunca queda un combo diciendo un numero que ya no corresponde.
 *
 * Y SI FALTA UNO, EL COMBO NO SE MUESTRA.
 * Si alguno de los tres se despublica, el combo desaparece en vez de
 * ofrecerse incompleto. Lo mismo si la base no contesta y la web cae al
 * catalogo del codigo: esos productos no tienen codigo, no se encuentra
 * ninguno, y la seccion no aparece. Nunca se vende algo que no esta.
 */
export type DefinicionCombo = {
  slug: string;
  nombre: string;
  /** Para que es, en una linea. */
  descripcion: string;
  /** Los tres, en el orden en que se usan. */
  codigos: string[];
  /** 0,10 es 10%. */
  descuento: number;
};

/*
  EL COMBO DE PRUEBA, 21-09-2026.

  Lucas pidio "el que menos costo tenga y mas rentabilidad le saque". Se
  calcularon las 184 combinaciones posibles de tres productos de pasos
  distintos de la rutina —publicados, con stock y con costo cargado— y
  este salio primero en LAS DOS cosas a la vez: es el mas barato de
  armar ($43.833 de costo) y el de mayor margen (101%, con el 10%
  descontado). No hubo que elegir entre una y otra.

  Tiene ademas una coherencia de piel: el Revive y el Time Rewind apuntan
  los dos a elasticidad, asi que funciona como rutina antiedad.

  LO QUE LE FALTA ES PROTECTOR SOLAR, y una rutina sin FPS esta
  incompleta. El mas rentable que lo incluye cambia el Revive por el
  Relief Sun Aqua-fresh y cae a 94% de margen. Si Valen prefiere ese,
  es cambiar un codigo.
*/
export const COMBOS: DefinicionCombo[] = [
  {
    slug: "rutina-antiedad",
    nombre: "Rutina antiedad",
    descripcion: "Limpiar, tratar y cuidar el contorno. Tres pasos que apuntan a la elasticidad de la piel.",
    codigos: ["ARL-SMOO-80ML", "BOJ-REVI-30ML", "AHC-TIME-30ML"],
    descuento: 0.1,
  },
];

export type Combo = {
  /** El id con el que viaja en el carrito. Estable: sale del slug. */
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  productos: Producto[];
  /** Lo que salen los tres por separado. */
  suma: number;
  /** Lo que sale el combo. */
  precio: number;
  ahorro: number;
  descuento: number;
};

/**
 * Redondea a la centena para abajo.
 *
 * $88.200 y no $88.218: un precio con decenas sueltas parece un error de
 * cuenta. Para abajo, asi el descuento real nunca es menor al anunciado.
 */
const aCentena = (n: number) => Math.floor(n / 100) * 100;

/**
 * Los combos que se pueden ofrecer hoy, con sus productos y su precio.
 *
 * Las definiciones llegan de afuera —desde el 22-09-2026 las arma Valen
 * en el panel y viven en la base— y COMBOS queda de respaldo para
 * cuando la base no contesta, igual que el catalogo de productos.
 */
export function resolverCombos(
  catalogo: Producto[],
  definiciones: DefinicionCombo[] = COMBOS
): Combo[] {
  const porCodigo = new Map(
    catalogo.filter((p) => p.codigo && !p.borrador).map((p) => [p.codigo!, p])
  );

  return definiciones.flatMap((d) => {
    const productos = d.codigos.map((c) => porCodigo.get(c));
    /* Falta uno, o alguno no tiene precio: el combo no se ofrece. */
    if (productos.some((p) => !p || !p.precio)) return [];

    /*
      Y TAMPOCO SI A UNO NO LE QUEDA STOCK.

      Un combo es todo o nada: no se puede vender "la rutina antiedad
      menos el contorno" al precio de los tres. Ofrecerlo con una parte
      agotada termina en un pedido que Valen no puede cumplir y que hay
      que deshacer por WhatsApp.
    */
    if (productos.some((p) => !hayStock(p!))) return [];

    const lista = productos as Producto[];
    /* Un combo de un solo producto no es un combo: es ese producto con
       descuento, y para eso esta la oferta. Puede quedar asi si Valen
       borro un producto que lo integraba. */
    if (lista.length < 2) return [];
    const suma = lista.reduce((n, p) => n + p.precio, 0);
    const precio = aCentena(suma * (1 - d.descuento));
    return [
      {
        id: `combo-${d.slug}`,
        slug: d.slug,
        nombre: d.nombre,
        descripcion: d.descripcion,
        productos: lista,
        suma,
        precio,
        ahorro: suma - precio,
        descuento: d.descuento,
      },
    ];
  });
}

/**
 * El combo con forma de producto, para el carrito.
 *
 * El carrito sabe manejar productos y nada mas, asi que el combo entra
 * como uno: una linea con el precio del combo. `precioAnterior` es la
 * suma de los tres, y eso solo ya hace que se vea el descuento —la
 * ficha y el carrito lo dibujan igual que el de cualquier oferta—.
 *
 * La medida lleva la lista de los tres: es lo que sale en el mensaje de
 * WhatsApp entre parentesis, asi Valen sabe que tiene que preparar.
 */
export function comboComoProducto(c: Combo): Producto {
  return {
    id: c.id,
    codigo: c.id.toUpperCase(),
    foto: c.productos[0].foto,
    marca: "Combo",
    nombre: c.nombre,
    medida: c.productos.map((p) => `${p.marca} ${p.nombre}`).join(" + "),
    incluye: c.productos.map((p) => ({ nombre: `${p.marca} ${p.nombre}`, foto: fotoDe(p) })),
    categoria: c.productos[0].categoria as Categoria,
    precio: c.precio,
    precioAnterior: c.suma,
    descripcion: c.descripcion,
    beneficios: [],
  };
}

/**
 * El paso de la rutina de cada producto, por su categoria.
 *
 * Es lo que explica por que esos productos van juntos: "Limpiar +
 * Tratar + Hidratar" se entiende sin saber que es un serum.
 */
export const PASO: Record<string, string> = {
  Limpiadores: "Limpiar",
  Tónicos: "Tonificar",
  Sérums: "Tratar",
  Mascarillas: "Mascarilla",
  Cremas: "Hidratar",
  "Contorno de ojos": "Contorno",
  "Protector solar": "Proteger",
};

/** Los pasos del combo, en el orden en que Valen los cargo. */
export const pasosDe = (c: Combo) =>
  c.productos.map((p) => PASO[p.categoria] ?? p.categoria);
