import { codigoAlAzar } from "./codigos";
import { desdeClave } from "./fechas";
import { formatearPrecio } from "./tratamientos";

/*
  LAS GIFTCARDS.

  Una giftcard es un tratamiento —o un monto— pagado por adelantado para
  que lo use otra persona. El circuito completo esta contado en
  supabase/schema-22-giftcards.sql.
*/

/**
 * Las reglas de la giftcard. Viven aca y no en el panel porque no son
 * algo que se cambie seguido.
 *
 * VALEN: confirmar la vigencia. Seis meses es lo habitual en estetica:
 * alcanza para que quien la recibe encuentre un turno sin apuro, y no
 * deja plata dando vueltas un año entero.
 */
export const GIFTCARD = {
  /** Cuanto dura desde que se cobra. */
  vigenciaMeses: 6,
  /** Un monto libre menor a esto no alcanza para ningun tratamiento. */
  montoMinimo: 10000,
  montoMaximo: 500000,
  /** Largos maximos: los mismos que exige la tabla. */
  largoNombre: 60,
  largoMensaje: 240,
};

/** G-4K7M9P: el mismo formato que exige la tabla (schema-22). */
export const CODIGO_GIFTCARD = /^G-[A-Z0-9]{6}$/;

/** Seis caracteres y no cuatro: este codigo vale plata (ver schema-22). */
export const nuevoCodigoGiftcard = () => codigoAlAzar("G", 6);

export type EstadoGiftcard = "nueva" | "vigente" | "usada" | "anulada";

/** Una giftcard tal como la guarda la base. */
export type Giftcard = {
  id: string;
  codigo: string;
  para: string;
  de: string;
  mensaje: string | null;
  /** El tratamiento regalado. Vacio = un monto para lo que quiera. */
  tratamiento: string | null;
  monto: number;
  estado: EstadoGiftcard;
  medio_pago: string | null;
  cobrada_el: string | null;
  vence_el: string | null;
  usada_el: string | null;
  /* Vigente: el turno que saco quien la recibe. Usada: donde se uso. */
  turno_id: string | null;
  creado_en: string;
  /** El turno asociado, tal como lo trae el panel. */
  turno?: { fecha: string; hora: string; cliente: string | null; estado: string } | null;
};

/** Lo que dice la tarjeta en grande: el tratamiento, o el monto. */
export const queRegala = (g: Pick<Giftcard, "tratamiento" | "monto">) =>
  g.tratamiento ?? formatearPrecio(g.monto);

/** Una vigente cuya fecha ya paso. La base no la cambia sola de estado. */
export const estaVencida = (g: Pick<Giftcard, "estado" | "vence_el">, hoy: string) =>
  g.estado === "vigente" && g.vence_el !== null && g.vence_el < hoy;

/**
 * "2026-09-25" + 6 meses -> "2027-03-25".
 *
 * Si el dia no existe en el mes de llegada, queda el ultimo: el 31 de
 * agosto mas seis meses es el 28 de febrero, no el 3 de marzo.
 */
export function sumarMeses(clave: string, meses: number): string {
  const [y, m, d] = clave.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(y, m - 1 + meses + 1, 0)).getUTCDate();
  const fecha = new Date(Date.UTC(y, m - 1 + meses, Math.min(d, ultimoDia)));
  return fecha.toISOString().slice(0, 10);
}

/** "2027-03-25" -> "25 de marzo de 2027". Con año: puede ser el que viene. */
export const fechaConAnio = (clave: string) =>
  desdeClave(clave).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * El medio de pago del cobro de un turno cuando se usa una giftcard.
 * No esta en MEDIOS_DE_PAGO porque solo vale para tratamientos: los
 * productos y los combos no se pagan con giftcard.
 */
export const MEDIO_GIFTCARD = "Giftcard";

/*
  LA GIFTCARD EN LAS NOTAS DEL TURNO.

  Quien reserva desde su tarjeta deja el turno con "Giftcard G-4K7M9P"
  en `turnos.notas`. Asi el turno la trae consigo desde que nace: Turnos
  la muestra, el cobro la pone, y Giftcards la asocia sola. Valen no
  tiene que hacer nada.
*/
export const notaGiftcard = (codigo: string) => `Giftcard ${codigo}`;

/** La giftcard con la que se esta reservando, tal como la ve la web. */
export type GiftcardEnReserva = {
  codigo: string;
  tratamiento: string | null;
  monto: number;
  de: string | null;
};

export const codigoEnNotas = (notas: string | null | undefined) =>
  notas?.match(/G-[A-Z0-9]{6}/)?.[0] ?? null;
