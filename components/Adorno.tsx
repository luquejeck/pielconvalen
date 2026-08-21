/**
 * Filete decorativo que va debajo de cada titulo de seccion.
 * Es el separador visual de la pagina: repetido en las tres secciones
 * arma un ritmo, y de paso despega el titulo del contenido sin
 * necesidad de sumar mas texto.
 */
export default function Adorno({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center gap-3 ${className}`}
    >
      <span className="h-px w-10 bg-linear-to-r from-transparent to-vino/35 sm:w-14" />
      <span className="h-1.5 w-1.5 rotate-45 bg-vino/45" />
      <span className="h-px w-10 bg-linear-to-l from-transparent to-vino/35 sm:w-14" />
    </div>
  );
}
