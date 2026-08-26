#!/usr/bin/env node
/**
 * Prueba de punta a punta del circuito de cobro.
 *
 * Es la parte que mas cuesta verificar a ojo, porque "Atendida y
 * cobrada" escribe en TRES tablas de una: marca el turno, carga el
 * ingreso en economia y agrega la sesion a la ficha de la clienta. Si
 * algo de eso sale a medias, queda plata registrada de un turno que no
 * figura como atendido, o al reves.
 *
 * Crea sus propios datos, los marca como prueba y los borra al final,
 * pase lo que pase. Se puede correr las veces que haga falta.
 *
 *   node scripts/probar-cobro.mjs
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(".env.local", "utf8").split("\n")) {
  const corte = linea.indexOf("=");
  if (corte < 1 || linea.trim().startsWith("#")) continue;
  const clave = linea.slice(0, corte).trim();
  process.env[clave] ??= linea.slice(corte + 1).trim();
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/* Fecha lejana para no chocar con ningun turno real: la base tiene una
   restriccion unica sobre (fecha, hora). */
const FECHA = "2027-01-15";
const HORA = "10:00";
const MARCA = "PRUEBA AUTOMATICA — BORRAR";

let fallas = 0;
const paso = (ok, texto, detalle = "") => {
  if (!ok) fallas++;
  console.log(`  ${ok ? "ok  " : "FALLA"} ${texto}${detalle ? "  → " + detalle : ""}`);
};

let clienteId = null;
let turnoId = null;

try {
  console.log("\n  PREPARAR\n  ─────────────────────────────────────────────");

  const { data: cliente } = await sb
    .from("clientes")
    .insert({ nombre: MARCA, telefono: "1100000000" })
    .select()
    .single();
  clienteId = cliente?.id;
  paso(!!clienteId, "clienta de prueba creada");

  const { data: turno } = await sb
    .from("turnos")
    .insert({
      fecha: FECHA,
      hora: HORA,
      estado: "confirmado",
      cliente: MARCA,
      telefono: "1100000000",
      cliente_id: clienteId,
      tratamiento: "Higiene Facial Profunda",
      precio: 34000,
    })
    .select()
    .single();
  turnoId = turno?.id;
  paso(!!turnoId, "turno confirmado creado", `${FECHA} ${HORA}`);

  /* ---------------------------------------------------------------- */
  console.log("\n  COBRAR  (lo que hace «Atendida y cobrada»)\n  ─────────────────────────────────────────────");

  const { data: movId, error: errorCobro } = await sb.rpc(
    "registrar_turno_realizado",
    {
      p_turno_id: turnoId,
      p_monto: 34000,
      p_medio_pago: "Efectivo",
      p_notas: "Piel reactiva en la zona T",
    }
  );
  paso(!errorCobro, "el cobro se registro", errorCobro?.message ?? "");

  const { data: t1 } = await sb.from("turnos").select("*").eq("id", turnoId).single();
  paso(t1?.estado === "realizado", "el turno quedo como realizado", `estado = ${t1?.estado}`);
  paso(!!t1?.movimiento_id, "el turno recuerda que movimiento genero");
  paso(!!t1?.sesion_id, "el turno recuerda que sesion genero");

  const { data: mov } = await sb.from("movimientos").select("*").eq("id", movId).maybeSingle();
  paso(!!mov, "el ingreso aparece en Economia");
  paso(mov?.monto === 34000, "con el monto cobrado", `${mov?.monto}`);
  paso(mov?.medio_pago === "Efectivo", "con el medio de pago");
  paso(mov?.cliente_id === clienteId, "vinculado a la clienta");
  paso(mov?.fecha === FECHA, "con la fecha del turno", `${mov?.fecha}`);

  const { data: ses } = await sb.from("sesiones").select("*").eq("id", t1?.sesion_id).maybeSingle();
  paso(!!ses, "la sesion aparece en la ficha de la clienta");
  paso(ses?.precio === 34000, "con el precio");
  paso(ses?.notas === "Piel reactiva en la zona T", "con las observaciones");

  /* ---------------------------------------------------------------- */
  console.log("\n  COBRAR DOS VECES  (no tiene que duplicar)\n  ─────────────────────────────────────────────");

  const { error: errorRepetido } = await sb.rpc("registrar_turno_realizado", {
    p_turno_id: turnoId,
    p_monto: 34000,
  });
  paso(!!errorRepetido, "el segundo cobro se rechaza", errorRepetido?.message ?? "NO SE RECHAZO");

  const { count: cuantosMov } = await sb
    .from("movimientos")
    .select("*", { count: "exact", head: true })
    .eq("cliente_id", clienteId);
  paso(cuantosMov === 1, "sigue habiendo un solo ingreso", `hay ${cuantosMov}`);

  /* ---------------------------------------------------------------- */
  console.log("\n  DESHACER  (lo que hace «Deshacer el cobro»)\n  ─────────────────────────────────────────────");

  const { error: errorAnular } = await sb.rpc("anular_turno_realizado", {
    p_turno_id: turnoId,
  });
  paso(!errorAnular, "se deshizo", errorAnular?.message ?? "");

  const { data: t2 } = await sb.from("turnos").select("*").eq("id", turnoId).single();
  paso(t2?.estado === "confirmado", "el turno volvio a confirmado", `estado = ${t2?.estado}`);
  paso(t2?.movimiento_id === null, "sin movimiento colgado");
  paso(t2?.sesion_id === null, "sin sesion colgada");

  const { data: movBorrado } = await sb.from("movimientos").select("id").eq("id", movId).maybeSingle();
  paso(!movBorrado, "el ingreso desaparecio de Economia");

  const { data: sesBorrada } = await sb.from("sesiones").select("id").eq("id", t1?.sesion_id).maybeSingle();
  paso(!sesBorrada, "la sesion desaparecio de la ficha");
} finally {
  /* ---------------------------------------------------------------- */
  console.log("\n  LIMPIAR\n  ─────────────────────────────────────────────");

  if (turnoId) await sb.from("turnos").delete().eq("id", turnoId);
  if (clienteId) await sb.from("clientes").delete().eq("id", clienteId);

  const restos = {};
  for (const tabla of ["turnos", "clientes", "sesiones", "movimientos"]) {
    const { count } = await sb.from(tabla).select("*", { count: "exact", head: true });
    restos[tabla] = count;
  }
  const limpio = Object.values(restos).every((n) => n === 0);
  paso(limpio, "la base quedo como estaba", JSON.stringify(restos));

  console.log(
    fallas === 0
      ? "\n  TODO BIEN — el circuito de cobro funciona de punta a punta.\n"
      : `\n  ${fallas} FALLA(S). Ver arriba.\n`
  );
  process.exit(fallas === 0 ? 0 : 1);
}
