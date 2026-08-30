import "server-only";

import {
  AGENDA_POR_DEFECTO,
  HORARIOS_POR_DEFECTO,
  type Agenda,
} from "./config";
import { hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";
import {
  CONSULTA,
  TRATAMIENTOS_POR_DEFECTO,
  type Tratamiento,
} from "./tratamientos";

/**
 * Lee el catalogo desde la base. Si la base no esta configurada o esta
 * vacia, devuelve los valores del codigo: la web nunca se queda sin datos.
 */

type FilaTratamiento = {
  id: string;
  nombre: string;
  nombre_corto: string;
  precio: number;
  duracion: string;
  extras: string[];
  destacado: boolean;
};

export async function obtenerTratamientos(): Promise<Tratamiento[]> {
  if (!hayBaseDeDatos) return TRATAMIENTOS_POR_DEFECTO;

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("tratamientos")
    .select("id, nombre, nombre_corto, precio, duracion, extras, destacado")
    .eq("activo", true)
    .order("orden");

  if (!data?.length) return TRATAMIENTOS_POR_DEFECTO;

  return (data as FilaTratamiento[]).map((t) => ({
    id: t.id,
    nombre: t.nombre,
    nombreCorto: t.nombre_corto,
    precio: t.precio,
    duracion: t.duracion,
    extras: t.extras ?? [],
    destacado: t.destacado,
  }));
}

/**
 * Lo que ve la clienta: el catalogo mas la consulta de evaluacion.
 *
 * La consulta no vive en la base (no es algo que Valen edite) y es la
 * unica forma de sacar turno desde la web: el catalogo se publica para
 * mostrar los precios, no para elegir. Que tratamiento se hace lo define
 * ella al atender. El panel de admin usa `obtenerTratamientos`.
 */
export async function obtenerTratamientosPublicos(): Promise<Tratamiento[]> {
  return [...(await obtenerTratamientos()), CONSULTA];
}

type FilaAgenda = {
  dias_habiles: number[] | null;
  /** La lista unica de antes. Hoy solo sirve de respaldo. */
  horarios: string[] | null;
  /** { "1": ["09:00", ...] } — las claves de jsonb siempre son texto */
  horarios_por_dia: Record<string, string[]> | null;
  anticipacion_horas: number | null;
  ventana_dias: number | null;
  como_trabajo: string | null;
};

export async function obtenerAgenda(): Promise<Agenda> {
  if (!hayBaseDeDatos) return AGENDA_POR_DEFECTO;

  const supabase = await clienteServidor();
  /*
    Se piden todas las columnas a proposito, en vez de nombrarlas una por
    una: si el codigo nuevo sale antes de correr la migracion, nombrar
    una columna que todavia no existe hace fallar la consulta ENTERA y la
    web se queda sin agenda. Con `*` llega lo que haya y cada campo cae
    solo en su valor por defecto.
  */
  const { data } = await supabase
    .from("agenda")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return AGENDA_POR_DEFECTO;

  const fila = data as FilaAgenda;

  const diasHabiles = fila.dias_habiles?.length
    ? fila.dias_habiles
    : AGENDA_POR_DEFECTO.diasHabiles;

  /*
    Los horarios de cada dia, con dos respaldos encadenados: lo propio
    del dia, si no la lista unica que se usaba antes para toda la semana
    —asi una agenda vieja sigue funcionando igual que siempre— y si no
    los horarios de arranque del codigo.
  */
  const horariosPorDia: Record<number, string[]> = {};
  for (const dia of diasHabiles) {
    const propios = fila.horarios_por_dia?.[String(dia)];
    horariosPorDia[dia] = propios?.length
      ? [...propios].sort()
      : fila.horarios?.length
        ? fila.horarios
        : HORARIOS_POR_DEFECTO;
  }

  return {
    diasHabiles,
    horariosPorDia,
    anticipacionMinimaHs:
      fila.anticipacion_horas ?? AGENDA_POR_DEFECTO.anticipacionMinimaHs,
    ventanaDias: fila.ventana_dias ?? AGENDA_POR_DEFECTO.ventanaDias,
    comoTrabajo: fila.como_trabajo?.trim()
      ? fila.como_trabajo
      : AGENDA_POR_DEFECTO.comoTrabajo,
  };
}
