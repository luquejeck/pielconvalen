"use client";

import { useCarrito } from "./CarritoContext";

/**
 * El control de cada ficha: "Agregar" cuando no esta en el pedido, y
 * −/cantidad/+ cuando ya esta.
 *
 * Es UN solo boton que se transforma, y no un boton mas un contador al
 * lado. La ficha en celular mide 165px: dos controles separados no
 * entran, y el contador vacio ocupando lugar antes de que existiera el
 * producto en el pedido no le decia nada a nadie.
 *
 * VAN EN VINO, como todo lo que se toca en esta web. Estuvieron un rato
 * en negro, heredado de la tienda de Apple que se habia tomado de
 * referencia, y desentonaban: eran el unico boton del sitio que no era
 * del color de la marca.
 *
 * Los botones miden 40px de alto. Es menos que los 44 que se recomiendan
 * para lo que se toca, pero estan al final de una ficha, aislados, sin
 * nada tocable alrededor a menos de 12px: el riesgo real de errarle es
 * el de un blanco mucho mas grande. Subirlos a 44 obligaba a achicar el
 * precio, que es lo que la clienta vino a leer.
 */
export default function ControlCarrito({
  id,
  nombre,
}: {
  id: string;
  /** Para que el lector de pantalla diga de que producto habla. */
  nombre: string;
}) {
  const { cantidadDe, agregar, quitar, listo } = useCarrito();
  const cantidad = cantidadDe(id);

  /*
    Antes de leer lo guardado se dibuja siempre "Agregar".

    Es lo que el servidor manda, asi que el primer render del navegador
    coincide. Un instante despues, si el producto ya estaba en el pedido,
    aparece la cantidad.
  */
  if (!listo || cantidad === 0) {
    return (
      <button
        type="button"
        onClick={() => agregar(id)}
        className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-vino px-4 font-display text-sm font-medium text-white transition-colors hover:bg-vino-oscuro"
      >
        <span aria-hidden>+</span>
        Agregar
        <span className="sr-only">{nombre} al pedido</span>
      </button>
    );
  }

  return (
    <div className="mt-3 inline-flex min-h-10 items-center rounded-full bg-vino text-white">
      <button
        type="button"
        onClick={() => quitar(id)}
        aria-label={`Quitar una unidad de ${nombre}`}
        className="flex size-10 items-center justify-center rounded-full text-lg transition-colors hover:bg-vino-oscuro"
      >
        <span aria-hidden>−</span>
      </button>

      {/*
        `aria-live` para que el lector cante el numero nuevo al tocar los
        botones: sin esto, quien no ve la pantalla toca "+" tres veces y
        no tiene forma de saber en cuanto quedo.
      */}
      <span
        aria-live="polite"
        className="min-w-6 text-center font-display text-base font-semibold tabular-nums"
      >
        {cantidad}
      </span>

      <button
        type="button"
        onClick={() => agregar(id)}
        aria-label={`Agregar otra unidad de ${nombre}`}
        className="flex size-10 items-center justify-center rounded-full text-lg transition-colors hover:bg-vino-oscuro"
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
