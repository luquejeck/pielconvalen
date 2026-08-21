import { NextResponse } from "next/server";
import { obtenerAgenda, obtenerTratamientosPublicos } from "@/lib/catalogo";
import { buscarTratamiento } from "@/lib/tratamientos";
import { hayBaseDeDatos } from "@/lib/supabase";
import { clienteServidor } from "@/lib/supabase-servidor";

export const dynamic = "force-dynamic";

/**
 * POST /api/turnos
 * Body: { fecha, hora, tratamientoId, nombre? }
 *
 * Reserva el horario en estado "pendiente" apenas la clienta toca
 * "Confirmar por WhatsApp": asi el turno deja de estar disponible para
 * las demas antes de que Valen llegue a responder el mensaje.
 * Valen despues lo confirma o lo borra desde el panel.
 */
export async function POST(request: Request) {
  // Sin base de datos configurada no hay nada que guardar,
  // pero la clienta igual sigue viaje a WhatsApp.
  if (!hayBaseDeDatos) {
    return NextResponse.json({ guardado: false, motivo: "sin-base" });
  }

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido" }, { status: 400 });
  }

  const { fecha, hora, tratamientoId, nombre } = (cuerpo ?? {}) as Record<
    string,
    string | undefined
  >;

  const [agenda, tratamientos] = await Promise.all([
    obtenerAgenda(),
    obtenerTratamientosPublicos(),
  ]);
  const tratamiento = buscarTratamiento(tratamientos, tratamientoId ?? null);

  if (
    !fecha ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
    !hora ||
    !agenda.horarios.includes(hora) ||
    !tratamiento
  ) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const supabase = await clienteServidor();

  const { error } = await supabase.from("turnos").insert({
    fecha,
    hora,
    estado: "pendiente",
    cliente: nombre?.trim() || null,
    tratamiento: tratamiento.nombre,
    precio: tratamiento.precio,
  });

  if (error) {
    // 23505 = choque con la restriccion unica (fecha, hora)
    const tomado = error.code === "23505";
    return NextResponse.json(
      {
        guardado: false,
        error: tomado
          ? "Ese horario acaba de ser reservado por otra persona."
          : "No se pudo guardar el turno.",
      },
      { status: tomado ? 409 : 500 }
    );
  }

  return NextResponse.json({ guardado: true });
}
