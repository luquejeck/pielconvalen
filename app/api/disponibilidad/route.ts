import { NextResponse } from "next/server";
import { AGENDA } from "@/lib/config";
import {
  generarDisponibilidadMock,
  type MapaDisponibilidad,
} from "@/lib/disponibilidad";
import { desdeClave } from "@/lib/fechas";

export const dynamic = "force-dynamic";

/**
 * GET /api/disponibilidad?desde=2026-08-19&dias=60
 *
 * Devuelve: { "2026-08-20": [{ hora: "09:00", estado: "libre" }, ...], ... }
 *
 * HOY: responde con la simulacion (mock).
 * MAÑANA: reemplazar el bloque marcado por la consulta a la base de datos.
 * El front no se toca: consume siempre este mismo contrato.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desdeParam = searchParams.get("desde");
  const dias = Number(searchParams.get("dias")) || AGENDA.ventanaDias;

  const desde =
    desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam)
      ? desdeClave(desdeParam)
      : new Date();

  // ---------------------------------------------------------------
  // SIMULACION — reemplazar por la DB (ver README, seccion "Backend")
  //
  //   const supabase = createClient(url, serviceKey);
  //   const { data } = await supabase
  //     .from("turnos")
  //     .select("fecha, hora, estado")
  //     .gte("fecha", claveFecha(desde))
  //     .lte("fecha", claveFecha(sumarDias(desde, dias)));
  //   const mapa = construirMapa(data);
  // ---------------------------------------------------------------
  const mapa: MapaDisponibilidad = generarDisponibilidadMock(desde, dias);

  return NextResponse.json(mapa, {
    headers: {
      // Cache corto en el CDN de Vercel: la agenda cambia seguido.
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
