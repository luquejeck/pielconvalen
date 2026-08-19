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

/**
 * Agenda base. El calendario genera los turnos a partir de esta config
 * y despues los cruza contra los bloqueos que carga la admin.
 *
 * diasHabiles: 0 = domingo ... 6 = sabado
 * horarios: horas de INICIO de cada turno (los tratamientos duran 1.5 a 2 hs)
 */
export const AGENDA = {
  diasHabiles: [2, 3, 4, 5, 6] as number[], // martes a sabado
  horarios: ["09:00", "11:30", "14:00", "16:30"] as string[],
  /** No se puede reservar con menos de X horas de anticipacion */
  anticipacionMinimaHs: 24,
  /** Cuantos dias hacia adelante se puede reservar */
  ventanaDias: 60,
};
