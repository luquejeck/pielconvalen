import { CONSULTORIO } from "./config";
import { formatearFechaLarga } from "./fechas";
import { formatearPrecio, type Tratamiento } from "./tratamientos";

type DatosReserva = {
  tratamiento: Tratamiento;
  fecha: string; // "YYYY-MM-DD"
  hora: string; // "HH:mm"
  nombre?: string;
};

/** Arma el mensaje que va prellenado en WhatsApp. */
export function mensajeReserva({
  tratamiento,
  fecha,
  hora,
  nombre,
}: DatosReserva): string {
  // Intl usa espacio duro ( ) entre el simbolo y el numero: en WhatsApp queda feo.
  const precio = formatearPrecio(tratamiento.precio).replace(/ /g, " ");

  const lineas = [
    `Hola Valen! Quiero reservar un turno 🌿`,
    ``,
    `• Tratamiento: ${tratamiento.nombre} (${precio})`,
    `• Fecha: ${formatearFechaLarga(fecha)}`,
    `• Horario: ${hora} hs`,
  ];

  if (nombre?.trim()) lineas.push(`• Mi nombre: ${nombre.trim()}`);

  lineas.push(``, `¿Me lo confirmás? ¡Gracias!`);
  return lineas.join("\n");
}

/** Link wa.me listo para usar en un <a href>. */
export function linkWhatsApp(datos: DatosReserva): string {
  const texto = encodeURIComponent(mensajeReserva(datos));
  return `https://wa.me/${CONSULTORIO.whatsapp}?text=${texto}`;
}

/** Link generico (footer, consultas sueltas). */
export function linkWhatsAppSimple(
  texto = "Hola Valen! Quería hacerte una consulta 🌿"
): string {
  return `https://wa.me/${CONSULTORIO.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/**
 * Mover un turno ya reservado.
 * El mensaje ya viene planteado para que la clienta no tenga que
 * explicar nada: solo completa cuando puede.
 */
export const linkMoverTurno = () =>
  linkWhatsAppSimple(
    "Hola Valen! Tengo un turno reservado y necesito cambiarlo de día. ¿Qué horarios tenés disponibles?"
  );

/**
 * Cancelar un turno.
 * Pide avisar con anticipacion sin sonar a reproche: el objetivo es
 * que el lugar se libere y lo pueda tomar otra persona.
 */
export const linkCancelarTurno = () =>
  linkWhatsAppSimple(
    "Hola Valen! Tengo un turno reservado y no voy a poder ir. Te aviso para liberar el lugar."
  );
