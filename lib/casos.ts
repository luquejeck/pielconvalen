import "server-only";

import { URL_SUPABASE, hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";

export type Caso = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tratamiento: string | null;
  antes: string;
  despues: string;
};

type FilaCaso = {
  id: string;
  titulo: string;
  descripcion: string | null;
  tratamiento: string | null;
  archivo_antes: string;
  archivo_despues: string;
};

/**
 * La direccion publica de un archivo del bucket `casos`.
 *
 * Se arma a mano y no con `getPublicUrl` del cliente para no tener que
 * instanciar Supabase solo para concatenar un string: el bucket es
 * publico, asi que la direccion es siempre la misma forma.
 */
export const urlCaso = (archivo: string) =>
  `${URL_SUPABASE}/storage/v1/object/public/casos/${archivo}`;

/**
 * Los casos publicados, para la web.
 *
 * Si la base no esta configurada o no hay ninguno cargado, devuelve una
 * lista vacia y la seccion entera no se muestra: mejor eso que un titulo
 * "Antes y despues" sobre un hueco.
 */
export async function obtenerCasos(): Promise<Caso[]> {
  if (!hayBaseDeDatos) return [];

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("casos")
    .select("id, titulo, descripcion, tratamiento, archivo_antes, archivo_despues")
    .eq("publicado", true)
    .order("orden");

  if (!data?.length) return [];

  return (data as FilaCaso[]).map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    tratamiento: c.tratamiento,
    antes: urlCaso(c.archivo_antes),
    despues: urlCaso(c.archivo_despues),
  }));
}
