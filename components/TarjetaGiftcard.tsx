import { estiloGiftcard } from "@/lib/estilos-giftcard";
import { tamanoRegalo } from "@/lib/giftcards";
import { IconoRegalo } from "./iconos";
import { LogoMarca } from "./Logo";
import Tarjeta3D from "./Tarjeta3D";

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
 *
 * EN 3D (14-10-2026): se inclina con el mouse, con brillo y grano de
 * papel (components/Tarjeta3D.tsx). Usada o vencida, queda quieta.
 *
 * CON EL PAPEL QUE SE ELIGIO (lib/estilos-giftcard.ts). Los colores del
 * texto salen de `currentColor`: crema sobre los papeles oscuros y la
 * tinta del estilo sobre los claros, con el logo en vino.
 *
 * DE ESPALDAS, PARA QUIEN LA RECIBE (`sorpresa`): llega dada vuelta, con
 * el monograma, y se da vuelta al tocarla.
 */
export default function TarjetaGiftcard({
  para,
  de,
  regalo,
  codigo,
  estilo,
  apagada = false,
  sorpresa = false,
  className = "",
}: {
  para: string;
  de: string;
  /** El tratamiento o el monto, ya escrito. */
  regalo: string;
  codigo?: string;
  /** El id del papel. Vacio o desconocido: la vino de siempre. */
  estilo?: string | null;
  /** Usada o vencida: se ve, pero ya no invita. */
  apagada?: boolean;
  /** Llega de espaldas y se da vuelta al tocarla. */
  sorpresa?: boolean;
  className?: string;
}) {
  const e = estiloGiftcard(estilo);
  const claro = Boolean(e.tinta);
  const color = e.tinta ?? "var(--color-crema)";
  const sombra = claro
    ? "0 18px 40px -18px rgb(150 80 110 / 0.4)"
    : "0 18px 40px -18px rgb(93 10 52 / 0.7)";
  const ejemplo = "opacity-45";
  /* El tamaño del regalo segun el largo del nombre (ver lib/giftcards.ts):
     asi un tratamiento de 59 letras no estira la tarjeta hasta dejarla
     cuadrada. */
  const letra = {
    grande: "text-[1.75rem] sm:text-[2rem]",
    medio: "text-[1.3125rem] sm:text-[1.625rem]",
    chico: "text-[1.0625rem] sm:text-[1.3125rem]",
  }[tamanoRegalo(regalo || "Tu regalo")];

  /* El dorso: el mismo papel, con el monograma al centro. */
  const papel = (
    <span aria-hidden className="absolute inset-0 -z-10 overflow-hidden rounded-suave" style={{ background: e.fondo }}>
      {e.extra && <span className="absolute inset-0" style={{ background: e.extra }} />}
      {/* El filete: el marco fino adentro del borde. */}
      <span className="absolute inset-2.5 rounded-[1.05rem] border border-current/20" />
    </span>
  );

  const dorso = sorpresa && !apagada && (
    <span
      className="relative isolate flex size-full flex-col items-center justify-center gap-4 rounded-suave"
      style={{ color, boxShadow: sombra }}
    >
      {papel}
      <LogoMarca alto={56} sobreOscuro={!claro} />
      <span className="tarjeta3d-latir font-display text-[0.8125rem] font-semibold tracking-[0.16em] uppercase opacity-80">
        Tocá para darla vuelta
      </span>
    </span>
  );

  return (
    <Tarjeta3D quieta={apagada} dorso={dorso || undefined}>
      <div
        className={`relative isolate flex aspect-[1.6] w-full flex-col justify-between rounded-suave p-6 sm:p-7 ${
          apagada ? "opacity-60 grayscale-[0.5]" : ""
        } ${className}`}
        style={{ color, boxShadow: sombra }}
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 overflow-hidden rounded-suave"
          style={{ background: e.fondo }}
        >
          {e.extra && <span className="absolute inset-0" style={{ background: e.extra }} />}
          {/* El monograma, de marca de agua, saliendo por la esquina. */}
          <LogoMarca alto={170} sobreOscuro={!claro} tenue className="absolute -right-10 -bottom-8" />
          {/* El filete: el marco fino adentro del borde. */}
          <span className="absolute inset-2.5 rounded-[1.05rem] border border-current/20" />
        </span>

        <div className="flex items-start justify-between gap-3">
          <div>
            <LogoMarca alto={22} sobreOscuro={!claro} />
            <p className="mt-2 font-display text-[0.6875rem] leading-none font-semibold tracking-[0.3em] uppercase opacity-70">
              Giftcard
            </p>
          </div>
          <IconoRegalo className="h-7 w-7 shrink-0 opacity-85" />
        </div>

        <div className="py-2 sm:py-3">
          <p className={`text-[0.9375rem] leading-snug ${para ? "opacity-80" : ejemplo}`}>
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
          <p className={de ? "opacity-80" : ejemplo}>De parte de {de || "vos"}</p>
          {codigo && (
            <p className="rounded-full bg-current/10 px-2.5 py-0.5 font-display text-xs font-semibold tracking-[0.1em] tabular-nums ring-1 ring-current/20 sm:px-3 sm:py-1 sm:text-sm sm:tracking-[0.12em]">
              {codigo}
            </p>
          )}
        </div>
      </div>
    </Tarjeta3D>
  );
}
