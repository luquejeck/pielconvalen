"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fotoDe, precioDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import { linkPedido } from "@/lib/whatsapp";
import { useCarrito } from "./CarritoContext";
import { IconoWhatsApp } from "./iconos";

/**
 * El pedido: un boton flotante con la cuenta, y un panel que se abre.
 *
 * VA ABAJO A LA IZQUIERDA, no a la derecha, porque a la derecha ya esta
 * el boton de WhatsApp de la portada. Dos circulos en la misma esquina
 * se tapan, y coordinarlos obligaria a que cada uno supiera del otro.
 *
 * SOLO APARECE CON ALGO ADENTRO. Un carrito vacio flotando en una web
 * que no cobra nada es una promesa que la pagina no cumple: no hay
 * checkout ni pago, y quien lo toca esperando uno se desorienta. Con
 * productos adentro, en cambio, es exactamente lo que dice ser: la
 * lista que esta armando.
 */
export default function Carrito({ whatsapp }: { whatsapp: string }) {
  const { detalle, unidades, total, agregar, quitar, vaciar, listo } = useCarrito();
  const [abierto, setAbierto] = useState(false);

  const vacio = detalle.length === 0;

  // Si se vacia con el panel abierto, el panel se cierra solo.
  useEffect(() => {
    if (vacio) setAbierto(false);
  }, [vacio]);

  /* Con el panel abierto, la pagina de atras no se mueve: en celular,
     scrollear adentro del panel arrastraba la pagina y el pedido se iba
     de pantalla. */
  useEffect(() => {
    if (!abierto) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [abierto]);

  // Escape cierra, que es lo que espera cualquiera que use teclado.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  if (!listo || vacio) return null;

  const hayAConfirmar = detalle.some((d) => d.producto.precio === 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Ver mi pedido: ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`}
        className="fixed bottom-5 left-5 z-50 flex min-h-14 items-center gap-2.5 rounded-full bg-tinta px-5 py-3.5 text-crema shadow-xl ring-3 shadow-tinta/25 ring-white/85 transition-transform hover:scale-105 active:scale-95"
      >
        <IconoBolsa className="h-6 w-6 shrink-0" />
        <span className="font-display text-lg font-semibold tabular-nums">
          {unidades}
        </span>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* El velo cierra al tocar afuera, que es lo primero que
              intenta cualquiera para salir de un panel. */}
          <button
            type="button"
            aria-label="Cerrar el pedido"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-tinta/50 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mi pedido"
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-suave bg-crema sm:rounded-suave"
          >
            <header className="flex items-center justify-between gap-3 border-b border-borde px-5 py-4">
              <h2 className="font-display text-xl font-semibold text-tinta">
                Mi pedido
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="flex size-9 items-center justify-center rounded-full text-2xl leading-none text-tinta-suave transition-colors hover:bg-crema-oscuro hover:text-tinta"
              >
                <span aria-hidden>×</span>
              </button>
            </header>

            <ul className="flex-1 overflow-y-auto px-5 py-4">
              {detalle.map(({ producto, cantidad, subtotal }) => (
                <li
                  key={producto.id}
                  className="flex items-center gap-3 border-b border-borde py-3 last:border-0"
                >
                  <Image
                    src={fotoDe(producto)}
                    alt=""
                    width={120}
                    height={120}
                    className="size-16 shrink-0 rounded-chico object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs font-semibold tracking-[0.06em] text-tinta-suave uppercase">
                      {producto.marca}
                    </p>
                    <p className="line-clamp-2 text-base leading-snug text-tinta">
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-tinta-suave tabular-nums">
                      {precioDe(producto)} c/u
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <div className="inline-flex items-center rounded-full bg-crema-oscuro">
                      <button
                        type="button"
                        onClick={() => quitar(producto.id)}
                        aria-label={`Quitar una unidad de ${producto.nombre}`}
                        className="flex size-9 items-center justify-center rounded-full text-lg text-tinta transition-colors hover:text-vino"
                      >
                        <span aria-hidden>−</span>
                      </button>
                      <span
                        aria-live="polite"
                        className="min-w-5 text-center font-display text-base font-semibold text-tinta tabular-nums"
                      >
                        {cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => agregar(producto.id)}
                        aria-label={`Agregar otra unidad de ${producto.nombre}`}
                        className="flex size-9 items-center justify-center rounded-full text-lg text-tinta transition-colors hover:text-vino"
                      >
                        <span aria-hidden>+</span>
                      </button>
                    </div>

                    {producto.precio > 0 && (
                      <p className="font-display text-base font-semibold text-tinta tabular-nums">
                        {formatearPrecio(subtotal)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-borde px-5 py-4">
              <p className="flex items-baseline justify-between gap-3 font-display text-lg text-tinta">
                <span>Total</span>
                <span className="text-xl font-semibold tabular-nums">
                  {formatearPrecio(total)}
                </span>
              </p>

              {/* Se avisa antes de mandar, no despues: si el total que se
                  ve no incluye todo, la clienta tiene que saberlo ahora. */}
              {hayAConfirmar && (
                <p className="mt-1 text-sm leading-snug text-tinta-suave">
                  Hay productos sin precio publicado. Valen te lo confirma por
                  WhatsApp.
                </p>
              )}

              <a
                href={linkPedido(
                  detalle.map(({ producto, cantidad }) => ({
                    marca: producto.marca,
                    nombre: producto.nombre,
                    medida: producto.medida,
                    precio: producto.precio,
                    cantidad,
                  })),
                  whatsapp
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="boton-principal mt-4 w-full"
              >
                <IconoWhatsApp className="h-5 w-5" />
                Enviar el pedido
              </a>

              <button
                type="button"
                onClick={vaciar}
                className="mt-2 w-full py-2 text-base text-tinta-suave transition-colors hover:text-vino"
              >
                Vaciar el pedido
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}

/** La bolsa del boton flotante. Trazo fino, como el resto de los iconos. */
function IconoBolsa({ className = "h-5 w-5" }: { className?: string }) {
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
