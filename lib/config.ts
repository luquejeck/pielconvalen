/**
 * Forma de los datos del consultorio.
 *
 * Los valores de abajo son el respaldo: la fuente real es la tabla
 * `configuracion`, que Valen edita desde /admin/web. Ver
 * `lib/consultorio.ts`.
 */
export type DatosConsultorio = {
  nombre: string;
  profesional: string;
  profesion: string;
  titulo: string;
  carrera: string;
  eslogan: string;
  direccion: string;
  mapsUrl: string;
  referencia: string;
  transporte: string;
  whatsapp: string;
  whatsappVisible: string;
  telefono: string;
  instagram: string;
  instagramUrl: string;
  queSeHace: string;
  bio: string;
  matricula: string;
  experiencia: string;
  fotos: { valen: boolean; consultorio: boolean };
  mediosDePago: string;
  comoVenir: string;
};

/**
 * COMO SE PAGAN Y SE ENTREGAN LOS PRODUCTOS.
 *
 * No es `mediosDePago` de abajo: ese es el de los tratamientos, lo edita
 * Valen en /admin/web y hoy dice "Efectivo, transferencia o Mercado
 * Pago". Los productos se cobran solo en efectivo o transferencia, y se
 * retiran en el consultorio o se entregan donde se arregle con Valen
 * (Lucas, 23-09-2026).
 *
 * Va en minuscula porque se lee dentro de una frase: "Pagás en
 * efectivo o transferencia".
 */
export const PAGO_PRODUCTOS = "efectivo o transferencia";

/**
 * QUE LOS PRODUCTOS SON ORIGINALES.
 *
 * Es la primera duda de quien compra cosmetica coreana en Argentina:
 * Mercado Libre esta lleno de copias de las mismas marcas que vende
 * Valen. Lucas confirmo el 23-09-2026 que son marcas originales de
 * Corea y que los productos son importados; si algun dia entra uno que
 * no lo sea, este texto deja de ser cierto para ese producto.
 *
 * Va debajo de un titulo que ya dice "Productos", asi que no lo repite:
 * con la palabra, en el celular partia en dos renglones.
 */
export const ORIGEN_PRODUCTOS = "Originales, importados de Corea";

/** Las dudas de quien compra, contestadas corto. Van al pie de /productos. */
export const preguntasProductos = (barrio: string) => [
  {
    pregunta: "¿Son originales?",
    respuesta:
      "Sí. Son marcas originales de Corea y los productos son importados. Si tenés dudas sobre alguno, preguntale a Valen.",
  },
  {
    pregunta: "¿Cómo se paga?",
    respuesta: `En ${PAGO_PRODUCTOS}, cuando coordinás el pedido con Valen por WhatsApp.`,
  },
  {
    pregunta: "¿Hacen envíos?",
    respuesta: `Se retiran en el consultorio, en ${barrio}. Si no podés ir, coordinás con Valen para entregártelo en otro lugar.`,
  },
];

/** "Riglos 531, Caballito, CABA" -> "Caballito". */
export const barrioDe = (direccion: string) =>
  direccion.split(",")[1]?.trim() || "el consultorio";

/**
 * Valores de arranque. Se usan mientras la base no tenga nada cargado.
 */
export const CONSULTORIO: DatosConsultorio = {
  nombre: "Piel con Valen",
  profesional: "Valentina Gallo",

  /**
   * Como se presenta ella, tomado de su Instagram: "Cosmetóloga &
   * Cosmiatra Profesional".
   *
   * La cosmiatria no es lo mismo que la cosmetologia —es la parte mas
   * clinica, con aparatologia— y hasta ahora la palabra no figuraba en
   * ningun lado de la web. Estaba escrita a mano adentro del Hero, que
   * es justo la clase de cosa que no se puede cambiar sin tocar codigo.
   */
  profesion: "Cosmetóloga y Cosmiatra",

  titulo: "Técnica UBA",
  /** Siempre "UBA", nunca "Universidad de Buenos Aires": mas corto y es
   *  como lo dice todo el mundo. */
  carrera: "Técnica en Cosmetología Facial y Corporal",
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

  /**
   * El mismo numero, en formato para LLAMAR.
   *
   * Antes el telefono estaba tres veces a la vista y las tres colgaba de
   * un link a WhatsApp. Buena parte de las clientas mayores no escribe
   * para pedir un turno: llama. Sin un `tel:` la pagina las empujaba a
   * un canal que no eligieron.
   */
  telefono: "+5491122943672",

  instagram: "pielconvalen",
  instagramUrl: "https://instagram.com/pielconvalen",

  /**
   * Que es lo que se hace aca, en el idioma de la clienta.
   *
   * "Cosmetologa" no es una palabra transparente para todo el mundo:
   * mucha gente la asocia a maquillaje o a venta de cremas. Quien llega
   * por un link de WhatsApp, sin contexto, tenia que bajar dos pantallas
   * hasta Tratamientos para entender que le estan ofreciendo.
   */
  queSeHace: "Limpieza de cutis y tratamientos faciales",

  /**
   * La presentacion en PRIMERA PERSONA.
   *
   * Es lo que separa una pagina de un profesional de salud de un folleto.
   * Todo lo demas del sitio habla DE ella —"te atiende ella misma",
   * "formacion universitaria"— y eso se lee como publicidad. Que hable
   * ella cambia a quien le estas creyendo.
   *
   * DOS oraciones. Antes eran cuatro y la seccion se convertia en un
   * texto para leer, cuando lo que tiene que hacer es dar confianza de un
   * vistazo. Lo que sobra no suma credibilidad: la diluye.
   *
   * VALEN: reescribilo con tus palabras desde el panel, en Mi web. Esto
   * es un punto de partida, no tu voz.
   */
  bio:
    "Estudié en la UBA porque quería entender la piel, no solo tratarla. Miro cómo está la tuya ese día y de ahí sale el tratamiento, no al revés.",

  /**
   * Matricula profesional. En las paginas de salud siempre esta a la
   * vista: es la credencial verificable, no un titulo que uno se pone.
   *
   * VALEN: completar con tu numero. Si queda vacio, no se muestra —
   * preferible nada antes que un dato inventado.
   */
  matricula: "",

  /**
   * Cuanto hace que atiende. Ej: "8 años atendiendo en Caballito".
   * Vacio = no se muestra.
   */
  experiencia: "",

  /**
   * Que fotos hay cargadas en /public/imagenes.
   *
   * VALEN: poner en `true` el dia que subas la foto del consultorio.
   *
   * Antes esto se resolvia preguntandole al disco con `existsSync`. En
   * Vercel la carpeta `public` no viaja adentro de la funcion —esos
   * archivos los sirve el CDN—, asi que la pregunta daba `false` y la
   * seccion "Quien te va a atender" desaparecia entera del sitio
   * publicado, sin error ni hueco: justo la seccion que convierte "un
   * consultorio desconocido" en "el de Valen".
   */
  fotos: {
    valen: true,
    consultorio: false,
  },

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
};

export type Agenda = {
  /** 0 = domingo ... 6 = sabado */
  diasHabiles: number[];
  /**
   * Horas de inicio de cada turno, DIA POR DIA: { 1: ["09:00", ...] }.
   *
   * Antes habia una sola lista de horarios para toda la semana. Valen no
   * atiende en la misma franja todos los dias —un dia entra mas tarde,
   * el sabado corta al mediodia— y con una lista unica la unica salida
   * era cargar la union de todos los horarios y despues ir cerrando a
   * mano los que no correspondian.
   *
   * La clave es el dia de la semana de `getDay()`: 0 = domingo.
   */
  horariosPorDia: Record<number, string[]>;
  /** No se puede reservar con menos de X horas de anticipacion */
  anticipacionMinimaHs: number;
  /** Cuantos dias hacia adelante se puede reservar */
  ventanaDias: number;
  /**
   * Como trabaja ella, en primera persona.
   *
   * Antes esto era una lista de siete pasos fijos, y decia algo que no
   * era cierto: que toda sesion es igual a la anterior. Lo que hace es
   * mirar la piel antes de empezar y armar el tratamiento de ese dia con
   * lo que ve y con lo que la clienta pide. Un texto lo cuenta; una
   * lista numerada lo contradice.
   */
  comoTrabajo: string;
};

/** Un paso de "Como trabajo". El titulo es opcional. */
export type PasoComoTrabajo = { titulo: string | null; texto: string };

/**
 * Los pasos de "Como trabajo", tal como los escribe Valen en el panel.
 *
 * Un renglon = un paso. Cada uno puede venir como "Titulo | texto"; sin
 * la barra, el paso queda solo con su texto. Se parte en la PRIMERA
 * barra nada mas, asi que el texto puede llevar todas las que quiera.
 *
 * Vive aca y no adentro de un componente porque el bloque se mudo de
 * Tratamientos a la seccion de Valen, y no tiene sentido que la forma de
 * leer el dato viaje con el.
 */
export function pasosComoTrabajo(agenda: Agenda): PasoComoTrabajo[] {
  return agenda.comoTrabajo
    .split("\n")
    .map((renglon) => renglon.trim())
    .filter(Boolean)
    .map((renglon) => {
      const barra = renglon.indexOf("|");
      if (barra === -1) return { titulo: null, texto: renglon };
      return {
        titulo: renglon.slice(0, barra).trim() || null,
        texto: renglon.slice(barra + 1).trim(),
      };
    });
}

/** Los horarios de arranque, iguales para todos los dias. */
export const HORARIOS_POR_DEFECTO = [
  "08:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
];

/** Las horas de un dia de la semana. Si no atiende ese dia, ninguna. */
export function horariosDelDia(agenda: Agenda, diaSemana: number): string[] {
  if (!agenda.diasHabiles.includes(diaSemana)) return [];
  return agenda.horariosPorDia[diaSemana] ?? [];
}

/**
 * Todas las horas que aparecen en la semana, sin repetir.
 * Se usa donde hace falta una lista suelta de horas y no la de un dia
 * concreto.
 */
export function todosLosHorarios(agenda: Agenda): string[] {
  return [
    ...new Set(agenda.diasHabiles.flatMap((dia) => horariosDelDia(agenda, dia))),
  ].sort();
}

/**
 * Valores de arranque. La fuente real es la tabla `agenda` de la base,
 * que Valen edita desde /admin/agenda. Esto es el respaldo por si la
 * base todavia no esta configurada.
 */
export const AGENDA_POR_DEFECTO: Agenda = {
  diasHabiles: [1, 2, 3, 4, 5, 6], // lunes a sabado
  horariosPorDia: {
    1: HORARIOS_POR_DEFECTO,
    2: HORARIOS_POR_DEFECTO,
    3: HORARIOS_POR_DEFECTO,
    4: HORARIOS_POR_DEFECTO,
    5: HORARIOS_POR_DEFECTO,
    6: HORARIOS_POR_DEFECTO,
  },
  anticipacionMinimaHs: 24,
  ventanaDias: 60,

  /**
   * VALEN: reescribilo con tus palabras desde el panel, en Horarios.
   * Esto es un punto de partida, no tu voz.
   */
  comoTrabajo:
    "No hay dos pieles iguales, así que no hago siempre lo mismo. Antes de empezar te miro la piel de cerca, te pregunto qué usás, qué te molesta y qué esperás de la sesión.\n" +
    "Con eso armo el tratamiento de ese día: cuánto profundizo la limpieza, qué activos uso, hasta dónde llego con las extracciones. Si algo te incomoda, frenamos y lo cambiamos ahí mismo.\n" +
    "Por eso dos sesiones del mismo tratamiento no son idénticas: lo que cambia es tu piel, y el trabajo se acomoda a eso.",
};

/**
 * De donde cuelga el sitio. Se usa para armar las direcciones absolutas
 * que necesitan la vista previa de WhatsApp, el sitemap y el robots.txt:
 * con rutas relativas ningun cliente de mensajeria las resuelve.
 *
 * En Vercel, `VERCEL_PROJECT_PRODUCTION_URL` ya viene cargada. Si algun
 * dia hay dominio propio, se pone en NEXT_PUBLIC_SITIO_URL y listo.
 */
export const SITIO_URL =
  process.env.NEXT_PUBLIC_SITIO_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
