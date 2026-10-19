import Link from "next/link";

/**
 * El encabezado de las secciones de tienda, con el mismo estilo que el
 * resto de la portada.
 *
 * Fue un rotulo de estante: versalitas centradas entre dos reglas. Al
 * lado de los titulos grandes y livianos de las demas secciones se leia
 * como otro sitio pegado en el medio (19-10-2026). Ahora es el mismo
 * titulo de TituloSeccion, con dos cosas que solo tiene la tienda: una
 * bajada que puede llevar un icono y el link a "ver todo" debajo.
 *
 * `sub` es para un estante adentro de una seccion (los combos debajo de
 * los productos): mismo trazo, un paso mas chico, y en h3.
 */
export default function TituloTienda({
  titulo,
  bajada,
  verTodo,
  sub = false,
}: {
  titulo: string;
  /** Una linea corta debajo del titulo, antes del link. */
  bajada?: React.ReactNode;
  /** El link de abajo. Sin esto, el titulo va solo. */
  verTodo?: { href: string; texto: string };
  sub?: boolean;
}) {
  const Titulo = sub ? "h3" : "h2";

  return (
    <header className="mx-auto max-w-2xl text-center">
      <Titulo
        className={`font-display font-[350] leading-none tracking-[-0.015em] text-tinta ${
          sub ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
        }`}
      >
        {titulo}
      </Titulo>

      {bajada && (
        <p className="mt-2 flex items-center justify-center gap-2 text-xl leading-snug text-tinta-suave">
          {bajada}
        </p>
      )}

      {verTodo && (
        <Link
          href={verTodo.href}
          className="mt-2 inline-block text-lg text-tinta-suave underline decoration-tinta/30 underline-offset-[6px] transition-colors hover:text-vino hover:decoration-vino"
        >
          {verTodo.texto}
        </Link>
      )}
    </header>
  );
}
