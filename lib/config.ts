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
   * Corto a proposito: tres o cuatro renglones. Un texto largo aca no lo
   * lee nadie y empuja los precios mas abajo.
   *
   * VALEN: reescribilo con tus palabras desde el panel, en Mi web. Esto
   * es un punto de partida, no tu voz.
   */
  bio:
    "Estudié en la UBA porque quería entender la piel, no solo tratarla. Trabajo despacio: miro cómo está tu piel ese día y de ahí sale el tratamiento, no al revés. Si algo te incomoda en la camilla, frenamos.",

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
