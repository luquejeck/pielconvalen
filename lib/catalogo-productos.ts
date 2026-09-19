import "server-only";

import { CATEGORIAS, PRODUCTOS, type Categoria, type Producto } from "./productos";
import { hayBaseDeDatos } from "./supabase";
import { clienteServidor } from "./supabase-servidor";

/**
 * Los productos que ve la clienta, leidos de la base.
 *
 * Mismo trato que `obtenerTratamientos` en lib/catalogo.ts: manda la
 * base, y si no contesta o esta vacia mandan los de lib/productos.ts.
 * La web nunca se queda sin catalogo, ni cuando Supabase esta caido ni
 * el dia que Valen borre la ultima fila sin querer.
 *
 * SE LEE DE UNA VISTA Y NO DE `inventario`.
 *
 * `productos_publicos` tiene solo las columnas que puede ver cualquiera:
 * el costo de compra y el margen no estan ahi. Eso importa porque esto
 * corre con la clave publica —la que viaja en el JavaScript de la
 * pagina—, asi que lo que la vista deje pasar lo puede pedir cualquiera.
 * Con la vista, que el costo no salga no depende de que este archivo se
 * acuerde de no pedirlo: no hay columna que pedir.
 *
 * `inventario` en cambio le tiene revocado el acceso a `anon`. El primer
 * intento leia de ahi y la consulta fallaba siempre, asi que la web se
 * caia al respaldo en silencio: andaba, mostraba lo de siempre, y lo que
 * Valen cargara en el panel no iba a aparecer nunca.
 */
const COLUMNAS_PUBLICAS = [
  "id",
  "codigo",
  "marca",
  "producto",
  "categoria",
  "medida",
  "precio_venta",
  "precio_anterior",
  "descripcion",
  "beneficios",
  "foto",
  "destacado",
  "orden",
].join(", ");

type Fila = {
  id: string;
  codigo: string | null;
  marca: string;
  producto: string;
  categoria: string | null;
  medida: string | null;
  precio_venta: number | null;
  precio_anterior: number | null;
  descripcion: string | null;
  beneficios: string[] | null;
  foto: string | null;
  destacado: boolean | null;
  orden: number | null;
};

/**
 * La categoria de la fila, validada contra las que la web sabe dibujar.
 *
 * Es texto libre en la base: si Valen escribe "Serums" sin tilde, o una
 * categoria que el codigo no conoce, el producto caeria en un grupo que
 * `porCategoria()` nunca recorre y desapareceria de la web sin que nada
 * avise. Cayendo en la primera categoria al menos se ve, y el error se
 * nota mirando la pagina en vez de investigando por que falta uno.
 */
function categoriaValida(texto: string | null): Categoria {
  const limpio = (texto ?? "").trim();
  return (CATEGORIAS.find((c) => c === limpio) ?? CATEGORIAS[0]) as Categoria;
}

const aProducto = (f: Fila): Producto => ({
  id: f.id,
  codigo: f.codigo ?? undefined,
  foto: f.foto ?? undefined,
  marca: f.marca,
  nombre: f.producto,
  medida: f.medida ?? undefined,
  categoria: categoriaValida(f.categoria),
  precio: f.precio_venta ?? 0,
  precioAnterior: f.precio_anterior ?? undefined,
  descripcion: f.descripcion ?? "",
  beneficios: f.beneficios ?? [],
  destacado: f.destacado ?? false,
});

export async function obtenerProductos(): Promise<Producto[]> {
  if (!hayBaseDeDatos) return PRODUCTOS;

  try {
    const supabase = await clienteServidor();
    const { data, error } = await supabase
      .from("productos_publicos")
      /* Sin filtrar por `publicado`: la vista ya trae solo esos. Un
         producto en borrador existe en el deposito y no en la web, que
         es justo para lo que sirve. */
      .select(COLUMNAS_PUBLICAS)
      .order("orden");

    if (error || !data?.length) return PRODUCTOS;

    /*
      El orden final lo pone el codigo y no la base.

      `orden` ordena DENTRO de cada categoria, pero el recorrido de la
      web es el de la rutina —limpiar, tratar, hidratar, proteger— y ese
      vive en CATEGORIAS. Ordenar solo por `orden` mezclaria un
      limpiador con un protector si comparten numero, que pasa siempre
      porque la carga inicial numera cada categoria desde cero.

      Por eso se ordena primero por el lugar de la categoria en la
      rutina y recien despues por `orden`.
    */
    const filas = (data as unknown as Fila[]).slice().sort(
      (a, b) =>
        CATEGORIAS.indexOf(categoriaValida(a.categoria)) -
          CATEGORIAS.indexOf(categoriaValida(b.categoria)) ||
        (a.orden ?? 0) - (b.orden ?? 0) ||
        a.producto.localeCompare(b.producto, "es")
    );
    return filas.map(aProducto);
  } catch {
    /* Supabase caido, red cortada, columna que falta porque el schema
       no se corrio: en todos los casos la web muestra los de siempre. */
    return PRODUCTOS;
  }
}
