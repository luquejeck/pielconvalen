import { linkWhatsAppSimple } from "@/lib/whatsapp";
import { IconoWhatsApp } from "./iconos";

/**
 * Boton flotante de consulta rapida.
 * No reemplaza al modulo de reservas: es para dudas previas
 * ("¿cual me conviene?", "¿tenes algo antes del viernes?").
 */
export default function BotonWhatsApp() {
  return (
    <a
      href={linkWhatsAppSimple()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-vino text-crema shadow-lg shadow-vino/30 transition-all hover:bg-vino-oscuro hover:scale-105 active:scale-95 md:h-auto md:w-auto md:gap-2.5 md:px-6 md:py-4"
    >
      <IconoWhatsApp className="h-6 w-6 md:h-5 md:w-5" />
      <span className="hidden text-sm font-medium md:inline">Consultar</span>
    </a>
  );
}
