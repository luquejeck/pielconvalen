import { CONSULTORIO } from "./config";
import { formatearFechaLarga } from "./fechas";
import { esConsulta, formatearPrecio, type Tratamiento } from "./tratamientos";

/**
 * Deja un telefono en el formato que espera wa.me: 549 + area + numero.
 *
 * Valen carga los telefonos como se los pasan, y cada clienta los escribe
 * distinto: "+54 9 11 2294-3672", "11 2294-3672", "011 15 2294 3672".
 * Sin normalizar, el mensaje se abre contra un numero que no existe.
 */
export function normalizarTelefono(crudo: string): string {
  let n = crudo.replace(/\D/g, "");

  // Ya trae codigo de pais: solo falta asegurar el 9 de celular.
  if (n.startsWith("54")) {
    const resto = n.slice(2);
    return resto.startsWith("9") ? n : `549${resto}`;
  }

  // El 0 de larga distancia no va en el formato internacional.
  if (n.startsWith("0")) n = n.slice(1);

  // El 15 de celular tampoco. Se contempla CABA (area 11), que es donde
  // atiende: "11 15 2294 3672" tiene que quedar "11 2294 3672".
  if (n.startsWith("11") && n.slice(2, 4) === "15") n = `11${n.slice(4)}`;

  return `549${n}`;
}

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
