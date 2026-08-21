import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";

/**
 * Boton flotante de consulta rapida.
 * No reemplaza al modulo de reservas: es para dudas previas
 * ("¿cual me conviene?", "¿tenes algo antes del viernes?").
 *
 * Lleva el texto visible tambien en celular: quien se marea con los
 * pasos tiene que ver la salida, no adivinar que hace ese circulito.
 */
export default function BotonWhatsApp() {
  return (
    <a
      href={linkWhatsAppSimple()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex min-h-14 items-center justify-center gap-2.5 rounded-full bg-vino px-5 py-3.5 text-crema shadow-lg shadow-vino/30 transition-all hover:bg-vino-oscuro hover:scale-105 active:scale-95 md:px-6 md:py-4"
    >
      <IconoWhatsApp className="h-6 w-6 md:h-5 md:w-5" />
      <span className="text-base font-medium md:text-sm">
        Escribile a Valen
      </span>
    </a>
  );
}
