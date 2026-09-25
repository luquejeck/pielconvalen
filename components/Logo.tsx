import Image from "next/image";

/**
 * El monograma VG, con fondo transparente (Lucas, 25-09-2026).
 *
 * El archivo esta recortado justo al monograma: 830 x 428. Antes era un
 * JPG cuadrado con fondo blanco y el nombre debajo, y habia que
 * recortarlo con margenes negativos y borrar el blanco con
 * `mix-blend-multiply`. Con transparencia, se dibuja tal cual y sirve
 * sobre cualquier fondo.
 */
const ARCHIVO = "/imagenes/logo-vg.png";
const ANCHO = 830;
const ALTO = 428;

export function LogoMarca({
  alto = 30,
  className = "",
  sobreOscuro = false,
  tenue = false,
}: {
  alto?: number;
  className?: string;
  /** En claro, para fondos oscuros como la giftcard. */
  sobreOscuro?: boolean;
  /** Apenas insinuado: de marca de agua. */
  tenue?: boolean;
}) {
  const ancho = Math.round((alto * ANCHO) / ALTO);

  return (
    <Image
      src={ARCHIVO}
      alt={tenue ? "" : "Piel con Valen"}
      width={ancho}
      height={alto}
      /* El ancho real al que se dibuja: sin esto Next pide variantes de
         640 px para un logo de 50. Y sin `priority`: un logo de 26 px de
         alto no merece precargarse antes que el titulo de la pagina. */
      sizes={`${ancho}px`}
      className={`block max-w-none shrink-0 ${sobreOscuro ? "brightness-0 invert" : ""} ${
        tenue ? "opacity-[0.08]" : ""
      } ${className}`}
      style={{ width: ancho, height: alto }}
    />
  );
}
