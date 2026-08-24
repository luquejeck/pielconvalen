/**
 * Capa de fondo: foto difuminada + velo de color encima.
 *
 * Si el archivo de imagen no existe, el navegador simplemente no lo carga
 * y queda el degradado solo, que tambien se ve bien. Es decir: poner o sacar
 * fotos de /public/imagenes no rompe nada.
 *
 * El velo (`overlay`) es lo que garantiza que el texto siga legible:
 * cuanto mas fuerte, mas contraste tiene la tipografia encima.
 */
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
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center blur-xs"
        style={{
          backgroundImage: `url('${imagen}')`,
          opacity: intensidad / 100,
          filter: filtro,
        }}
      />
      <div className={`absolute inset-0 ${velo}`} />
    </div>
  );
}
