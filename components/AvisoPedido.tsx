"use client";

import { useEffect, useState } from "react";
import { useCarrito } from "./CarritoContext";
import { IconoCheck } from "./iconos";

/**
 * "Agregado al pedido": la confirmacion que aparece al tocar "Agregar".
 *
 * ANTES EL UNICO AVISO ERA QUE EL BOTON CAMBIABA y que aparecia la bolsa
 * arriba, en el encabezado. Para quien compra seguido alcanza; para una
 * clienta de sesenta que compra poco por internet, no: toca, algo cambia
 * en un rincon, y queda la duda de si entro o si hay que tocar de nuevo.
 * Mercado Libre resuelve lo mismo con un cartel que dice "Agregaste a tu
 * carrito" y un boton para ir a verlo. Esto es eso.
 *
 * EN EL CELULAR NO SE DIBUJA: ahi el aviso lo da la barra del pedido
 * (components/BarraPedido.tsx), que cambia por unos segundos a
 * "Agregado". El tiempo lo lleva este componente para los dos.
 *
 * Se va solo a los seis segundos —mas que los cuatro de costumbre,
 * porque este publico lee mas despacio— y se queda quieto mientras el
 * mouse o el foco esten encima, para no desaparecer justo cuando se lo
 * va a tocar.
 *
 * Lo que canta el lector de pantalla va aparte, en un renglon invisible
 * que esta siempre en la pagina: una region `role="status"` solo avisa
 * los cambios si ya existia antes del cambio, y el cartel visible no
 * existe en el celular.
 */
export default function AvisoPedido() {
  const { aviso, cerrarAviso, abrir, abierto } = useCarrito();
  const [quieto, setQuieto] = useState(false);

  useEffect(() => {
    if (!aviso || quieto) return;
    const t = setTimeout(cerrarAviso, 6000);
    return () => clearTimeout(t);
  }, [aviso, quieto, cerrarAviso]);

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {aviso ? `Agregado al pedido: ${aviso.nombre}` : ""}
      </p>

      {aviso && !abierto && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] hidden justify-center px-4 pb-6 md:flex">
          <div
            /* La clave reinicia la entrada: dos "Agregar" seguidos se ven
               como dos avisos y no como uno que se quedo pegado. */
            key={aviso.vez}
            onMouseEnter={() => setQuieto(true)}
            onMouseLeave={() => setQuieto(false)}
            onFocus={() => setQuieto(true)}
            onBlur={() => setQuieto(false)}
            className="animar-entrada pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-suave bg-tinta py-2.5 pr-2.5 pl-4 text-white shadow-xl shadow-tinta/30"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-positivo"
            >
              <IconoCheck className="h-4 w-4" />
            </span>

            <p aria-hidden className="min-w-0 flex-1 leading-snug">
              <span className="block text-base font-semibold">Agregado al pedido</span>
              <span className="block truncate text-[0.9375rem] text-white/75">
                {aviso.nombre}
              </span>
            </p>

            <button
              type="button"
              onClick={abrir}
              className="min-h-11 shrink-0 rounded-full bg-white px-4 font-display text-base font-semibold text-tinta transition-colors hover:bg-vino-suave"
            >
              Ver pedido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
