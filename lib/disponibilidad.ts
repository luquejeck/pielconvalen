import { AGENDA } from "./config";
import { claveFecha, fechaHora, sumarDias } from "./fechas";

export type EstadoTurno = "libre" | "ocupado";

export type Turno = {
  hora: string;
  estado: EstadoTurno;
};

/** { "2026-08-20": [{ hora: "09:00", estado: "libre" }, ...] } */
export type MapaDisponibilidad = Record<string, Turno[]>;

/* -------------------------------------------------------------------------
 * SIMULACION (mock)
 * Reemplazar por la consulta real a la base de datos dentro de
 * app/api/disponibilidad/route.ts. El resto del front no cambia.
 * ---------------------------------------------------------------------- */

/**
 * Bloqueos manuales de ejemplo: lo que hoy carga la admin a mano.
 * clave = fecha, valor = horas ocupadas ("*" bloquea el dia entero).
 */
const BLOQUEOS_MANUALES: Record<string, string[]> = {
  // "2026-08-25": ["09:00", "11:30"],
  // "2026-08-26": ["*"],
};

/** Hash estable: misma fecha+hora => mismo resultado en server y cliente. */
function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h << 5) - h + texto.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Genera el mapa de disponibilidad simulado para un rango de dias. */
export function generarDisponibilidadMock(
  desde: Date,
  dias: number = AGENDA.ventanaDias
): MapaDisponibilidad {
  const mapa: MapaDisponibilidad = {};

  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    if (!AGENDA.diasHabiles.includes(fecha.getDay())) continue;

    const clave = claveFecha(fecha);
    const bloqueos = BLOQUEOS_MANUALES[clave] ?? [];
    if (bloqueos.includes("*")) continue; // dia cerrado por la admin

    mapa[clave] = AGENDA.horarios.map((hora) => ({
      hora,
      estado:
        bloqueos.includes(hora) || hash(`${clave}|${hora}`) % 10 < 4
          ? "ocupado"
          : "libre",
    }));
  }

  return mapa;
}

/* -------------------------------------------------------------------------
 * ACCESO DESDE EL FRONT
 * ---------------------------------------------------------------------- */

/** Trae la disponibilidad desde la API. Si falla, cae al mock local. */
export async function obtenerDisponibilidad(
  desde: Date
): Promise<MapaDisponibilidad> {
  try {
    const res = await fetch(`/api/disponibilidad?desde=${claveFecha(desde)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Respuesta no OK");
    return (await res.json()) as MapaDisponibilidad;
  } catch {
    return generarDisponibilidadMock(desde);
  }
}

/** Un turno tambien esta "ocupado" si cae dentro de la anticipacion minima. */
export function turnoReservable(
  clave: string,
  turno: Turno,
  ahora: Date
): boolean {
  if (turno.estado === "ocupado") return false;
  const limite = new Date(
    ahora.getTime() + AGENDA.anticipacionMinimaHs * 3600 * 1000
  );
  return fechaHora(clave, turno.hora) > limite;
}

export function tieneLugar(
  turnos: Turno[] | undefined,
  clave: string,
  ahora: Date
): boolean {
  return !!turnos?.some((t) => turnoReservable(clave, t, ahora));
}
