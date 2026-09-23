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
 * OCUPAN TODO EL ANCHO DE LA FICHA Y MIDEN 44 PX.
 * Antes era una pastilla angosta de 40, pegada a la izquierda. Para una
 * clienta de sesenta el blanco a tocar es lo que decide si la compra
 * sale al primer intento, y ancho completo es lo que hace Mercado Libre
 * en celular. No le quita lugar al precio: crece para los costados, que
 * estaban vacios.
 *
 * YA SUMADO, CAMBIA DE PESO: fondo vino diluido en vez de vino lleno.
 * El boton lleno quiere decir "tocame para agregar"; el claro, "esto ya
 * esta, aca ajustas cuantos". Con los dos iguales, de lejos no se
 * distinguia que fichas ya estaban en el pedido.
 *
 * EL COMBO USA ESTE MISMO CONTROL, en grande. Antes tenia su propio
 * boton que al tocarlo abria el pedido entero encima de la pagina: dos
 * maneras distintas de "agregar" en la misma tienda. Ahora todo lo que
 * se agrega se comporta igual, y el aviso de abajo confirma en los dos.
 */
export default function ControlCarrito({
  id,
  nombre,
  texto = "Agregar",
  grande = false,
}: {
  id: string;
  /** Marca y nombre: los canta el lector de pantalla y los dice el aviso. */
  nombre: string;
  /** Lo que dice el boton antes de agregar. */
  texto?: string;
  /* La tarjeta del combo es ancha y es la compra mas grande de la
     tienda: el boton pesa como tal, y ya sumado dice "en tu pedido"
     con palabras, porque ahi hay lugar. */
  grande?: boolean;
}) {
  const { cantidadDe, agregar, quitar, listo, avisar } = useCarrito();
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
        onClick={() => {
          agregar(id);
          avisar(nombre);
        }}
        className={`flex w-full items-center justify-center gap-1.5 rounded-full bg-vino px-3 font-display font-semibold text-white transition-colors hover:bg-vino-oscuro active:scale-[0.98] ${
          grande ? "mt-4 min-h-13 text-base shadow-boton" : "mt-3 min-h-11 text-[0.9375rem]"
        }`}
      >
        <span aria-hidden>+</span>
        {texto}
        <span className="sr-only">: {nombre}</span>
      </button>
    );
  }

  return (
    <div
      className={`flex w-full items-center justify-between rounded-full bg-vino-suave text-vino ${
        grande ? "mt-4 min-h-13" : "mt-3 min-h-11"
      }`}
    >
      <button
        type="button"
        onClick={() => quitar(id)}
        aria-label={`Quitar una unidad de ${nombre}`}
        className={`flex items-center justify-center rounded-full text-xl transition-colors hover:bg-vino hover:text-white ${
          grande ? "size-13" : "size-11"
        }`}
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
        className="min-w-6 text-center font-display text-lg font-semibold tabular-nums"
      >
        {cantidad}
        {grande && <span className="font-normal"> en tu pedido</span>}
      </span>

      <button
        type="button"
        onClick={() => agregar(id)}
        aria-label={`Agregar otra unidad de ${nombre}`}
        className={`flex items-center justify-center rounded-full text-xl transition-colors hover:bg-vino hover:text-white ${
          grande ? "size-13" : "size-11"
        }`}
      >
        <span aria-hidden>+</span>
      </button>
    </div>
  );
}
