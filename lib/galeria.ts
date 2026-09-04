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

/** Un video propio pesa lo mismo que una foto en esta tabla: ver el tipo. */
export type VideoGaleria = FotoGaleria;

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

  return await publicadas("foto");
}

/**
 * Los videos propios de "Cómo es una sesión".
 *
 * Son archivos nuestros, servidos desde nuestro bucket, y por eso se ven
 * sin el marco de Instagram: ni la cabecera con el arroba, ni el pie con
 * los corazones, ni el boton que se lleva a la clienta a otra
 * aplicacion. Un `<video>` y nada mas.
 *
 * Mientras no haya ninguno subido, la seccion cae en los reels
 * embebidos, que traen el marco pero no necesitan que Valen exporte y
 * suba nada. Ver `components/Videos.tsx`.
 */
export async function obtenerVideos(): Promise<VideoGaleria[]> {
  if (!hayBaseDeDatos) return [];
  return await publicadas("video");
}

/**
 * Lo publicado de un tipo, ordenado.
 *
 * Si la columna `tipo` todavia no existe —la migracion se corre a mano
 * en Supabase— la consulta falla y esto devuelve vacio, que es
 * exactamente lo que hacia antes de que hubiera videos: la seccion no
 * se muestra y la pagina sigue en pie.
 */
async function publicadas(tipo: "foto" | "video"): Promise<FotoGaleria[]> {
  const supabase = await clienteServidor();
  const { data } = await supabase
    .from("galeria")
    .select("id, titulo, descripcion, archivo")
    .eq("publicado", true)
    .eq("tipo", tipo)
    .order("orden");

  if (!data?.length) return [];

  return data.map((f) => ({
    id: f.id,
    titulo: f.titulo,
    descripcion: f.descripcion,
    url: urlFoto(f.archivo),
  }));
}
