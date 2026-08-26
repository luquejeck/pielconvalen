import { fallo, requerirSesion } from "@/lib/api";
import { NextResponse } from "next/server";

/**
 * Lista corta para los desplegables del panel.
 * El catalogo que ve la clienta no pasa por aca: lo lee el servidor
 * directo de la base en `lib/catalogo.ts`.
 */
export async function GET() {
  const sesion = await requerirSesion();
  if (!sesion.ok) return sesion.respuesta;

  const { data, error } = await sesion.sb
    .from("tratamientos")
    .select("id, nombre, precio")
    .eq("activo", true)
    .order("orden");

  if (error) return fallo("traer los tratamientos", error);
  return NextResponse.json(data);
}
