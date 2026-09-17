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

  /*
    La consulta no lleva precio en el mensaje. Antes salia "($ 0)", que
    ademas de raro dice algo que no es: el precio se define en el
    momento, con el tratamiento ya elegido. Y ahora TODOS los turnos que
    entran por la web son consultas, asi que ese "$ 0" iba en cada
    mensaje que le llegaba a Valen.
  */
  const queTurno = esConsulta(tratamiento)
    ? `• Turno: ${tratamiento.nombre} (el precio lo definen ahí)`
    : `• Tratamiento: ${tratamiento.nombre} (${precio})`;

  const lineas = [
    `Hola Valen! Quiero reservar un turno 🌿`,
    ``,
    queTurno,
    `• Fecha: ${formatearFechaLarga(fecha)}`,
    `• Horario: ${hora} hs`,
  ];

  if (nombre?.trim()) lineas.push(`• Mi nombre: ${nombre.trim()}`);

  lineas.push(``, `¿Me lo confirmás? ¡Gracias!`);
  return lineas.join("\n");
}

/**
 * Link wa.me listo para usar en un <a href>.
 *
 * El numero se pasa desde afuera y solo cae en el del codigo si no
 * llega ninguno: ahora sale de la tabla `configuracion`, que Valen edita
 * desde el panel, y este archivo lo usan tanto el servidor como el
 * navegador.
 */
export function linkWhatsApp(datos: DatosReserva, numero?: string): string {
  const texto = encodeURIComponent(mensajeReserva(datos));
  return `https://wa.me/${numero ?? CONSULTORIO.whatsapp}?text=${texto}`;
}

/** Link generico (footer, consultas sueltas). */
export function linkWhatsAppSimple(
  texto = "Hola Valen! Quería hacerte una consulta 🌿",
  numero?: string
): string {
  return `https://wa.me/${numero ?? CONSULTORIO.whatsapp}?text=${encodeURIComponent(texto)}`;
}

/**
 * Mover un turno ya reservado.
 * El mensaje ya viene planteado para que la clienta no tenga que
 * explicar nada: solo completa cuando puede.
 */
export const linkMoverTurno = (numero?: string) =>
  linkWhatsAppSimple(
    "Hola Valen! Tengo un turno reservado y necesito cambiarlo de día. ¿Qué horarios tenés disponibles?",
    numero
  );

/**
 * Cancelar un turno.
 * Pide avisar con anticipacion sin sonar a reproche: el objetivo es
 * que el lugar se libere y lo pueda tomar otra persona.
 */
export const linkCancelarTurno = (numero?: string) =>
  linkWhatsAppSimple(
    "Hola Valen! Tengo un turno reservado y no voy a poder ir. Te aviso para liberar el lugar.",
    numero
  );

/* -------------------------------------------------------------------------
 * PRODUCTOS
 * La venta no pasa por la web: la ficha arma el mensaje y el chat hace
 * el resto. Por eso el texto tiene que llegar con el producto ya
 * nombrado — si dice solo "Hola, me interesa un producto", Valen tiene
 * que preguntar cual y se pierden dos mensajes en cada consulta.
 * ---------------------------------------------------------------------- */

type DatosProducto = {
  marca: string;
  nombre: string;
  medida?: string;
  precio: number;
};

/** Arma el mensaje que va prellenado al tocar una ficha de producto. */
export function mensajeProducto({
  marca,
  nombre,
  medida,
  precio,
}: DatosProducto): string {
  const lineas = [
    `Hola Valen! Me interesa este producto 🌿`,
    ``,
    `• ${nombre}${medida ? ` (${medida})` : ""}`,
    `• Marca: ${marca}`,
  ];

  /*
    El precio va en el mensaje para que las dos esten mirando el mismo
    numero: si cambio entre que se publico y que la clienta escribio,
    Valen lo ve en el acto y lo corrige ahi mismo, en vez de enterarse al
    cobrar. Cuando todavia no hay precio cargado, el mensaje lo pregunta
    en lugar de mostrar un "$ 0" que no dice nada.
  */
  lineas.push(
    precio > 0
      ? `• Precio publicado: ${formatearPrecio(precio).replace(/ /g, " ")}`
      : `• ¿Qué precio tiene?`
  );

  lineas.push(``, `¿Lo tenés disponible?`);
  return lineas.join("\n");
}

export function linkProducto(datos: DatosProducto, numero?: string): string {
  return `https://wa.me/${numero ?? CONSULTORIO.whatsapp}?text=${encodeURIComponent(
    mensajeProducto(datos)
  )}`;
}

/** Para quien mira el catalogo entero y no se decide por uno. */
export const linkConsultaProductos = (numero?: string) =>
  linkWhatsAppSimple(
    "Hola Valen! Estuve viendo los productos de la web y quería que me recomiendes cuál me conviene 🌿",
    numero
  );

/* -------------------------------------------------------------------------
 * MENSAJES DE VALEN A LA CLIENTA
 * Cierran el circuito: la clienta pide por WhatsApp y se entera por
 * WhatsApp si quedo o no. Sin esto, un turno rechazado la deja esperando
 * una respuesta que nunca llega.
 * ---------------------------------------------------------------------- */

type DatosTurno = {
  fecha: string;
  hora: string;
  cliente?: string | null;
  tratamiento?: string | null;
  /** La direccion sale de la configuracion, que Valen puede cambiar. */
  direccion?: string;
};

/** Link para escribirle a un telefono concreto, ya normalizado. */
export function linkWhatsAppA(telefono: string, texto: string): string {
  return `https://wa.me/${normalizarTelefono(telefono)}?text=${encodeURIComponent(texto)}`;
}

const saludo = (cliente?: string | null) =>
  cliente?.trim() ? `Hola ${cliente.trim()}!` : "Hola!";

export const mensajeTurnoAceptado = ({
  fecha,
  hora,
  cliente,
  tratamiento,
  direccion = CONSULTORIO.direccion,
}: DatosTurno) =>
  [
    `${saludo(cliente)} Te confirmo el turno 🌿`,
    ``,
    tratamiento ? `• ${tratamiento}` : null,
    `• ${formatearFechaLarga(fecha)}`,
    `• ${hora} hs`,
    ``,
    `Te espero en ${direccion}. Si te surge algo, avisame.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

export const mensajeTurnoRechazado = ({ fecha, hora, cliente }: DatosTurno) =>
  [
    `${saludo(cliente)} Te escribo por el turno que pediste para el ${formatearFechaLarga(
      fecha
    )} a las ${hora} hs.`,
    ``,
    `Justo ese horario no me queda disponible. ¿Buscamos otro día?`,
  ].join("\n");
