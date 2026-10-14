/*
  LOS ESTILOS DE LA GIFTCARD (14-10-2026).

  Quien regala puede cambiarle el papel a la tarjeta en "Personalizar
  estilo", que viene cerrado: quien no lo abre se lleva la de siempre,
  la vino. Elegir es opcional y nunca frena el pedido.

  TODOS SON LA MISMA TARJETA: el mismo logo, la misma tipografia, el
  mismo orden. Cambia el papel. Se probaron veinte en una galeria y
  quedaron cinco fijos, con la vino primero porque es la de la casa.

  Y UNO POR FECHA ESPECIAL, que se ofrece solo desde dos semanas antes
  hasta el dia mismo: despues se esconde. Una giftcard que se pidio con
  ese estilo lo conserva para siempre; lo que se esconde es la opcion de
  elegirlo.

  Cada estilo trae dos dibujos del mismo papel: `fondo` y `extra` para
  la web (CSS de verdad, con capas) y `og` para la imagen y el PDF, que
  los dibuja next/og y entiende un solo degradé simple.
*/

export type EstiloGiftcard = {
  id: string;
  nombre: string;
  /** El papel, como `background` de CSS. */
  fondo: string;
  /** Una capa encima del papel: puntitos, un brillo. */
  extra?: string;
  /** El mismo papel en un solo `linear-gradient`, para next/og. */
  og: string;
  /**
   * El color del texto. Los papeles oscuros llevan crema y el logo en
   * blanco; los claros, este color y el logo en vino.
   */
  tinta?: string;
  /** Solo los de fecha especial: cual, y que dia cae ese año. */
  fecha?: { nombre: string; dia: (anio: number) => string };
};

/** El 3er domingo de un mes (0 = enero), como "2026-10-18". */
function tercerDomingo(anio: number, mes: number): string {
  const dia1 = new Date(Date.UTC(anio, mes, 1)).getUTCDay();
  const primero = 1 + ((7 - dia1) % 7);
  return clave(anio, mes, primero + 14);
}

const clave = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

export const ESTILOS_GIFTCARD: EstiloGiftcard[] = [
  {
    id: "vino",
    nombre: "Vino",
    fondo: "linear-gradient(135deg, #931656 0%, #7d0d46 42%, #5d0a34 100%)",
    extra: "linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.09) 45%, transparent 60%)",
    og: "linear-gradient(135deg, #931656 0%, #7d0d46 42%, #5d0a34 100%)",
  },
  {
    id: "rosa",
    nombre: "Rosa",
    fondo: "linear-gradient(140deg, #fbe3ec 0%, #f4c9d9 55%, #eab3c7 100%)",
    extra: "radial-gradient(circle, rgb(125 13 70 / 0.16) 1.2px, transparent 1.6px) 0 0 / 22px 22px",
    og: "linear-gradient(140deg, #fbe3ec 0%, #f4c9d9 55%, #eab3c7 100%)",
    tinta: "#5d0a34",
  },
  {
    id: "crema",
    nombre: "Crema",
    fondo:
      "radial-gradient(120% 90% at 85% 100%, #f3cddb 0%, transparent 55%), linear-gradient(160deg, #fffaf8 0%, #fbeff1 60%, #f6e2e8 100%)",
    og: "linear-gradient(160deg, #fffaf8 0%, #fbeff1 55%, #f3d3df 100%)",
    tinta: "#5d0a34",
  },
  {
    id: "terciopelo",
    nombre: "Terciopelo",
    fondo:
      "radial-gradient(90% 80% at 20% 15%, #8e1450 0%, transparent 60%), linear-gradient(150deg, #4a0829 0%, #2e0519 60%, #1d0f14 100%)",
    extra: "radial-gradient(60% 50% at 85% 90%, rgb(247 160 195 / 0.28), transparent 70%)",
    og: "linear-gradient(150deg, #7a1145 0%, #3a0620 50%, #1d0f14 100%)",
  },
  {
    id: "nacar",
    nombre: "Nácar",
    fondo:
      "linear-gradient(125deg, #fbeef3 0%, #efe3f2 30%, #fbe9ee 55%, #f1e6ee 80%, #fcf3f5 100%)",
    extra: "linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.7) 45%, transparent 60%)",
    og: "linear-gradient(125deg, #fbeef3 0%, #efe3f2 30%, #fbe9ee 55%, #f1e6ee 80%, #fcf3f5 100%)",
    tinta: "#5d0a34",
  },

  /* ------------------------------------------------ fechas especiales */
  {
    id: "rojo-pasion",
    nombre: "Rojo pasión",
    fondo: "linear-gradient(135deg, #b3123f 0%, #8a0c37 50%, #5d0a34 100%)",
    extra: "linear-gradient(115deg, transparent 30%, rgb(255 255 255 / 0.1) 45%, transparent 60%)",
    og: "linear-gradient(135deg, #b3123f 0%, #8a0c37 50%, #5d0a34 100%)",
    fecha: { nombre: "San Valentín", dia: (a) => clave(a, 1, 14) },
  },
  {
    id: "lavanda",
    nombre: "Lavanda",
    fondo:
      "radial-gradient(50% 60% at 20% 30%, rgb(190 160 230 / 0.7), transparent 70%), radial-gradient(45% 55% at 80% 75%, rgb(240 180 210 / 0.55), transparent 70%), #f8f2fb",
    og: "linear-gradient(135deg, #e6d6f5 0%, #f8f2fb 50%, #f6dbe8 100%)",
    tinta: "#4a2266",
    fecha: { nombre: "Día de la Mujer", dia: (a) => clave(a, 2, 8) },
  },
  {
    id: "durazno",
    nombre: "Durazno",
    fondo: "linear-gradient(150deg, #ffe8dc 0%, #f8cdbd 100%)",
    extra: "radial-gradient(60% 60% at 90% 10%, rgb(255 255 255 / 0.7), transparent 70%)",
    og: "linear-gradient(150deg, #ffe8dc 0%, #f8cdbd 100%)",
    tinta: "#6b1a3a",
    fecha: { nombre: "Día de la Madre", dia: (a) => tercerDomingo(a, 9) },
  },
];

/**
 * Lo que dice la tarjeta debajo del logo. Las de fecha especial lo dicen
 * con todas las letras —"Especial Día de la Madre"—: es lo que hace que
 * se sientan de edicion limitada (Lucas, 14-10-2026).
 */
export const rotuloEstilo = (e: EstiloGiftcard) =>
  e.fecha ? `Especial ${e.fecha.nombre}` : "Giftcard";

/** Cuantos dias antes de la fecha aparece su estilo. */
export const DIAS_ANTES = 14;

/** La de siempre: la que sale si nadie elige, y si el id no existe. */
export const ESTILO_POR_DEFECTO = ESTILOS_GIFTCARD[0];

/** El estilo de una giftcard. Uno que ya no existe vuelve a la vino. */
export const estiloGiftcard = (id: string | null | undefined): EstiloGiftcard =>
  ESTILOS_GIFTCARD.find((e) => e.id === id) ?? ESTILO_POR_DEFECTO;

/** "2026-10-18" menos 14 dias -> "2026-10-04". */
function restarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - dias)).toISOString().slice(0, 10);
}

/**
 * Si un estilo de fecha se ofrece hoy: desde 14 dias antes hasta el dia
 * mismo. Se mira la fecha de este año: la de San Valentín del año que
 * viene recien entra en la ventana a fin de enero, ya con el año nuevo.
 */
export function enVentana(e: EstiloGiftcard, hoy: string): boolean {
  if (!e.fecha) return true;
  const dia = e.fecha.dia(Number(hoy.slice(0, 4)));
  return hoy >= restarDias(dia, DIAS_ANTES) && hoy <= dia;
}

/**
 * Los que se pueden elegir hoy: primero el de la fecha que se viene, si
 * hay una cerca, y despues los cinco de siempre.
 */
export const estilosDisponibles = (hoy: string): EstiloGiftcard[] => [
  ...ESTILOS_GIFTCARD.filter((e) => e.fecha && enVentana(e, hoy)),
  ...ESTILOS_GIFTCARD.filter((e) => !e.fecha),
];
