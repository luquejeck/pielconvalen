import "server-only";

import { AGENDA_POR_DEFECTO, type Agenda } from "./config";
import { hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";
import {
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

type FilaAgenda = {
  dias_habiles: number[];
  horarios: string[];
  anticipacion_horas: number;
  ventana_dias: number;
  pasos_base: string[];
};

export async function obtenerAgenda(): Promise<Agenda> {
  if (!hayBaseDeDatos) return AGENDA_POR_DEFECTO;

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("agenda")
    .select("dias_habiles, horarios, anticipacion_horas, ventana_dias, pasos_base")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return AGENDA_POR_DEFECTO;

  const fila = data as FilaAgenda;

  return {
    diasHabiles: fila.dias_habiles?.length
      ? fila.dias_habiles
      : AGENDA_POR_DEFECTO.diasHabiles,
    horarios: fila.horarios?.length
      ? fila.horarios
      : AGENDA_POR_DEFECTO.horarios,
    anticipacionMinimaHs:
      fila.anticipacion_horas ?? AGENDA_POR_DEFECTO.anticipacionMinimaHs,
    ventanaDias: fila.ventana_dias ?? AGENDA_POR_DEFECTO.ventanaDias,
    pasosBase: fila.pasos_base?.length
      ? fila.pasos_base
      : AGENDA_POR_DEFECTO.pasosBase,
  };
}
