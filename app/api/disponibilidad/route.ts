import { NextResponse } from "next/server";
import { AGENDA } from "@/lib/config";
import {
  construirMapa,
  generarDisponibilidadMock,
  type MapaDisponibilidad,
} from "@/lib/disponibilidad";
import { claveFecha, desdeClave, sumarDias } from "@/lib/fechas";
import { hayBaseDeDatos } from "@/lib/supabase";
import { clienteServidor } from "@/lib/supabase-servidor";

export const dynamic = "force-dynamic";

/**
 * GET /api/disponibilidad?desde=2026-08-19&dias=60
 * Devuelve: { "2026-08-20": [{ hora: "09:00", estado: "libre" }, ...] }
 *
 * Si la base de datos todavia no esta configurada, responde con la
 * agenda simulada para que la web nunca quede rota.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const desdeParam = searchParams.get("desde");
  const dias = Number(searchParams.get("dias")) || AGENDA.ventanaDias;

  const desde =
    desdeParam && /^\d{4}-\d{2}-\d{2}$/.test(desdeParam)
      ? desdeClave(desdeParam)
      : new Date();

  if (!hayBaseDeDatos) {
    return NextResponse.json(generarDisponibilidadMock(desde, dias));
  }

  const supabase = await clienteServidor();
  const hasta = claveFecha(sumarDias(desde, dias));

  // La vista publica expone fecha y hora: nunca nombres ni telefonos.
  const [{ data: turnos }, { data: cerrados }] = await Promise.all([
    supabase
      .from("turnos_publicos")
      .select("fecha, hora")
      .gte("fecha", claveFecha(desde))
      .lte("fecha", hasta),
    supabase
      .from("dias_cerrados")
      .select("fecha")
      .gte("fecha", claveFecha(desde))
      .lte("fecha", hasta),
  ]);

  const ocupados = new Set((turnos ?? []).map((t) => `${t.fecha}|${t.hora}`));
  const diasCerrados = new Set((cerrados ?? []).map((d) => d.fecha));

  const mapa: MapaDisponibilidad = construirMapa(
    desde,
    dias,
    (clave, hora) => ocupados.has(`${clave}|${hora}`),
    (clave) => diasCerrados.has(clave)
  );

  return NextResponse.json(mapa, {
    headers: { "Cache-Control": "no-store" },
  });
}
