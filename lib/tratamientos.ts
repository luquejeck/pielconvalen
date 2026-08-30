export type Tratamiento = {
  id: string;
  nombre: string;
  nombreCorto: string;
  precio: number;
  duracion: string;
  /** Lo que suma por encima de la limpieza profunda. Vacio = solo eso. */
  extras: string[];
  destacado?: boolean;
  /** Texto propio para las opciones que no son un tratamiento del catalogo. */
  descripcion?: string;
};

/**
 * Los nombres tecnicos no le dicen nada a quien no esta en el tema.
 * Cada extra se explica en un renglon, en castellano de todos los dias.
 */
export const GLOSARIO: Record<string, string> = {
  "Ácidos": "Una mascarilla que renueva la piel de a poco, sin lastimarla.",
  Dermaplaning:
    "Se pasa una hojita estéril que saca el vello finito y la piel muerta. No duele ni pincha.",
  Microneedling:
    "Microestimulaciones que despiertan el colágeno. Se usa crema anestésica y no sangra.",
};

/**
 * Como entra TODO turno pedido desde la web.
 *
 * Antes era una opcion mas, para quien no sabia cual elegir. Hoy es la
 * unica: la clienta reserva el horario y Valen define el tratamiento
 * cuando le mira la piel, y lo deja anotado al cobrar desde el panel.
 */
export const CONSULTA: Tratamiento = {
  id: "consulta",
  nombre: "Consulta y Evaluación Facial",
  nombreCorto: "Consulta",
  precio: 0,
  duracion: "1.5 a 2 horas",
  extras: [],
  descripcion:
    "Valen te mira la piel y te recomienda el tratamiento en el momento. Reservás el turno igual y el precio se define ahí, sin compromiso.",
};

export const esConsulta = (t: Tratamiento) => t.id === CONSULTA.id;

/**
 * Valores de arranque. La fuente real es la tabla `tratamientos` de la
 * base, que Valen edita desde /admin/tratamientos. Esto es el respaldo
 * por si la base todavia no esta configurada.
 */
export const TRATAMIENTOS_POR_DEFECTO: Tratamiento[] = [
  {
    id: "hfp",
    nombre: "Higiene Facial Profunda",
    nombreCorto: "Higiene Facial",
    precio: 34000,
    duracion: "1.5 a 2 horas",
    extras: [],
  },
  {
    id: "hfp-acidos",
    nombre: "Higiene Facial con Ácidos",
    nombreCorto: "Con Ácidos",
    precio: 37000,
    duracion: "1.5 a 2 horas",
    extras: ["Ácidos"],
  },
  {
    id: "hf-dermaplaning",
    nombre: "Higiene Facial con Dermaplaning",
    nombreCorto: "Con Dermaplaning",
    precio: 39500,
    duracion: "1.5 a 2 horas",
    extras: ["Dermaplaning", "Ácidos"],
  },
  {
    id: "hf-microneedling",
    nombre: "Higiene Facial con Microneedling",
    nombreCorto: "Con Microneedling",
    precio: 42000,
    duracion: "1.5 a 2 horas",
    extras: ["Ácidos", "Microneedling"],
  },
  {
    id: "full-glow",
    nombre: "Full Glow",
    nombreCorto: "Full Glow",
    precio: 47000,
    duracion: "1.5 a 2 horas",
    extras: ["Dermaplaning", "Ácidos", "Microneedling"],
    destacado: true,
  },
];

export const formatearPrecio = (precio: number) =>
  precio === 0
    ? "A convenir"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }).format(precio);

export const buscarTratamiento = (
  lista: Tratamiento[],
  id: string | null
): Tratamiento | null => lista.find((t) => t.id === id) ?? null;
