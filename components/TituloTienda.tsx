import Link from "next/link";

/**
 * El encabezado de las secciones de tienda: una linea a cada lado del
 * titulo, y debajo el link a "ver todo".
 *
 * Es otro componente y no TituloSeccion porque dicen cosas distintas.
 * TituloSeccion es editorial —titulo grande y una bajada que explica— y
 * lo usan las secciones donde hay algo que entender. Este es un rotulo
 * de estante: corto, en versalitas, centrado entre dos reglas, y lo que
 * lleva debajo no es una explicacion sino una puerta.
 *
 * Las reglas se estiran solas con `flex-1`, asi que el titulo queda
 * centrado sin importar cuanto mida y las dos lineas siempre miden lo
 * mismo. Van con `aria-hidden` porque no dicen nada: son un adorno, y un
 * lector de pantalla que las anuncie solo estorba.
 */
export default function TituloTienda({
  titulo,
  verTodo,
}: {
  titulo: string;
  /** El link de abajo. Sin esto, el titulo va solo. */
  verTodo?: { href: string; texto: string };
}) {
  return (
    <header className="text-center">
      <div className="flex items-center gap-4 sm:gap-6">
        <span aria-hidden className="h-px flex-1 bg-tinta/25" />
        <h2 className="font-display text-xl font-semibold tracking-[0.1em] text-tinta uppercase sm:text-2xl">
          {titulo}
        </h2>
        <span aria-hidden className="h-px flex-1 bg-tinta/25" />
      </div>

      {verTodo && (
        <Link
          href={verTodo.href}
          className="mt-3 inline-block text-base text-tinta-suave underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-vino hover:decoration-vino"
        >
          {verTodo.texto}
        </Link>
      )}
    </header>
  );
}
