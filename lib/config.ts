/**
 * Datos del consultorio. Punto unico de edicion para Valentina.
 */
export const CONSULTORIO = {
  nombre: "Piel con Valen",
  profesional: "Valentina Gallo",
  titulo: "Técnica UBA",
  /** Siempre "UBA", nunca "Universidad de Buenos Aires": mas corto y es
   *  como lo dice todo el mundo. */
  carrera: "Tecnicatura Universitaria en Cosmetología Facial y Corporal",
  eslogan: "Tu piel es parte de tu salud",
  direccion: "Riglos 531, Caballito, CABA",
  mapsUrl: "https://maps.google.com/?q=Riglos+531+Caballito+CABA",

  /**
   * Punto de referencia para ubicarse sin mapa. Una direccion sola no
   * alcanza: mucha gente se orienta por lo que conoce del barrio, no por
   * la numeracion.
   *
   * VALEN: completar con algo verificable y cercano de verdad, por
   * ejemplo "a dos cuadras del Parque Rivadavia" o "frente a la plaza".
   * Si queda vacio, el bloque no se muestra: preferible nada antes que
   * mandar a alguien a caminar de mas.
   */
  referencia: "",

  /**
   * Como llegar en transporte. Mismo criterio: vacio = no se muestra.
   * VALEN: completar con las lineas que paran cerca y la estacion mas
   * proxima.
   */
  transporte: "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5491122943672",
  whatsappVisible: "+54 9 11 2294-3672",
  instagram: "pielconvalen",
  instagramUrl: "https://instagram.com/pielconvalen",

  /**
   * Se avisan junto a los precios: nadie tiene que salir de su casa con
   * $47.000 en la cartera por no saber si podia transferir.
   * Confirmado con Valen el 21/08/2026.
   */
  mediosDePago: "Efectivo, transferencia o Mercado Pago",

  /**
   * La duda que nadie se anima a preguntar antes de un turno.
   * VALEN: confirmar que desmaquillas vos en el consultorio.
   */
  comoVenir:
    "Vení como estés: si venís maquillada, te desmaquillamos acá. No hace falta que llegues con la cara lavada.",
} as const;

export type Agenda = {
  /** 0 = domingo ... 6 = sabado */
  diasHabiles: number[];
  /** Horas de inicio de cada turno */
  horarios: string[];
  /** No se puede reservar con menos de X horas de anticipacion */
  anticipacionMinimaHs: number;
  /** Cuantos dias hacia adelante se puede reservar */
  ventanaDias: number;
  /** Pasos que incluyen todos los tratamientos */
  pasosBase: string[];
};

/**
 * Valores de arranque. La fuente real es la tabla `agenda` de la base,
 * que Valen edita desde /admin/agenda. Esto es el respaldo por si la
 * base todavia no esta configurada.
 */
export const AGENDA_POR_DEFECTO: Agenda = {
  diasHabiles: [1, 2, 3, 4, 5, 6], // lunes a sabado
  horarios: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
  anticipacionMinimaHs: 24,
  ventanaDias: 60,
  pasosBase: [
    "Preparación de la piel",
    "Exfoliación mecánica",
    "Máscara de ácidos o enzimática",
    "Extracciones",
    "Descongestión y alta frecuencia",
    "Hidratación",
    "Protector solar",
  ],
};
