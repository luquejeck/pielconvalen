"use client";

import { usePathname } from "next/navigation";
import { formatearPrecio } from "@/lib/tratamientos";
import { IconoBolsa } from "./BotonCarrito";
import { useCarrito } from "./CarritoContext";
import { IconoCheck } from "./iconos";

/**
 * La barra del pedido, fija abajo en el celular.
 *
 * ANTES EL PEDIDO ERA UNA BOLSITA DE 24 PX ARRIBA, sin palabras. Quien
 * compra seguido la reconoce; una clienta de sesenta agrega un producto,
 * sigue mirando, y cuando quiere mandar el pedido no sabe donde quedo.
 * Esta barra lo dice todo el tiempo y con palabras: cuantos productos,
 * cuanto va, y un boton "Ver pedido". Es lo que hacen las apps de
 * delivery que esta clienta ya usa.
 *
 * TODA LA BARRA ES EL BOTON, no solo la pastilla de la derecha: 72 px de
 * alto por el ancho de la pantalla no se le erran.
 *
 * TAMBIEN ES EL AVISO DE "AGREGADO". En el celular el cartel flotante
 * quedaba apilado encima de la barra: dos cosas tapando el pie de la
 * pantalla. Ahora la barra misma cambia por seis segundos a "Agregado al
 * pedido" con el nombre, y despues vuelve a la cuenta. En pantallas
 * grandes no hay barra —la bolsa del encabezado dice "Mi pedido"— y el
 * aviso sigue siendo el cartel (components/AvisoPedido.tsx), que es el
 * que maneja el tiempo en los dos casos.
 *
 * No va en el panel de Valen: comparte el layout con la web, y un pedido
 * de prueba guardado en su telefono no tiene que aparecerle ahi.
 */
export default function BarraPedido() {
  const { listo, unidades, total, abrir, abierto, aviso } = useCarrito();
  const ruta = usePathname();

  if (!listo || unidades === 0 || ruta.startsWith("/admin")) return null;

  return (
    <>
      {/* El hueco que ocupa la barra, al final de la pagina: sin esto
          tapaba el ultimo renglon del pie. */}
      <div aria-hidden className="h-20 bg-tinta md:hidden" />

      <button
        type="button"
        onClick={abrir}
        aria-label={`Ver mi pedido: ${unidades} ${unidades === 1 ? "producto" : "productos"}, ${formatearPrecio(total)}`}
        className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-borde bg-papel/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-left shadow-[0_-10px_30px_-14px_rgb(30_16_21/0.3)] backdrop-blur-md md:hidden ${
          abierto ? "invisible" : ""
        }`}
      >
        {aviso ? (
          <>
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-positivo text-white"
            >
              <IconoCheck className="h-4 w-4" />
            </span>
            <span key={aviso.vez} className="animar-entrada min-w-0 flex-1 leading-snug">
              <span className="block text-base font-semibold text-tinta">Agregado al pedido</span>
              <span className="block truncate text-[0.9375rem] text-tinta-suave">{aviso.nombre}</span>
            </span>
          </>
        ) : (
          <>
            <span className="relative shrink-0 text-vino" aria-hidden>
              <IconoBolsa className="h-7 w-7" />
              <span className="absolute -top-1 -right-2 flex min-w-5 items-center justify-center rounded-full bg-vino px-1 font-display text-xs font-semibold text-white tabular-nums">
                {unidades}
              </span>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[0.9375rem] text-tinta-suave">
                Tu pedido · {unidades} {unidades === 1 ? "producto" : "productos"}
              </span>
              <span className="block font-display text-xl font-semibold text-tinta tabular-nums">
                {formatearPrecio(total)}
              </span>
            </span>
          </>
        )}

        <span className="flex min-h-12 shrink-0 items-center rounded-full bg-vino px-5 font-display text-base font-semibold text-white">
          Ver pedido
        </span>
      </button>
    </>
  );
}
