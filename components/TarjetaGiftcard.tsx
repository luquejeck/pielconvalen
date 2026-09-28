import { tamanoRegalo } from "@/lib/giftcards";
import { IconoRegalo } from "./iconos";
import { LogoMarca } from "./Logo";

/**
 * La giftcard, dibujada: lo que se ve mientras se arma y lo que abre
 * quien la recibe.
 *
 * CON FORMA DE TARJETA DE VERDAD —la proporcion de una de credito— para
 * que se entienda sola lo que es, sin leer.
 *
 * QUE SE SIENTA UN REGALO Y NO UN CARTEL. La primera version era un
 * rectangulo vino liso con dos circulos, y se veia vacia (Lucas,
 * 25-09-2026). Ahora lleva lo que tiene una giftcard cuidada:
 *   - degrade de vino y un brillo en diagonal, como un papel metalizado
 *   - un filete fino adentro del borde, como el marco de una tarjeta
 *   - el monograma VG del logo de marca de agua, grande y apenas visible
 *   - la caja de regalo, y el codigo en una pastilla, como un numero
 *     de serie
 *
 * EL FONDO VA EN SU PROPIA CAPA RECORTADA, junto con la marca de agua:
 * asi el recorte no le corta el texto a la tarjeta si un nombre largo la
 * hace crecer.
 *
 * Los campos vacios muestran un texto de ejemplo mas apagado: mientras
 * se arma, se ve que es lo que falta completar.
 *
 * El mensaje no va: puede tener doscientas letras y no entra. Va debajo,
 * en la pagina.
 */
export default function TarjetaGiftcard({
  para,
  de,
  regalo,
  codigo,
  apagada = false,
  className = "",
}: {
  para: string;
  de: string;
  /** El tratamiento o el monto, ya escrito. */
  regalo: string;
  codigo?: string;
  /** Usada o vencida: se ve, pero ya no invita. */
  apagada?: boolean;
  className?: string;
}) {
  const ejemplo = "text-crema/45";
  /* El tamaño del regalo segun el largo del nombre (ver lib/giftcards.ts):
     asi un tratamiento de 59 letras no estira la tarjeta hasta dejarla
     cuadrada. */
  const letra = {
    grande: "text-[1.75rem] sm:text-[2rem]",
    medio: "text-[1.3125rem] sm:text-[1.625rem]",
    chico: "text-[1.0625rem] sm:text-[1.3125rem]",
  }[tamanoRegalo(regalo || "Tu regalo")];

  return (
    <div
      className={`relative isolate flex aspect-[1.6] w-full flex-col justify-between rounded-suave p-6 text-crema shadow-[0_18px_40px_-18px_rgb(93_10_52/0.7)] sm:p-7 ${
        apagada ? "opacity-60 grayscale-[0.5]" : ""
      } ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 overflow-hidden rounded-suave bg-[linear-gradient(135deg,#931656_0%,var(--color-vino)_42%,var(--color-vino-oscuro)_100%)]"
      >
        {/* El monograma, de marca de agua, saliendo por la esquina. */}
        <LogoMarca alto={170} sobreOscuro tenue className="absolute -right-10 -bottom-8" />
        {/* El brillo en diagonal. */}
        <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.09)_45%,transparent_60%)]" />
        {/* El filete: el marco fino adentro del borde. */}
        <span className="absolute inset-2.5 rounded-[1.05rem] border border-crema/20" />
      </span>

      <div className="flex items-start justify-between gap-3">
        <div>
          <LogoMarca alto={22} sobreOscuro />
          <p className="mt-2 font-display text-[0.6875rem] leading-none font-semibold tracking-[0.3em] text-crema/70 uppercase">
            Giftcard
          </p>
        </div>
        <IconoRegalo className="h-7 w-7 shrink-0 text-crema/85" />
      </div>

      <div className="py-2 sm:py-3">
        <p className={`text-[0.9375rem] leading-snug ${para ? "text-crema/80" : ejemplo}`}>
          Para {para || "quien la recibe"}
        </p>
        <p
          className={`mt-1 font-display leading-[1.12] font-semibold ${letra} ${regalo ? "" : ejemplo}`}
        >
          {regalo || "Tu regalo"}
        </p>
      </div>

      {/* En un celular angosto, "De parte de" y el codigo van un punto mas
          chicos: si no entran en un renglon, el codigo baja y la tarjeta
          pierde la forma. */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 text-sm leading-snug sm:text-[0.9375rem]">
        <p className={de ? "text-crema/80" : ejemplo}>De parte de {de || "vos"}</p>
        {codigo && (
          <p className="rounded-full bg-crema/12 px-2.5 py-0.5 font-display text-xs font-semibold tracking-[0.1em] tabular-nums ring-1 ring-crema/20 sm:px-3 sm:py-1 sm:text-sm sm:tracking-[0.12em]">
            {codigo}
          </p>
        )}
      </div>
    </div>
  );
}
