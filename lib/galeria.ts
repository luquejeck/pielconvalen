import "server-only";

import { URL_SUPABASE, hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";

/**
 * El bucket publico donde viven las fotos de la galeria.
 *
 * Se llama `casos` por historia: se creo para una seccion de
 * antes/despues que despues se quito. Se reusa tal cual a proposito —
 * cambiarle el nombre obliga a reescribir las politicas de
 * `storage.objects`, que es exactamente la operacion que una vez choco
 * con el servicio de Storage y corto con un deadlock. El nombre del
 * bucket no lo ve nadie.
 */
const BUCKET = "casos";

export type FotoGaleria = {
  id: string;
  titulo: string;
  descripcion: string | null;
  url: string;
};

export const urlFoto = (archivo: string) =>
  `${URL_SUPABASE}/storage/v1/object/public/${BUCKET}/${archivo}`;

export { BUCKET as BUCKET_GALERIA };

/**
 * Las fotos publicadas, para la web.
 *
 * Si no hay ninguna, devuelve vacio y la seccion entera no se muestra:
 * mejor eso que un titulo sobre un hueco.
 */
export async function obtenerGaleria(): Promise<FotoGaleria[]> {
  if (!hayBaseDeDatos) return [];

  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("galeria")
    .select("id, titulo, descripcion, archivo")
    .eq("publicado", true)
    .order("orden");

  if (!data?.length) return [];

  return data.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    url: urlFoto(f.archivo),
  }));
}
