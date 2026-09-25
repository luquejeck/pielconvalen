import Link from "next/link";
import { IconoFlecha } from "./iconos";

/**
 * Las giftcards en la portada: UN RENGLON que lleva a /giftcard.
 *
 * Estuvo como una tarjeta blanca con la giftcard vino dibujada al lado,
 * y le sacaba presencia al turno y a los productos: era lo mas llamativo
 * de esa parte de la pagina. El detalle —que se regala, como se arma,
 * como se paga— vive en /giftcard, y aca alcanza con que se sepa que
 * existe (Lucas, 25-09-2026).
 */
export default function BandaGiftcard() {
  return (
    <section id="giftcards" className="border-t border-borde bg-crema">
      <div className="contenedor py-5">
        <Link
          href="/giftcard"
          className="group mx-auto flex max-w-2xl items-center justify-center gap-2 text-center text-lg text-tinta-suave transition-colors hover:text-vino"
        >
          <span>
            ¿Es para regalar?{" "}
            <span className="font-semibold text-vino underline decoration-vino/30 underline-offset-4 group-hover:decoration-vino">
              Regalá una giftcard
            </span>
          </span>
          <IconoFlecha className="h-4 w-4 shrink-0 text-vino" />
        </Link>
      </div>
    </section>
  );
}
