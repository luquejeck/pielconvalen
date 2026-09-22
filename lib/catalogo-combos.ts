import "server-only";

import { COMBOS, type DefinicionCombo } from "./combos";
import { hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";

/**
 * Los combos que ve la clienta, leidos de la base.
 *
 * Mismo trato que el catalogo de productos: manda la base, y si no
 * contesta o esta vacia manda lib/combos.ts. La web nunca se queda sin
 * nada que ofrecer ni muestra un combo a medias.
 *
 * SE LEE DE UNA VISTA Y NO DE `combos`.
 * `combos_publicos` trae solo los publicados y solo lo que se anuncia
 * —nombre, codigos y descuento—. Esto corre con la clave publica, la que
 * viaja en el JavaScript de la pagina, asi que lo que la vista deje
 * pasar lo puede pedir cualquiera.
 *
 * EL DESCUENTO CAMBIA DE UNIDAD ACA.
 * En la base es entero —10 es 10%, que es lo que Valen escribe y lo que
 * dice el cartel— y en el codigo es fraccion, porque es lo que se
 * multiplica. La traduccion pasa una sola vez y en un solo lugar.
 */
type Fila = {
  slug: string;
  nombre: string;
  descripcion: string | null;
  descuento: number | null;
  orden: number | null;
  codigos: string[] | null;
};

export async function obtenerCombos(): Promise<DefinicionCombo[]> {
  if (!hayBaseDeDatos) return COMBOS;

  try {
    const supabase = await clienteServidor();
    const { data, error } = await supabase
      .from("combos_publicos")
      .select("slug, nombre, descripcion, descuento, orden, codigos")
      .order("orden");

    /*
      Sin filas NO es lo mismo que un error.

      Si Valen despublica todos sus combos, la web no tiene que mostrar
      el de respaldo: despublicar tiene que poder significar "no quiero
      ninguno". Por eso el respaldo entra solo cuando la consulta falla
      —base caida, o el dia que este archivo llegue antes que
      schema-18-combos.sql—, que es cuando no sabemos nada.
    */
    if (error) return COMBOS;
    if (!data) return [];

    return (data as unknown as Fila[])
      .map((f) => ({
        slug: f.slug,
        nombre: f.nombre,
        descripcion: f.descripcion ?? "",
        codigos: f.codigos ?? [],
        descuento: (f.descuento ?? 0) / 100,
      }))
      /* Un combo sin descuento o sin productos no se ofrece: seria la
         suma de dos precios con otro nombre. */
      .filter((c) => c.descuento > 0 && c.codigos.length >= 2);
  } catch {
    return COMBOS;
  }
}
