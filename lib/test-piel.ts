import { CONSULTA, type Tratamiento } from "./tratamientos";

/**
 * Autoevaluacion de 5 preguntas (BETA).
 *
 * No decide por nombre de tratamiento: los nombres y los ids viven en la
 * base y Valen los edita cuando quiere. Lo que hace es deducir que EXTRAS
 * le convienen a la clienta (acidos, dermaplaning, microneedling) y despues
 * busca en el catalogo el tratamiento que mejor coincide con esa lista.
 * Si manana Valen renombra "Full Glow", el test sigue funcionando.
 */

export const ACIDOS = "Ácidos";
export const DERMAPLANING = "Dermaplaning";
export const MICRONEEDLING = "Microneedling";

type Opcion = {
  id: string;
  texto: string;
  /** Extras que esta respuesta empuja */
  suma?: string[];
  /** Manda directo a la consulta con Valen */
  derivar?: boolean;
  /** Se queda con lo justo (un solo extra) o pide todo */
  alcance?: "minimo" | "maximo";
};

export type Pregunta = {
  id: string;
  texto: string;
  ayuda?: string;
  opciones: Opcion[];
};

export const PREGUNTAS: Pregunta[] = [
  {
    id: "piel",
    texto: "¿Cómo sentís tu piel casi siempre?",
    opciones: [
      {
        id: "congestionada",
        texto: "Se me tapan los poros, tengo puntos negros",
      },
      { id: "opaca", texto: "La veo apagada, sin brillo", suma: [ACIDOS] },
      {
        id: "aspera",
        texto: "Áspera al tacto, con vello finito",
        suma: [DERMAPLANING],
      },
      {
        id: "marcas",
        texto: "Con marcas, arruguitas o poros marcados",
        suma: [MICRONEEDLING],
      },
    ],
  },
  {
    id: "ultima",
    texto: "¿Hace cuánto fue tu última limpieza facial?",
    ayuda: "Si hace mucho o nunca te hiciste una, lo primero es la limpieza.",
    opciones: [
      { id: "nunca", texto: "Nunca me hice una", alcance: "minimo" },
      { id: "lejos", texto: "Hace más de un año", alcance: "minimo" },
      { id: "meses", texto: "Hace unos meses" },
      { id: "seguido", texto: "Me hago seguido" },
    ],
  },
  {
    id: "objetivo",
    texto: "¿Qué te gustaría notar al salir?",
    opciones: [
      { id: "limpia", texto: "La piel limpia y descongestionada" },
      { id: "luminosa", texto: "Más luminosa y pareja", suma: [ACIDOS] },
      {
        id: "suave",
        texto: "Más suave, que el maquillaje asiente mejor",
        suma: [DERMAPLANING],
      },
      {
        id: "firme",
        texto: "Más firme, con las marcas menos visibles",
        suma: [MICRONEEDLING],
      },
    ],
  },
  {
    id: "sensibilidad",
    texto: "¿Tu piel se irrita o se pone colorada con facilidad?",
    ayuda: "Sirve para elegir la intensidad, no para descartar nada.",
    opciones: [
      { id: "mucho", texto: "Sí, bastante. O tengo rosácea", derivar: true },
      { id: "aveces", texto: "A veces, según el producto" },
      { id: "no", texto: "No, la tolera todo bien" },
    ],
  },
  {
    id: "alcance",
    texto: "¿Preferís algo puntual o lo más completo?",
    opciones: [
      { id: "puntual", texto: "Algo puntual, lo justo", alcance: "minimo" },
      { id: "completo", texto: "Lo más completo posible", alcance: "maximo" },
      {
        id: "nose",
        texto: "No sé, prefiero que decida Valen",
        derivar: true,
      },
    ],
  },
];

export type Respuestas = Record<string, string>;

export type Resultado = {
  tratamiento: Tratamiento;
  /** Por que le toco ese, en una frase */
  motivo: string;
};

const opcionElegida = (pregunta: Pregunta, respuestas: Respuestas) =>
  pregunta.opciones.find((o) => o.id === respuestas[pregunta.id]);

/**
 * Que tan lejos esta un tratamiento de lo que la clienta pidio.
 *
 * Que FALTE lo que pidio pesa mucho mas que que SOBRE algo: si dijo que
 * le preocupan las marcas, un tratamiento con microneedling y un acido
 * de mas le sirve, y la limpieza sola no. Sin este peso, el desempate
 * por precio le devolvia siempre la opcion mas barata.
 */
const distancia = (deseados: string[], extras: string[]) => {
  const faltan = deseados.filter((x) => !extras.includes(x)).length;
  const sobran = extras.filter((x) => !deseados.includes(x)).length;
  return faltan * 3 + sobran;
};

export function calcularResultado(
  respuestas: Respuestas,
  catalogo: Tratamiento[]
): Resultado {
  const elegidas = PREGUNTAS.map((p) => opcionElegida(p, respuestas)).filter(
    (o): o is Opcion => Boolean(o)
  );

  // Piel reactiva o "que decida Valen": no hay test que reemplace mirarla.
  if (elegidas.some((o) => o.derivar)) {
    return {
      tratamiento: CONSULTA,
      motivo:
        "Por lo que contás, lo mejor es que Valen te vea la piel antes de decidir. En la consulta te recomienda el tratamiento justo y lo hacen ahí mismo.",
    };
  }

  const puntos = new Map<string, number>();
  for (const o of elegidas) {
    for (const extra of o.suma ?? []) {
      puntos.set(extra, (puntos.get(extra) ?? 0) + 1);
    }
  }

  const disponibles = [...new Set(catalogo.flatMap((t) => t.extras))];
  const alcance = elegidas.find((o) => o.alcance)?.alcance;

  let deseados: string[];
  if (alcance === "maximo") {
    deseados = disponibles;
  } else {
    const ordenados = [...puntos.entries()]
      .filter(([extra]) => disponibles.includes(extra))
      .sort((a, b) => b[1] - a[1]);
    // "Nunca me hice una" o "algo puntual": la limpieza sola ya es un paso.
    deseados = ordenados.slice(0, alcance === "minimo" ? 1 : 2).map(([e]) => e);
  }

  const candidatos = catalogo.filter((t) => t.id !== CONSULTA.id);
  const tratamiento = candidatos.reduce((mejor, t) => {
    const d = distancia(deseados, t.extras);
    const dMejor = distancia(deseados, mejor.extras);
    if (d !== dMejor) return d < dMejor ? t : mejor;
    return t.precio < mejor.precio ? t : mejor; // empate: el mas accesible
  }, candidatos[0]);

  const motivo = deseados.length
    ? `Sumamos ${new Intl.ListFormat("es-AR", {
        style: "long",
        type: "conjunction",
      }).format(deseados)} a la limpieza profunda, que es lo que mejor responde a lo que contaste.`
    : "Con la limpieza profunda alcanza: es el punto de partida y ya se nota muchísimo.";

  return { tratamiento, motivo };
}
