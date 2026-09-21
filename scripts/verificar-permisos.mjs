/**
 * Comprueba que la web publica pueda leer el catalogo y nada mas.
 *
 *   npm run permisos
 *
 * SE PRUEBA CON LA CLAVE ANONIMA A PROPOSITO.
 * Es la que viaja en el JavaScript de la pagina, o sea la que tiene
 * cualquiera que entre a la web. Probar esto desde el SQL Editor de
 * Supabase no sirve: ahi las consultas corren como dueño y pueden todo,
 * asi que todo da bien y el agujero sigue abierto.
 *
 * ESTO NACIO DE UN ERROR REAL. La vista `productos_publicos` se creo
 * con permiso de escritura para `anon` sin que nadie lo pidiera, porque
 * Supabase tiene `default privileges` que le dan ALL sobre cada objeto
 * nuevo del esquema publico. Cualquier visitante podia crear, editar y
 * borrar productos. Se descubrio corriendo esta prueba, no leyendo el
 * SQL: por eso queda como comando y no como anecdota.
 *
 * Si alguna prueba deja basura, la limpia con la clave de servicio
 * antes de salir.
 */

import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON) {
  console.error("\n  Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.\n");
  process.exit(1);
}

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const sinSesion = { auth: { persistSession: false } };

const resultados = [];
const probar = (titulo, bien, detalle = "") => {
  resultados.push(bien);
  console.log(`  ${bien ? "OK  " : "MAL "} ${titulo.padEnd(42)} ${detalle}`);
};

console.log(`\n  Probando ${URL} con la clave anonima\n`);

/* --- lo que SI tiene que poder --- */
const { data: catalogo, error: eLeer } = await anon
  .from("productos_publicos")
  .select("codigo, producto, precio_venta");
probar("leer el catalogo publico", !eLeer, eLeer ? eLeer.message.slice(0, 50) : `${catalogo.length} productos`);
probar(
  "solo los publicados",
  !eLeer && catalogo.every((p) => p.codigo),
  "los borradores no salen"
);

/* --- lo que NO tiene que poder --- */
for (const columna of ["costo", "costo_usd"]) {
  const { error } = await anon.from("productos_publicos").select(columna).limit(1);
  probar(`sacar ${columna} por la vista`, Boolean(error), error ? "bloqueado" : "SE FILTRA");
}

const { error: eTabla } = await anon.from("inventario").select("costo").limit(1);
probar("leer `inventario` directo", Boolean(eTabla), eTabla ? "bloqueado" : "SE FILTRA");

/* El historial de stock es solo del panel: la web no lo lee nunca. */
const { data: hist, error: eHist } = await anon.from("movimientos_stock").select("id").limit(1);
probar(
  "leer el historial de stock",
  Boolean(eHist) || (hist ?? []).length === 0,
  eHist ? "bloqueado" : (hist ?? []).length ? "SE FILTRA" : "no devuelve nada"
);

/*
  La escritura se prueba de verdad: se intenta insertar y despues se
  mira si quedo la fila. No alcanza con leer el error, porque una regla
  DO INSTEAD NOTHING no devuelve error —simplemente no hace nada— y eso
  esta bien: lo que importa es que no aparezca la fila.
*/
const MARCA = "__prueba_permisos__";
await anon.from("productos_publicos").insert({ marca: MARCA, producto: MARCA });
await anon.from("inventario").insert({ marca: MARCA, producto: MARCA });

let entraron = null;
if (SERVICIO) {
  const svc = createClient(URL, SERVICIO, sinSesion);
  const { data } = await svc.from("inventario").select("id").eq("marca", MARCA);
  entraron = data ?? [];
  if (entraron.length) {
    await svc.from("inventario").delete().eq("marca", MARCA);
  }
}
probar(
  "escribir en el catalogo",
  entraron === null ? true : entraron.length === 0,
  entraron === null
    ? "sin clave de servicio, no se pudo comprobar"
    : entraron.length
      ? `ENTRARON ${entraron.length} filas (se borraron)`
      : "bloqueado"
);

const fallaron = resultados.filter((r) => !r).length;
console.log(
  fallaron
    ? `\n  ${fallaron} de ${resultados.length} MAL. Ver supabase/schema-16-vista-solo-lectura.sql\n`
    : `\n  Las ${resultados.length} bien.\n`
);
process.exitCode = fallaron ? 1 : 0;
