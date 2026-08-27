import "server-only";

import { CONSULTORIO, type DatosConsultorio } from "./config";
import { GLOSARIO } from "./tratamientos";
import { hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";

/**
 * Los datos del consultorio, leidos de la base.
 *
 * Misma idea que `obtenerAgenda`: la fuente real es la tabla
 * `configuracion`, que Valen edita desde /admin/web, y lo que no este
 * cargado cae en el valor que trae el codigo. Asi la web nunca queda sin
 * datos ni a medio configurar, y el dia que se rompa la base sigue
 * mostrando algo coherente en vez de huecos.
 *
 * Antes todo esto vivia escrito adentro de los componentes: cambiar la
 * direccion, el telefono o los tres beneficios necesitaba un programador
 * y un deploy.
 */

export type Beneficio = { titulo: string; texto: string };
export type Pregunta = { pregunta: string; respuesta: string };

export type ConfiguracionWeb = DatosConsultorio & {
  beneficios: Beneficio[];
  glosario: Record<string, string>;
  preguntas: Pregunta[];
  contraindicaciones: string[];
  protocolo: string[];
};

/** Los tres de "Que vas a notar", que estaban clavados en Beneficios.tsx */
export const BENEFICIOS_POR_DEFECTO: Beneficio[] = [
  { titulo: "Piel más sana", texto: "Limpia, descongestionada y desinflamada." },
  { titulo: "Piel más luminosa", texto: "Recupera el brillo natural." },
  {
    titulo: "Piel más uniforme",
    texto: "Mejor textura, menos marcas y manchas.",
  },
];

/**
 * Las dudas que frenan a una clienta que nunca se hizo un tratamiento.
 *
 * Estan escritas como las pregunta ella, no como las nombraria un
 * profesional: "¿duele?" y no "¿el procedimiento genera molestias?".
 * Quien no encuentra la respuesta o escribe para preguntar, o se va.
 *
 * VALEN: revisalas y corregi lo que no sea exacto. Se editan desde el
 * panel, en Mi web.
 */
export const PREGUNTAS_POR_DEFECTO: Pregunta[] = [
  {
    pregunta: "¿Duele?",
    respuesta:
      "La limpieza no duele: en las extracciones podés sentir alguna molestia y ahí frenamos las veces que necesites. Para el microneedling se usa crema anestésica.",
  },
  {
    pregunta: "¿Cuánto dura la sesión?",
    respuesta:
      "Entre una hora y media y dos horas. No se apura: la piel necesita ese tiempo.",
  },
  {
    pregunta: "¿Puedo salir maquillada después?",
    respuesta:
      "Mejor no ese día. La piel queda sensible y conviene dejarla descansar hasta el día siguiente, solo con protector solar.",
  },
  {
    pregunta: "¿Se me va a poner roja la cara?",
    respuesta:
      "Puede quedar algo colorada unas horas, sobre todo si hubo extracciones. Al otro día ya está normal. Si tenés un evento, sacá el turno con unos días de anticipación.",
  },
  {
    pregunta: "¿Cada cuánto conviene hacerse una?",
    respuesta:
      "En general cada 30 a 45 días, pero depende de tu piel. En la primera sesión te digo qué te conviene a vos.",
  },
];

/**
 * Cuando conviene consultar ANTES de reservar.
 *
 * No es letra chica legal: es evitar que alguien se tome el colectivo
 * para que despues haya que suspenderle la sesion sobre la camilla.
 *
 * VALEN: esto es criterio profesional tuyo. Revisalo y ajustalo.
 */
export const CONTRAINDICACIONES_POR_DEFECTO: string[] = [
  "Estás embarazada o amamantando",
  "Tomaste isotretinoína (Roacután) en los últimos 6 meses",
  "Tenés un herpes activo o una lesión en la piel sin cicatrizar",
  "Estás con rosácea o acné en brote",
  "Te expusiste mucho al sol o te hiciste camas solares esta semana",
  "Estás en tratamiento oncológico o tomás anticoagulantes",
];

/**
 * Como se trabaja: material, esterilizacion, ficha previa.
 *
 * Es lo que toda pagina de un profesional de salud dice y esta no decia.
 * No es un detalle administrativo: en un tratamiento que usa agujas y
 * hojas, saber que el material es descartable es la diferencia entre
 * reservar y no reservar — y para una clienta mayor, que ya vio de todo,
 * mas todavia.
 *
 * VALEN: esto describe TU forma de trabajar. Revisalo punto por punto y
 * corregi lo que no sea exacto. Un dato de higiene que no se cumple es
 * peor que no decir nada.
 */
export const PROTOCOLO_POR_DEFECTO: string[] = [
  "Agujas, hojas y guantes descartables, abiertos delante tuyo",
  "Instrumental esterilizado entre una clienta y la siguiente",
  "Antes de la primera sesión completamos tu ficha con antecedentes y alergias",
  "Cabina para vos sola, sin superposición de turnos",
];

export const CONFIGURACION_POR_DEFECTO: ConfiguracionWeb = {
  ...CONSULTORIO,
  beneficios: BENEFICIOS_POR_DEFECTO,
  glosario: GLOSARIO,
  preguntas: PREGUNTAS_POR_DEFECTO,
  contraindicaciones: CONTRAINDICACIONES_POR_DEFECTO,
  protocolo: PROTOCOLO_POR_DEFECTO,
};

/**
 * Que campos son texto suelto y cuales son JSON.
 *
 * Se declara aca y no se adivina al leer: si alguna vez queda un valor
 * corrupto en la base, un `JSON.parse` a ciegas tiraria abajo la pagina
 * entera en vez de caer en el valor por defecto.
 */
const CAMPOS_JSON = new Set([
  "beneficios",
  "glosario",
  "fotos",
  "preguntas",
  "contraindicaciones",
  "protocolo",
]);

type FilaConfig = { clave: string; valor: string };

export async function obtenerConfiguracion(): Promise<ConfiguracionWeb> {
  if (!hayBaseDeDatos) return CONFIGURACION_POR_DEFECTO;

  const supabase = await clienteServidor();
  const { data } = await supabase.from("configuracion").select("clave, valor");

  if (!data?.length) return CONFIGURACION_POR_DEFECTO;

  const guardado: Record<string, unknown> = {};

  for (const { clave, valor } of data as FilaConfig[]) {
    if (!(clave in CONFIGURACION_POR_DEFECTO)) continue; // clave desconocida: se ignora

    if (CAMPOS_JSON.has(clave)) {
      try {
        guardado[clave] = JSON.parse(valor);
      } catch {
        // Valor roto: se queda el del codigo en vez de romper la web.
      }
      continue;
    }

    // Un texto vacio no es una edicion, es un campo sin completar. Los
    // opcionales (referencia, transporte) si pueden quedar vacios a
    // proposito: ahi el vacio ES el valor y esconde el bloque.
    if (valor !== "" || OPCIONALES.has(clave)) guardado[clave] = valor;
  }

  return { ...CONFIGURACION_POR_DEFECTO, ...guardado };
}

/** Campos donde dejarlo vacio es una decision, no un olvido. */
const OPCIONALES = new Set(["referencia", "transporte"]);
