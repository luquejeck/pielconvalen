import Image from "next/image";

/**
 * Capa de fondo: foto difuminada + velo de color encima.
 *
 * El velo (`overlay`) es lo que garantiza que el texto siga legible:
 * cuanto mas fuerte, mas contraste tiene la tipografia encima.
 *
 * ----------------------------------------------------------------------
 * POR QUE VA CON <Image> Y NO CON background-image
 *
 * Antes la foto se ponia con `background-image` en CSS. Eso la deja
 * afuera del optimizador de Next: el navegador se baja el archivo tal
 * cual esta, sin WebP y sin recortar por tamaño de pantalla. Entre
 * hero.jpg y reservas.jpg eran 394 KB de fotos que despues se muestran
 * borrosas y al 30% de opacidad — 394 KB que una clienta con 4G flojo
 * pagaba para no ver nada.
 *
 * Con <Image fill> las sirve Next: formato moderno, y el ancho que
 * corresponda a la pantalla. La calidad va baja a proposito; con este
 * desenfoque y esta opacidad, no se distingue de la original.
 * ---------------------------------------------------------------------- */
type Props = {
  /** Ruta dentro de /public, ej: "/imagenes/hero.jpg" */
  imagen: string;
  /** Opacidad de la foto, 0 a 100. Cuanto mas bajo, mas sutil. */
  intensidad?: number;
  /** Clases del velo que va encima de la foto. */
  velo?: string;
  /**
   * Filtro CSS para unificar el color de las fotos. Las de banco vienen
   * cada una con su temperatura y su saturacion; bajarlas al mismo punto
   * hace que se lean como parte de la misma pagina.
   */
  filtro?: string;
};

export default function FondoImagen({
  imagen,
  intensidad = 30,
  velo = "bg-linear-to-b from-crema/80 via-crema/88 to-crema",
  filtro,
}: Props) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={imagen}
        alt=""
        fill
        sizes="100vw"
        quality={45}
        /* Es decoracion: no debe competir con el titulo por el ancho de
           banda ni contar como la imagen principal de la pantalla. */
        loading="lazy"
        className="scale-105 object-cover blur-xs"
        style={{ opacity: intensidad / 100, filter: filtro }}
      />
      <div className={`absolute inset-0 ${velo}`} />
    </div>
  );
}
