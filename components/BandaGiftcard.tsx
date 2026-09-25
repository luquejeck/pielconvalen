import Link from "next/link";
import { IconoRegalo } from "./iconos";
import { LogoMarca } from "./Logo";

/**
 * Las giftcards en la portada: una tarjeta compacta que lleva a /giftcard.
 *
 * PROBADO EN LOS DOS EXTREMOS. Primero fue una tarjeta grande con la
 * giftcard dibujada al lado (593 px de alto en el celular): era lo mas
 * llamativo de esa parte de la pagina y le sacaba presencia al turno y a
 * los productos. Despues, un renglon de texto: pasaba desapercibido
 * (Lucas, 25-09-2026).
 *
 * El punto medio: una giftcard en miniatura —del tamaño de una foto de
 * producto en el pedido—, un titulo y un boton, todo en una fila. Se
 * reconoce de un vistazo que es un regalo, y mide lo que una tarjeta de
 * producto. El detalle queda en /giftcard.
 */
export default function BandaGiftcard() {
  return (
    <section id="giftcards" className="border-t border-borde bg-crema">
      <div className="contenedor py-6 md:py-8">
        <div className="tarjeta mx-auto flex max-w-2xl flex-wrap items-center gap-x-5 gap-y-4 px-5 py-5 sm:flex-nowrap sm:px-6">
          {/* La giftcard en miniatura: el mismo degrade, el monograma y
              la caja de regalo que la de verdad, sin los textos que a
              este tamaño no se leen. */}
          <span
            aria-hidden
            className="relative isolate flex aspect-[1.6] w-24 shrink-0 -rotate-6 flex-col justify-between rounded-chico p-2.5 shadow-[0_10px_22px_-10px_rgb(93_10_52/0.7)] sm:w-28"
          >
            <span className="absolute inset-0 -z-10 overflow-hidden rounded-chico bg-[linear-gradient(135deg,#931656_0%,var(--color-vino)_42%,var(--color-vino-oscuro)_100%)]">
              <span className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.1)_45%,transparent_60%)]" />
              <span className="absolute inset-1 rounded-[0.6rem] border border-crema/20" />
            </span>
            <span className="flex items-start justify-between">
              <LogoMarca alto={11} sobreOscuro />
              <IconoRegalo className="h-3.5 w-3.5 text-crema/85" />
            </span>
            <span className="font-display text-[0.5rem] font-semibold tracking-[0.25em] text-crema/75 uppercase">
              Giftcard
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl leading-tight font-semibold text-tinta">
              Regalá una sesión
            </h2>
            <p className="mt-1 text-base leading-snug text-tinta-suave">
              Una giftcard con el tratamiento o el monto que elijas.
            </p>
          </div>

          <Link href="/giftcard" className="boton-secundario min-h-12 w-full shrink-0 px-6 sm:w-auto">
            Ver giftcards
          </Link>
        </div>
      </div>
    </section>
  );
}
