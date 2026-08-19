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
