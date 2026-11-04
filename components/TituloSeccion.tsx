/**
 * Encabezado de seccion, con la estructura que usa Apple en cada bloque
 * de sus paginas de producto: titulo grande y apretado, y debajo una
 * bajada corta en gris, angosta y centrada.
 *
 * La jerarquia la hace el tamaño y el aire, no los adornos: por eso el
 * titulo salta varios pasos de tamaño respecto del texto que lo rodea.
 */
export default function TituloSeccion({
  titulo,
  bajada,
  como = "h2",
}: {
  titulo: string;
  bajada?: string;
  /** La pagina del test lo usa como h1: ahi el titulo es el de la pagina. */
  como?: "h1" | "h2";
}) {
  const Titulo = como;

  return (
    <header className="mx-auto max-w-2xl text-center">
      <Titulo className="text-4xl text-tinta sm:text-5xl">
        {titulo}
      </Titulo>
      {/* Un trazo corto en vino bajo cada titulo: ata las diez
          secciones con un mismo gesto y, al aparecer, se dibuja de
          adentro hacia afuera (globals.css, .titulo-acento). */}
      <span aria-hidden className="titulo-acento mx-auto mt-4 block h-[3px] w-12 rounded-full bg-vino" />
      {bajada && (
        <p className="mt-4 text-xl leading-snug text-balance text-tinta-suave">{bajada}</p>
      )}
    </header>
  );
}
