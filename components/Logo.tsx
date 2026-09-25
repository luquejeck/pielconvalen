import Image from "next/image";

const ARCHIVO = "/imagenes/Logo.jpg";

/**
 * Caja del monograma VG dentro de la imagen de 400x400, medida sobre los
 * pixeles del archivo: x 90-314, y 106-221.
 *
 * Se recorta porque el logo original es cuadrado y trae el nombre debajo:
 * a tamaño de header ese texto queda en cuatro pixeles y se ve como una
 * mancha. Recortado al VG, la marca se lee nitida en cualquier tamaño.
 */
const CAJA = { izq: 0.225, arriba: 0.265, ancho: 0.5625, alto: 0.29 };

/**
 * El archivo tiene fondo blanco. `mix-blend-multiply` lo hace desaparecer
 * sobre el crema, asi no queda un recuadro pegado detras de la marca.
 * Por eso este logo sirve sobre fondos claros, no sobre los oscuros.
 */
export function LogoMarca({
  alto = 30,
  className = "",
  sobreOscuro = false,
  tenue = false,
}: {
  alto?: number;
  className?: string;
  /**
   * Para fondos oscuros, como la giftcard. El archivo es vino sobre
   * blanco: se pasa a grises y se invierte (fondo negro, monograma
   * claro) y `screen` borra el negro. Queda el monograma claro sobre
   * lo que haya detras.
   */
  sobreOscuro?: boolean;
  /** Sobre oscuro, apenas insinuado: de marca de agua. */
  tenue?: boolean;
}) {
  const escala = alto / CAJA.alto;

  return (
    <span
      className={`block shrink-0 overflow-hidden ${className}`}
      style={{ height: alto, width: CAJA.ancho * escala }}
    >
      <Image
        src={ARCHIVO}
        alt="Piel con Valen"
        width={400}
        height={400}
        /*
          `sizes` es lo unico que le dice a Next que esto se ve chico.
          Sin el calculaba a partir del width=400 y terminaba pidiendo
          variantes de 640 y 828 px para dibujar un logo de 26 px de
          alto. Va el ancho real al que se dibuja la imagen —`escala`,
          no `alto`, porque de los 400x400 del archivo solo se muestra
          el recuadro del monograma—. Y sin `priority`: un logo de 26 px
          no merece precargarse antes que el titulo de la pagina.
        */
        sizes={`${Math.ceil(escala)}px`}
        className={sobreOscuro ? "mix-blend-screen" : "mix-blend-multiply"}
        style={{
          /* La intensidad se baja con `brightness` y no con `opacity`:
             la opacidad aislaria la imagen y `screen` dejaria de borrar
             el fondo negro. */
          filter: sobreOscuro
            ? `grayscale(1) invert(1) contrast(1.6)${tenue ? " brightness(0.13)" : ""}`
            : undefined,
          height: escala,
          width: escala,
          maxWidth: "none",
          marginTop: -CAJA.arriba * escala,
          marginLeft: -CAJA.izq * escala,
        }}
      />
    </span>
  );
}
