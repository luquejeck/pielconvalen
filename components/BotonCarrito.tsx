"use client";

import { useCarrito } from "./CarritoContext";

/**
 * El acceso al pedido, en el encabezado.
 *
 * ANTES FLOTABA ABAJO A LA IZQUIERDA y no se entendia. Un circulo suelto
 * sobre el contenido no dice de que es hasta que se lo toca, y en una web
 * que no cobra nada lo primero que se piensa es que lleva a un checkout.
 * En el encabezado esta donde lo busca cualquiera que compro alguna vez
 * por internet —arriba a la derecha, al lado del boton principal— y se ve
 * en todas las paginas sin taparle nada a nadie.
 *
 * SOLO APARECE CON ALGO ADENTRO: un carrito vacio en una web que no tiene
 * caja es una promesa que la pagina no cumple.
 *
 * El numero va en una pastilla pegada al icono y no adentro: adentro del
 * dibujo de la bolsa no entra un 2 de dos digitos, y con doce unidades el
 * numero se comia el icono.
 */
export default function BotonCarrito() {
  const { unidades, abrir, listo } = useCarrito();

  if (!listo || unidades === 0) return null;

  return (
    <button
      type="button"
      onClick={abrir}
      aria-label={`Ver mi pedido: ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`}
      className="relative flex size-11 shrink-0 items-center justify-center rounded-full text-vino transition-colors hover:bg-vino-suave"
    >
      <IconoBolsa className="h-6 w-6" />
      <span
        aria-hidden
        className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-vino px-1 font-display text-xs font-semibold text-white tabular-nums"
      >
        {unidades}
      </span>
    </button>
  );
}

/** La bolsa. Trazo fino, como el resto de los iconos de la web. */
export function IconoBolsa({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}
