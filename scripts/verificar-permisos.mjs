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

/*
  El stock si sale y el costo no.

  `cantidad` se sumo a la vista el 22-09-2026 (schema-19) para que la
  web deje de ofrecer lo que ya no hay. No es un dato de la casa: le
  sirve a la clienta. El costo y el margen siguen afuera, que es la
  linea que importa.
*/
const { error: eStock } = await anon.from("productos_publicos").select("cantidad").limit(1);
const faltaStock = eStock?.code === "42703" || eStock?.code === "PGRST204";
probar(
  "ver cuantas unidades quedan",
  !eStock || faltaStock,
  !eStock ? "se ve" : faltaStock ? "falta correr schema-19-stock-en-la-web.sql" : eStock.message.slice(0, 40)
);

/* --- lo que NO tiene que poder --- */
for (const columna of ["costo", "costo_usd"]) {
  const { error } = await anon.from("productos_publicos").select(columna).limit(1);
  probar(`sacar ${columna} por la vista`, Boolean(error), error ? "bloqueado" : "SE FILTRA");
}

const { error: eTabla } = await anon.from("inventario").select("costo").limit(1);
probar("leer `inventario` directo", Boolean(eTabla), eTabla ? "bloqueado" : "SE FILTRA");

/*
  Los combos: la web lee la vista y nada mas.

  `combos` y `combo_productos` son del panel. La vista solo trae los
  publicados y lo que se anuncia —nombre, codigos y descuento—, sin
  costos ni margenes.
*/
const { error: eCombos } = await anon.from("combos_publicos").select("slug, descuento").limit(1);
/* Que la vista todavia no exista no es un agujero: es schema-18 sin
   correr. Se avisa y no se cuenta como falla. 42P01 es el codigo de
   Postgres; PGRST205 el de PostgREST, que es el que llega por HTTP. */
const faltaLaVista = eCombos?.code === "42P01" || eCombos?.code === "PGRST205";
probar(
  "leer los combos publicos",
  !eCombos || faltaLaVista,
  !eCombos ? "se leen" : faltaLaVista ? "falta correr schema-18-combos.sql" : eCombos.message.slice(0, 40)
);

for (const tabla of ["combos", "combo_productos"]) {
  const { data, error } = await anon.from(tabla).select("*").limit(1);
  probar(
    `leer \`${tabla}\` directo`,
    Boolean(error) || (data ?? []).length === 0,
    error ? "bloqueado" : (data ?? []).length ? "SE FILTRA" : "no devuelve nada"
  );
}

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
await anon.from("movimientos_stock").insert({ cantidad: 1, motivo: "ajuste", nota: MARCA });
await anon.from("combos").insert({ slug: MARCA, nombre: MARCA, descuento: 10 });
await anon.from("combos_publicos").insert({ slug: MARCA, nombre: MARCA, descuento: 10 });

let entraron = null;
let entraronHistorial = null;
let entraronCombos = null;
if (SERVICIO) {
  const svc = createClient(URL, SERVICIO, sinSesion);
  const { data } = await svc.from("inventario").select("id").eq("marca", MARCA);
  entraron = data ?? [];
  if (entraron.length) {
    await svc.from("inventario").delete().eq("marca", MARCA);
  }
  /* El historial no tiene update ni delete para nadie, pero la clave
     de servicio si puede limpiar lo que haya dejado la prueba. */
  const { data: c } = await svc.from("combos").select("id").eq("slug", MARCA);
  entraronCombos = c ?? [];
  if (entraronCombos.length) {
    await svc.from("combos").delete().eq("slug", MARCA);
  }
  const { data: h } = await svc.from("movimientos_stock").select("id").eq("nota", MARCA);
  entraronHistorial = h ?? [];
  if (entraronHistorial.length) {
    await svc.from("movimientos_stock").delete().eq("nota", MARCA);
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

probar(
  "escribir en el historial de stock",
  entraronHistorial === null ? true : entraronHistorial.length === 0,
  entraronHistorial === null
    ? "sin clave de servicio, no se pudo comprobar"
    : entraronHistorial.length
      ? `ENTRARON ${entraronHistorial.length} filas (se borraron)`
      : "bloqueado"
);

probar(
  "escribir combos",
  entraronCombos === null ? true : entraronCombos.length === 0,
  entraronCombos === null
    ? "sin clave de servicio, no se pudo comprobar"
    : entraronCombos.length
      ? `ENTRARON ${entraronCombos.length} filas (se borraron)`
      : "bloqueado"
);

/*
  LOS PEDIDOS DE LA TIENDA (schema-21).

  Al reves que el resto: la visitante SI puede registrar uno —es lo que
  pasa al tocar "Enviar pedido por WhatsApp"—, pero no leer ninguno, ni
  borrarlos, ni registrarlo ya marcado como recibido. Se prueba con un
  pedido de verdad que despues se borra con la clave de servicio.
*/
const PEDIDO = "P-PRUEBA";
const { error: eRegistrar } = await anon
  .from("pedidos")
  .insert({ codigo: PEDIDO, items: [], total: 0 });
const faltaPedidos = eRegistrar && /pedidos|relation|schema cache/i.test(eRegistrar.message) && eRegistrar.code !== "42501";
if (faltaPedidos) {
  probar("pedidos de la tienda", true, "falta correr schema-21-pedidos-web.sql");
} else {
  probar("registrar un pedido", !eRegistrar, eRegistrar ? eRegistrar.message.slice(0, 50) : "se puede");

  const { data: leidos, error: eLeerPedidos } = await anon.from("pedidos").select("codigo").limit(5);
  probar(
    "leer los pedidos",
    Boolean(eLeerPedidos) || (leidos ?? []).length === 0,
    eLeerPedidos ? "bloqueado" : (leidos ?? []).length ? "SE FILTRAN" : "no devuelve nada"
  );

  const { error: eMarcado } = await anon
    .from("pedidos")
    .insert({ codigo: "P-PRUEB2", items: [], total: 0, estado: "recibido" });
  await anon.from("pedidos").delete().eq("codigo", PEDIDO);

  if (SERVICIO) {
    const svc = createClient(URL, SERVICIO, sinSesion);
    const { data: siguen } = await svc.from("pedidos").select("codigo").in("codigo", [PEDIDO, "P-PRUEB2"]);
    const codigos = (siguen ?? []).map((f) => f.codigo);
    probar(
      "borrar pedidos",
      codigos.includes(PEDIDO) || Boolean(eRegistrar),
      codigos.includes(PEDIDO) ? "bloqueado" : "SE PUDO BORRAR"
    );
    probar(
      "registrar un pedido ya recibido",
      Boolean(eMarcado) && !codigos.includes("P-PRUEB2"),
      eMarcado ? "bloqueado" : "ENTRO"
    );
    await svc.from("pedidos").delete().in("codigo", [PEDIDO, "P-PRUEB2"]);
  } else {
    probar("borrar pedidos", true, "sin clave de servicio, no se pudo comprobar");
  }
}

/*
  LAS GIFTCARDS (schema-22).

  Como los pedidos: la visitante registra una nueva, pero no lee
  ninguna, ni la registra ya cobrada, ni se la marca como cobrada. Y
  puede ver UNA tarjeta sabiendo su codigo, con `giftcard_publica`, que
  de una sin cobrar devuelve el estado y nada mas.

  La prueba de escritura corre solo con la clave de servicio: sin ella
  no hay como borrar la giftcard de prueba, y le quedaria a Valen en
  "para cobrar".
*/
const { data: vacia, error: eFuncion } = await anon.rpc("giftcard_publica", { p_codigo: "G-NOEXIS" });
const faltaGiftcards = eFuncion && (eFuncion.code === "PGRST202" || eFuncion.code === "42883");
if (faltaGiftcards) {
  probar("giftcards", true, "falta correr schema-22-giftcards.sql");
} else {
  probar(
    "buscar una tarjeta que no existe",
    !eFuncion && (vacia ?? []).length === 0,
    eFuncion ? eFuncion.message.slice(0, 50) : "no devuelve nada"
  );

  const { data: leidas, error: eLeerGift } = await anon.from("giftcards").select("codigo").limit(5);
  probar(
    "listar las giftcards",
    Boolean(eLeerGift) || (leidas ?? []).length === 0,
    eLeerGift ? "bloqueado" : (leidas ?? []).length ? "SE FILTRAN" : "no devuelve nada"
  );

  if (SERVICIO) {
    const svc = createClient(URL, SERVICIO, sinSesion);
    const GIFT = "G-PRUEBA";
    const GIFT_COBRADA = "G-PRUEB2";
    const prueba = { para: MARCA, de: MARCA, monto: 1000 };

    const { error: eGift } = await anon.from("giftcards").insert({ ...prueba, codigo: GIFT });
    probar("registrar una giftcard", !eGift, eGift ? eGift.message.slice(0, 50) : "se puede");

    const { data: tarjeta } = await anon.rpc("giftcard_publica", { p_codigo: GIFT });
    probar(
      "ver una sin cobrar por su codigo",
      tarjeta?.[0]?.estado === "nueva" && tarjeta[0].para === null,
      tarjeta?.[0]?.para ? "MUESTRA LA TARJETA SIN PAGAR" : "solo el estado"
    );

    const { error: eCobrada } = await anon
      .from("giftcards")
      .insert({ ...prueba, codigo: GIFT_COBRADA, estado: "vigente" });
    await anon.from("giftcards").update({ estado: "vigente" }).eq("codigo", GIFT);

    const { data: quedaron } = await svc
      .from("giftcards")
      .select("codigo, estado")
      .in("codigo", [GIFT, GIFT_COBRADA]);
    const fila = (c) => (quedaron ?? []).find((g) => g.codigo === c);
    probar(
      "registrar una giftcard ya cobrada",
      Boolean(eCobrada) && !fila(GIFT_COBRADA),
      eCobrada ? "bloqueado" : "ENTRO"
    );
    probar(
      "marcarse una giftcard como cobrada",
      fila(GIFT)?.estado === "nueva",
      fila(GIFT)?.estado === "nueva" ? "bloqueado" : "SE PUDO"
    );
    await svc.from("giftcards").delete().in("codigo", [GIFT, GIFT_COBRADA]);
  } else {
    probar("escribir giftcards", true, "sin clave de servicio, no se pudo comprobar");
  }
}

const fallaron = resultados.filter((r) => !r).length;
console.log(
  fallaron
    ? `\n  ${fallaron} de ${resultados.length} MAL. Ver supabase/schema-16-vista-solo-lectura.sql\n`
    : `\n  Las ${resultados.length} bien.\n`
);
process.exitCode = fallaron ? 1 : 0;
