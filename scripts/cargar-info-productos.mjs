/**
 * Carga en `inventario` lo que dice scripts/info-productos.json:
 * "como se usa" de cada producto y las correcciones de descripcion,
 * beneficios, marca y categoria.
 *
 * POR DEFECTO NO ESCRIBE NADA: muestra que cambiaria, campo por campo.
 * Recien con `--aplicar` guarda. La base es la misma que la de la web
 * publicada, asi que lo que se aplica se ve en la web al instante.
 *
 *     npm run info-productos              # mirar
 *     npm run info-productos -- --aplicar # guardar
 *
 * Necesita schema-20-modo-de-uso.sql corrido: sin la columna
 * `modo_uso`, avisa y no toca nada.
 *
 * Usa la clave `service_role` de .env.local, que saltea RLS. Busca cada
 * producto por su codigo; si no lo encuentra, lo dice y sigue.
 */
import { readFileSync } from "node:fs";

const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!BASE || !CLAVE) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const aplicar = process.argv.includes("--aplicar");
const cabeceras = {
  apikey: CLAVE,
  Authorization: `Bearer ${CLAVE}`,
  "Content-Type": "application/json",
};

const cambios = JSON.parse(readFileSync(new URL("./info-productos.json", import.meta.url), "utf8"));
const CAMPOS = ["marca", "categoria", "descripcion", "beneficios", "modo_uso"];

const r = await fetch(
  `${BASE}/rest/v1/inventario?select=id,codigo,marca,producto,${CAMPOS.filter((c) => c !== "marca").join(",")}`,
  { headers: cabeceras }
);
/* Se sale con `exitCode` y no con `process.exit()`: cortar el proceso
   con la respuesta de fetch todavia abierta hace que Node en Windows
   tire un "Assertion failed" que asusta y no significa nada. */
if (!r.ok) {
  const texto = await r.text();
  console.error(
    texto.includes("modo_uso")
      ? "La columna `modo_uso` no existe todavia: corré supabase/schema-20-modo-de-uso.sql primero."
      : `No se pudo leer el inventario: ${texto}`
  );
  process.exitCode = 1;
}
const filas = r.ok ? await r.json() : [];
const porCodigo = new Map(filas.map((f) => [f.codigo, f]));

const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
let pendientes = 0;

for (const c of r.ok ? cambios : []) {
  const fila = porCodigo.get(c.codigo);
  if (!fila) {
    console.log(`\n${c.codigo}: NO ESTA en el inventario, se saltea.`);
    continue;
  }

  const nuevo = {};
  for (const campo of CAMPOS) {
    if (campo in c && !igual(c[campo], fila[campo])) nuevo[campo] = c[campo];
  }
  if (Object.keys(nuevo).length === 0) continue;

  pendientes++;
  console.log(`\n${c.codigo} · ${fila.marca} ${fila.producto}`);
  for (const [campo, valor] of Object.entries(nuevo)) {
    console.log(`  ${campo}:`);
    console.log(`    antes:  ${JSON.stringify(fila[campo] ?? "")}`);
    console.log(`    ahora:  ${JSON.stringify(valor)}`);
  }

  if (!aplicar) continue;

  const u = await fetch(`${BASE}/rest/v1/inventario?id=eq.${fila.id}`, {
    method: "PATCH",
    headers: { ...cabeceras, Prefer: "return=minimal" },
    body: JSON.stringify({ ...nuevo, actualizado_en: new Date().toISOString() }),
  });
  console.log(u.ok ? "  -> guardado" : `  -> ERROR: ${await u.text()}`);
}

if (r.ok) console.log(
  pendientes === 0
    ? "\nNada para cambiar: la base ya dice lo mismo que el archivo."
    : aplicar
      ? `\n${pendientes} productos actualizados.`
      : `\n${pendientes} productos con cambios. Para guardarlos: npm run info-productos -- --aplicar`
);
