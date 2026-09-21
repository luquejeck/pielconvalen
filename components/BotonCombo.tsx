"use client";

import { formatearPrecio } from "@/lib/tratamientos";
import { useCarrito } from "./CarritoContext";

/**
 * El boton del combo: grande, a todo el ancho, y con el precio adentro.
 *
 * NO ES EL "+ AGREGAR" DE LAS FICHAS. Ese es chico a proposito —hay
 * quince por pantalla y no pueden gritar todos—. El combo es uno solo y
 * es la compra que mas conviene, asi que el boton dice exactamente que
 * pasa al tocarlo: "Llevate los 3 por $88.200". Es como lo resuelven
 * Mercado Libre y Amazon: el precio del conjunto en el boton, para que
 * no haya que buscarlo.
 *
 * AL AGREGAR, ABRE EL PEDIDO. Un combo son tres cosas de golpe, y sin
 * ver el carrito queda la duda de si entro. Abrirlo lo confirma y deja
 * el "Enviar el pedido" a un toque.
 */
export default function BotonCombo({
  id,
  cuantos,
  precio,
}: {
  id: string;
  cuantos: number;
  precio: number;
}) {
  const { cantidadDe, agregar, abrir, listo } = useCarrito();
  const enElPedido = listo && cantidadDe(id) > 0;

  if (enElPedido) {
    return (
      <button
        type="button"
        onClick={abrir}
        className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full border-2 border-positivo bg-positivo-suave px-6 font-display text-base font-semibold text-positivo transition-colors hover:bg-positivo hover:text-white"
      >
        <span aria-hidden>✓</span>
        El combo está en tu pedido · Ver pedido
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        agregar(id);
        abrir();
      }}
      className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-vino px-6 font-display text-base font-semibold text-white shadow-md transition-colors hover:bg-vino-oscuro"
    >
      Llevate los {cuantos} por {formatearPrecio(precio)}
    </button>
  );
}
