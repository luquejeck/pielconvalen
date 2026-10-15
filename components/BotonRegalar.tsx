"use client";

import { useCarrito } from "./CarritoContext";

/**
 * El boton de la banda del Dia de la Madre: "Regalárselo →".
 *
 * Va dibujado como un enlace subrayado y no como el boton lleno de las
 * fichas, porque la banda es una pagina de revista —foto grande, una
 * frase fina— y un boton vino ancho la volvia una ficha mas. Pero hace
 * lo mismo que el de las fichas: suma el producto al pedido y avisa.
 *
 * YA SUMADO, NO SUMA OTRO: dice que esta en el pedido y lo abre. Un
 * segundo toque que agregara una segunda caja sin decir nada es como se
 * termina pidiendo dos regalos sin querer.
 *
 * Antes de leer lo guardado dibuja siempre "Regalárselo", que es lo que
 * manda el servidor (ver ControlCarrito).
 */
export default function BotonRegalar({ id, nombre }: { id: string; nombre: string }) {
  const { cantidadDe, agregar, avisar, abrir, listo } = useCarrito();
  const yaEsta = listo && cantidadDe(id) > 0;

  return (
    <button
      type="button"
      onClick={() => {
        if (yaEsta) return abrir();
        agregar(id);
        avisar(nombre);
      }}
      className="group inline-flex min-h-11 items-center gap-2.5 border-b-2 border-vino font-display text-base font-semibold text-vino"
    >
      {yaEsta ? "Ya está en tu pedido · Ver pedido" : "Regalárselo"}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
      {!yaEsta && <span className="sr-only">: agregar {nombre} al pedido</span>}
    </button>
  );
}
