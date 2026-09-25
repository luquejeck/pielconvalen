/**
 * La giftcard, dibujada: lo que se ve mientras se arma, lo que abre
 * quien la recibe y lo que asoma en la portada.
 *
 * CON FORMA DE TARJETA DE VERDAD —la proporcion de una de credito— para
 * que se entienda sola lo que es, sin leer. Es la unica superficie vino
 * de la web: no es una seccion, es un objeto chico, como el envase de un
 * producto.
 *
 * El logo no va: el archivo tiene fondo blanco y solo funciona sobre
 * fondos claros (ver Logo.tsx). El nombre escrito cumple el mismo papel.
 *
 * El mensaje tampoco: puede tener doscientas letras y en la tarjeta no
 * entra. Va debajo, en la pagina.
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
  return (
    <div
      className={`relative isolate flex aspect-[1.6] w-full flex-col justify-between rounded-suave bg-vino p-5 text-crema shadow-suave sm:p-6 ${
        apagada ? "opacity-60 grayscale-[0.5]" : ""
      } ${className}`}
    >
      {/* El adorno: dos circulos que salen del borde, como el brillo de
          una tarjeta. Van en su propia capa recortada para que el
          recorte no le corte el texto a la tarjeta si un nombre largo
          la hace crecer. */}
      <span aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-suave">
        <span className="absolute -top-24 -right-20 size-64 rounded-full border border-crema/15" />
        <span className="absolute -top-12 -right-8 size-40 rounded-full bg-crema/[0.06]" />
        <span className="absolute -bottom-28 -left-16 size-56 rounded-full bg-vino-oscuro/60" />
      </span>

      <div className="flex items-start justify-between gap-3">
        <p className="font-display text-base leading-tight font-semibold tracking-tight">
          Piel con Valen
        </p>
        <p className="font-display text-xs leading-tight font-semibold tracking-[0.2em] text-crema/75 uppercase">
          Giftcard
        </p>
      </div>

      <div className="py-3">
        <p className="text-[0.9375rem] leading-snug text-crema/80">Para {para}</p>
        <p className="mt-1 font-display text-[1.625rem] leading-[1.1] font-semibold sm:text-3xl">
          {regalo}
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1 text-[0.9375rem] leading-snug">
        <p className="text-crema/80">De parte de {de}</p>
        {codigo && (
          <p className="font-display font-semibold tracking-[0.12em] tabular-nums">{codigo}</p>
        )}
      </div>
    </div>
  );
}
