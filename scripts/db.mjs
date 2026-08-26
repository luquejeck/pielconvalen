#!/usr/bin/env node
/**
 * Consola de mantenimiento de la base.
 *
 * Existe para no tener que pasar archivos SQL a mano cada vez que hay que
 * mirar o limpiar algo.
 *
 * ---------------------------------------------------------------------
 * POR QUE ESTE ARCHIVO NO ES PARTE DE LA WEB
 *
 * Usa SUPABASE_SERVICE_ROLE_KEY, que SE SALTEA EL RLS. Con esa clave no
 * existen las politicas: se lee y se escribe todo. Por eso:
 *
 *   · vive en /scripts y no en /app ni en /lib: nada de la web lo
 *     importa, ni por accidente;
 *   · la clave se lee del entorno y no se escribe nunca en pantalla;
 *   · los borrados piden --confirmar. Sin esa palabra solo cuentan.
 *
 * La web sigue usando la clave publica y respetando el RLS. Esto es una
 * herramienta de mantenimiento, no una puerta de atras para la app.
 * ---------------------------------------------------------------------
 *
 * Uso:
 *   node scripts/db.mjs contar
 *   node scripts/db.mjs ver turnos
 *   node scripts/db.mjs ver clientes --limite 5
 *   node scripts/db.mjs vaciar turnos clientes --confirmar
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/* ---------------------------------------------------------------------
 * Entorno
 * ------------------------------------------------------------------ */

// Se lee .env.local a mano: este script corre fuera de Next, que es
// quien normalmente carga ese archivo.
function cargarEntorno() {
  try {
    for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
      const limpia = linea.trim();
      if (!limpia || limpia.startsWith("#")) continue;
      const corte = limpia.indexOf("=");
      if (corte < 1) continue;
      const clave = limpia.slice(0, corte).trim();
      if (!process.env[clave]) {
        process.env[clave] = limpia.slice(corte + 1).trim();
      }
    }
  } catch {
    // Sin .env.local se sigue: puede venir del entorno del sistema.
  }
}

cargarEntorno();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const LLAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !LLAVE) {
  console.error(`
Falta la clave de servicio.

  1. Supabase → Project Settings → API Keys
  2. Copiá la clave "service_role" (NO la "anon")
  3. Pegala en .env.local, en un renglón nuevo:

       SUPABASE_SERVICE_ROLE_KEY=eyJ...

Sin prefijo NEXT_PUBLIC_: con ese prefijo la clave viajaría al navegador
de cualquier visitante y quedaría a la vista de todos.
`);
  process.exit(1);
}

const sb = createClient(URL, LLAVE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* ---------------------------------------------------------------------
 * Tablas conocidas, agrupadas por lo que son
 * ------------------------------------------------------------------ */

/** Lo que carga el uso diario. Es lo que tiene sentido vaciar. */
const DE_USO = [
  "turnos",
  "clientes",
  "sesiones",
  "movimientos",
  "inventario",
  "gastos_fijos",
  "dias_cerrados",
];

/** Lo que Valen configuro. Vaciar esto deja la web sin datos. */
const DE_CONFIGURACION = ["tratamientos", "agenda", "configuracion"];

const TODAS = [...DE_USO, ...DE_CONFIGURACION];

/* ---------------------------------------------------------------------
 * Comandos
 * ------------------------------------------------------------------ */

async function contar() {
  console.log("\n  TABLA              FILAS");
  console.log("  ─────────────────────────");

  for (const tabla of TODAS) {
    const { count, error } = await sb
      .from(tabla)
      .select("*", { count: "exact", head: true });

    const valor = error ? `error: ${error.message.slice(0, 30)}` : count;
    const marca = DE_CONFIGURACION.includes(tabla) ? " ·" : "  ";
    console.log(`${marca} ${tabla.padEnd(18)} ${valor}`);
  }

  console.log("\n  · = configuración de la web, no son datos de uso\n");
}

async function ver(tabla, limite) {
  if (!TODAS.includes(tabla)) {
    console.error(`\n  No conozco la tabla "${tabla}".`);
    console.error(`  Conocidas: ${TODAS.join(", ")}\n`);
    process.exit(1);
  }

  const { data, error } = await sb.from(tabla).select("*").limit(limite);
  if (error) {
    console.error(`\n  Error: ${error.message}\n`);
    process.exit(1);
  }

  console.log(`\n  ${tabla} — ${data.length} fila(s)\n`);
  console.log(JSON.stringify(data, null, 2));
  console.log();
}

async function vaciar(tablas, confirmado) {
  const desconocidas = tablas.filter((t) => !TODAS.includes(t));
  if (desconocidas.length) {
    console.error(`\n  No conozco: ${desconocidas.join(", ")}\n`);
    process.exit(1);
  }

  // Primero se cuenta y se dice en voz alta que se va a borrar.
  console.log("\n  Se va a vaciar:\n");
  for (const tabla of tablas) {
    const { count } = await sb
      .from(tabla)
      .select("*", { count: "exact", head: true });
    const aviso = DE_CONFIGURACION.includes(tabla)
      ? "   ← ojo: esto es configuración de la web"
      : "";
    console.log(`    ${tabla.padEnd(18)} ${count} fila(s)${aviso}`);
  }

  if (!confirmado) {
    console.log("\n  No se borró nada. Agregá --confirmar para hacerlo.\n");
    return;
  }

  console.log();
  for (const tabla of tablas) {
    // PostgREST exige un filtro en los delete. `id` no sirve para todas
    // —`agenda` usa entero, `dias_cerrados` no tiene id— asi que se
    // filtra por una columna que existe siempre y siempre es verdadera.
    const columna = tabla === "dias_cerrados" ? "fecha" : "id";
    const { error } = await sb.from(tabla).delete().not(columna, "is", null);

    console.log(
      error ? `    ${tabla}: ERROR — ${error.message}` : `    ${tabla}: vaciada`
    );
  }
  console.log();
}

/* ---------------------------------------------------------------------
 * Entrada
 * ------------------------------------------------------------------ */

const [comando, ...resto] = process.argv.slice(2);
const confirmado = resto.includes("--confirmar");
const argumentos = resto.filter((a) => !a.startsWith("--"));

const indiceLimite = resto.indexOf("--limite");
const limite = indiceLimite >= 0 ? Number(resto[indiceLimite + 1]) || 20 : 20;

switch (comando) {
  case "contar":
    await contar();
    break;
  case "ver":
    await ver(argumentos[0], limite);
    break;
  case "vaciar":
    await vaciar(
      argumentos.filter((a) => a !== String(limite)),
      confirmado
    );
    break;
  default:
    console.log(`
  Consola de la base — Piel con Valen

    node scripts/db.mjs contar
    node scripts/db.mjs ver turnos
    node scripts/db.mjs ver clientes --limite 5
    node scripts/db.mjs vaciar turnos clientes             (solo cuenta)
    node scripts/db.mjs vaciar turnos clientes --confirmar (borra)
`);
}
