/**
 * Datos del consultorio. Punto unico de edicion para Valentina.
 */
export const CONSULTORIO = {
  nombre: "Piel con Valen",
  profesional: "Valentina Gallo",
  titulo: "Técnica UBA",
  eslogan: "Tu piel es parte de tu salud",
  direccion: "Riglos 531, Caballito, CABA",
  mapsUrl: "https://maps.google.com/?q=Riglos+531+Caballito+CABA",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "5491122943672",
  whatsappVisible: "+54 9 11 2294-3672",
  instagram: "pielconvalen",
  instagramUrl: "https://instagram.com/pielconvalen",
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
