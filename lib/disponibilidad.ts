import type { Agenda } from "./config";
import { claveFecha, fechaHora, sumarDias } from "./fechas";

export type EstadoTurno = "libre" | "ocupado";

export type Turno = {
  hora: string;
  estado: EstadoTurno;
};

/** { "2026-08-20": [{ hora: "09:00", estado: "libre" }, ...] } */
export type MapaDisponibilidad = Record<string, Turno[]>;

/* -------------------------------------------------------------------------
 * CONSTRUCCION DEL MAPA
 * Recorre los dias habiles de la agenda y marca cada horario.
 * De donde salen los datos (base de datos o simulacion) lo deciden
 * las dos funciones que recibe.
 * ---------------------------------------------------------------------- */
export function construirMapa(
  desde: Date,
  dias: number,
  agenda: Agenda,
  estaOcupado: (clave: string, hora: string) => boolean,
  diaCerrado: (clave: string) => boolean = () => false
): MapaDisponibilidad {
  const mapa: MapaDisponibilidad = {};

  for (let i = 0; i < dias; i++) {
    const fecha = sumarDias(desde, i);
    if (!agenda.diasHabiles.includes(fecha.getDay())) continue;

    const clave = claveFecha(fecha);
    if (diaCerrado(clave)) continue;

    mapa[clave] = agenda.horarios.map((hora) => ({
      hora,
      estado: estaOcupado(clave, hora) ? "ocupado" : "libre",
    }));
  }

  return mapa;
}

/* -------------------------------------------------------------------------
 * SIMULACION
 * Se usa solo mientras la base de datos no este configurada.
 * ---------------------------------------------------------------------- */

/** Hash estable: misma fecha+hora => mismo resultado siempre. */
function hash(texto: string): number {
  let h = 0;
  for (let i = 0; i < texto.length; i++) {
    h = (h << 5) - h + texto.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function generarDisponibilidadMock(
  desde: Date,
  agenda: Agenda,
  dias: number = agenda.ventanaDias
): MapaDisponibilidad {
  return construirMapa(
    desde,
    dias,
    agenda,
    (clave, hora) => hash(`${clave}|${hora}`) % 10 < 4
  );
}

/* -------------------------------------------------------------------------
 * ACCESO DESDE EL FRONT
 * ---------------------------------------------------------------------- */

/** Trae la disponibilidad desde la API. Si falla, devuelve vacio. */
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
    return {};
  }
}

/** Un turno tambien esta "ocupado" si cae dentro de la anticipacion minima. */
export function turnoReservable(
  clave: string,
  turno: Turno,
  ahora: Date,
  anticipacionHoras: number
): boolean {
  if (turno.estado === "ocupado") return false;
  const limite = new Date(ahora.getTime() + anticipacionHoras * 3600 * 1000);
  return fechaHora(clave, turno.hora) > limite;
}

export function tieneLugar(
  turnos: Turno[] | undefined,
  clave: string,
  ahora: Date,
  anticipacionHoras: number
): boolean {
  return !!turnos?.some((t) => turnoReservable(clave, t, ahora, anticipacionHoras));
}
