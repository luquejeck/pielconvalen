/**
 * Helpers de fecha sin dependencias externas.
 * Todo se maneja con la fecha LOCAL del navegador y la clave "YYYY-MM-DD",
 * para evitar corrimientos de dia por UTC.
 */

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Date -> "2026-08-19" */
export function claveFecha(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2026-08-19" -> Date local a las 00:00 */
export function desdeClave(clave: string): Date {
  const [y, m, d] = clave.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

export function inicioDelDia(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

/** Combina "2026-08-19" + "09:00" en un Date local */
export function fechaHora(clave: string, hora: string): Date {
  const base = desdeClave(clave);
  const [h, m] = hora.split(":").map(Number);
  base.setHours(h, m, 0, 0);
  return base;
}

/**
 * Grilla del mes con la semana arrancando en LUNES.
 * Devuelve celdas null para el relleno inicial.
 */
export function grillaDelMes(anio: number, mes: number): (Date | null)[] {
  const primero = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  // getDay(): 0=Dom .. 6=Sab  ->  offset con lunes como primer dia
  const offset = (primero.getDay() + 6) % 7;

  const celdas: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= diasEnMes; d++) {
    celdas.push(new Date(anio, mes, d));
  }
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export function formatearFechaLarga(clave: string): string {
  return desdeClave(clave).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
