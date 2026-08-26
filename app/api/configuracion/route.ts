import { fallo, requerirSesion } from "@/lib/api";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Lo que Valen puede cambiar de la web sin tocar codigo.
 *
 * Guarda clave por clave, no el objeto entero: asi lo que no se envia
 * queda como estaba y dos pestañas abiertas no se pisan una a la otra.
 */

/** Solo estas claves se guardan. Cualquier otra cosa se ignora. */
const CLAVES = new Set([
  "nombre",
  "profesional",
  "profesion",
  "titulo",
  "carrera",
  "eslogan",
  "direccion",
  "mapsUrl",
  "referencia",
  "transporte",
  "whatsapp",
  "whatsappVisible",
  "telefono",
  "instagram",
  "instagramUrl",
  "queSeHace",
  "mediosDePago",
  "comoVenir",
  "beneficios",
  "glosario",
  "fotos",
]);

export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { data, error } = await sesion.sb
    .from("configuracion")
    .select("clave, valor");

  if (error) return fallo("traer la configuración", error);

  const objeto: Record<string, string> = {};
  for (const { clave, valor } of data ?? []) objeto[clave] = valor;
  return NextResponse.json(objeto);
}

export async function PUT(req: NextRequest) {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const body = await req.json();

  const filas = Object.entries(body)
    .filter(([clave]) => CLAVES.has(clave))
    .map(([clave, valor]) => ({
      clave,
      // Lo estructurado (beneficios, glosario, fotos) se guarda como JSON;
      // el resto, como el texto que Valen escribio.
      valor: typeof valor === "string" ? valor : JSON.stringify(valor),
      actualizado_en: new Date().toISOString(),
    }));

  if (filas.length === 0) {
    return NextResponse.json({ error: "No hay nada que guardar." }, { status: 400 });
  }

  const { error } = await sesion.sb
    .from("configuracion")
    .upsert(filas, { onConflict: "clave" });

  if (error) return fallo("guardar la configuración", error);

  return NextResponse.json({ ok: true, guardadas: filas.length });
}
