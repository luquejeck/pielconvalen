"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { descuentoDe, fotoDe, precioDe } from "@/lib/productos";
import { formatearPrecio } from "@/lib/tratamientos";
import { linkPedido } from "@/lib/whatsapp";
import { useCarrito } from "./CarritoContext";
import { IconoPin, IconoWhatsApp } from "./iconos";

/**
 * El pedido: el panel que se abre desde la bolsa del encabezado, desde
 * la barra de abajo en el celular y desde el aviso de "Agregado".
 *
 * SOLO EXISTE CON ALGO ADENTRO. Un carrito vacio en una web que no
 * cobra nada es una promesa que la pagina no cumple: no hay checkout ni
 * pago, y quien lo toca esperando uno se desorienta. Con productos
 * adentro, en cambio, es exactamente lo que dice ser: la lista que esta
 * armando.
 *
 * ES EL ULTIMO PASO ANTES DE MANDAR, asi que tiene que contestar las
 * tres preguntas que frenan a una clienta de sesenta justo ahi:
 *   - ¿que me llevo?     cada renglon, y adentro del combo lo que trae
 *   - ¿cuanto ahorre?    en verde, debajo del total
 *   - ¿y despues que?    que se abre WhatsApp y donde se retira
 */
export default function Carrito({
  whatsapp,
  direccion,
}: {
  whatsapp: string;
  /** Donde se retira: sale de la configuracion que edita Valen. */
  direccion: string;
}) {
  const {
    detalle,
    unidades,
    total,
    agregar,
    quitar,
    vaciar,
    listo,
    abierto,
    cerrar,
  } = useCarrito();

  /* "Vaciar" pide confirmacion: primer toque pregunta, segundo borra. */
  const [confirmando, setConfirmando] = useState(false);

  const vacio = detalle.length === 0;

  // Si se vacia con el panel abierto, el panel se cierra solo.
  useEffect(() => {
    if (vacio) cerrar();
  }, [vacio, cerrar]);

  /* Cerrar el panel olvida la pregunta de "vaciar": al volver a abrirlo
     tiene que estar como siempre, no esperando un "si" de antes. */
  useEffect(() => {
    if (!abierto) setConfirmando(false);
  }, [abierto]);

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
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, cerrar]);

  if (!listo || vacio || !abierto) return null;

  const hayAConfirmar = detalle.some((d) => d.producto.precio === 0);

  /*
    LO QUE SE AHORRA, SUMADO.

    Sale de `precioAnterior`, que tienen los productos en oferta y los
    combos (ahi es la suma de sus productos). Es el dato que Mercado
    Libre pone en verde en el carrito, y justo antes de mandar es cuando
    mas pesa: convierte "voy a gastar $245.000" en "me ahorre $20.000".
  */
  const ahorro = detalle.reduce(
    (n, { producto, cantidad }) =>
      descuentoDe(producto) !== null ? n + (producto.precioAnterior! - producto.precio) * cantidad : n,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* El velo cierra al tocar afuera, que es lo primero que
              intenta cualquiera para salir de un panel. */}
      <button
        type="button"
        aria-label="Cerrar el pedido"
        onClick={cerrar}
        className="absolute inset-0 bg-tinta/50 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mi pedido"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-suave bg-crema sm:max-h-[85vh] sm:rounded-suave"
      >
        <header className="flex items-center justify-between gap-3 border-b border-borde px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-tinta">
              Mi pedido
            </h2>
            {/* La cuenta arriba de todo: lo primero que quiere saber
                quien abre el panel es cuanto junto. */}
            <p className="text-base text-tinta-suave">
              {unidades} {unidades === 1 ? "unidad" : "unidades"}
            </p>
          </div>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center rounded-full text-2xl leading-none text-tinta-suave transition-colors hover:bg-crema-oscuro hover:text-tinta"
          >
            <span aria-hidden>×</span>
          </button>
        </header>

        <ul className="flex-1 overflow-y-auto px-5 py-2">
          {detalle.map(({ producto, cantidad, subtotal }) => {
            const rebajado = descuentoDe(producto) !== null;
            return (
              <li
                key={producto.id}
                className="flex items-start gap-3 border-b border-borde py-3 last:border-0"
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

                  {/* Lo que trae el combo. Sin esto, "Rutina full" era una
                      caja cerrada justo en el momento de confirmar. */}
                  {producto.incluye && (
                    <ul className="mt-1 space-y-0.5 text-sm leading-snug text-tinta-suave">
                      {producto.incluye.map((x) => (
                        <li key={x}>· {x}</li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-0.5 text-sm text-tinta-suave tabular-nums">
                    {rebajado && (
                      <span className="mr-1.5 line-through">
                        {formatearPrecio(producto.precioAnterior!)}
                      </span>
                    )}
                    {precioDe(producto)} c/u
                  </p>
                </div>

                {/* Los botones miden 44 px: eran de 36, el tamaño en que un
                    dedo de sesenta años le erra al "−" y toca el "+". */}
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <div className="inline-flex items-center rounded-full bg-crema-oscuro">
                    <button
                      type="button"
                      onClick={() => quitar(producto.id)}
                      aria-label={`Quitar una unidad de ${producto.nombre}`}
                      className="flex size-11 items-center justify-center rounded-full text-xl text-tinta transition-colors hover:text-vino"
                    >
                      <span aria-hidden>−</span>
                    </button>
                    <span
                      aria-live="polite"
                      className="min-w-5 text-center font-display text-lg font-semibold text-tinta tabular-nums"
                    >
                      {cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => agregar(producto.id)}
                      aria-label={`Agregar otra unidad de ${producto.nombre}`}
                      className="flex size-11 items-center justify-center rounded-full text-xl text-tinta transition-colors hover:text-vino"
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
            );
          })}
        </ul>

        <footer className="border-t border-borde px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <p className="flex items-baseline justify-between gap-3 font-display text-lg text-tinta">
            <span>Total</span>
            <span className="text-2xl font-semibold tabular-nums">
              {formatearPrecio(total)}
            </span>
          </p>

          {ahorro > 0 && (
            <p className="mt-0.5 text-right text-base font-semibold text-positivo tabular-nums">
              Ahorrás {formatearPrecio(ahorro)} en este pedido
            </p>
          )}

          {/* Se avisa antes de mandar, no despues: si el total que se
                  ve no incluye todo, la clienta tiene que saberlo ahora. */}
          {hayAConfirmar && (
            <p className="mt-1 text-sm leading-snug text-tinta-suave">
              Hay productos sin precio publicado. Valen te lo confirma por
              WhatsApp.
            </p>
          )}

          {/*
            QUE PASA DESPUES DE TOCAR EL BOTON.

            La web no cobra ni manda nada, y eso no estaba escrito en
            ningun lado que la clienta viera. Para quien compra poco por
            internet, "¿y ahora donde pago?" es lo que frena el ultimo
            toque. Se dice lo que es seguro —se abre WhatsApp, se retira en
            el consultorio— y el pago queda para hablarlo con Valen: la
            web no promete medios de pago que no conoce.
          */}
          <ul className="mt-3 space-y-1.5 rounded-chico bg-papel px-3.5 py-3 text-[0.9375rem] leading-snug text-tinta-suave">
            <li className="flex gap-2.5">
              <IconoWhatsApp className="mt-0.5 h-4 w-4 shrink-0 text-vino" />
              <span>
                Se abre WhatsApp con tu pedido ya escrito. Solo tenés que
                enviarlo.
              </span>
            </li>
            <li className="flex gap-2.5">
              <IconoPin className="mt-0.5 h-4 w-4 shrink-0 text-vino" />
              <span>
                Lo retirás en el consultorio, {direccion}. El pago lo
                coordinás con Valen.
              </span>
            </li>
          </ul>

          <a
            href={linkPedido(
              detalle.map(({ producto, cantidad }) => ({
                marca: producto.marca,
                nombre: producto.nombre,
                medida: producto.medida,
                precio: producto.precio,
                cantidad,
              })),
              whatsapp,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="boton-principal mt-4 w-full"
          >
            <IconoWhatsApp className="h-5 w-5" />
            Enviar pedido por WhatsApp
          </a>

          {/*
            VACIAR PREGUNTA ANTES.

            Estaba pegado debajo de "Enviar" y borraba todo de un toque:
            con un dedo menos preciso, errarle al boton grande por un
            centimetro era perder el pedido entero sin forma de volver.
            Ahora el primer toque pregunta y el "Si" queda en rojo, lejos
            de donde estaba el boton de enviar.
          */}
          {confirmando ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-chico bg-negativo-suave px-4 py-2.5">
              <p className="text-base font-semibold text-tinta">¿Vaciar todo el pedido?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmando(false)}
                  className="min-h-11 rounded-full border border-borde bg-papel px-4 text-base font-semibold text-tinta"
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => {
                    vaciar();
                    setConfirmando(false);
                  }}
                  className="min-h-11 rounded-full bg-negativo px-4 text-base font-semibold text-white"
                >
                  Sí, vaciar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmando(true)}
              className="mt-3 min-h-11 w-full text-base text-tinta-suave transition-colors hover:text-vino"
            >
              Vaciar el pedido
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
