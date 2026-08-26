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

export type ConfiguracionWeb = DatosConsultorio & {
  beneficios: Beneficio[];
  glosario: Record<string, string>;
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

export const CONFIGURACION_POR_DEFECTO: ConfiguracionWeb = {
  ...CONSULTORIO,
  beneficios: BENEFICIOS_POR_DEFECTO,
  glosario: GLOSARIO,
};

/**
 * Que campos son texto suelto y cuales son JSON.
 *
 * Se declara aca y no se adivina al leer: si alguna vez queda un valor
 * corrupto en la base, un `JSON.parse` a ciegas tiraria abajo la pagina
 * entera en vez de caer en el valor por defecto.
 */
const CAMPOS_JSON = new Set(["beneficios", "glosario", "fotos"]);

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
