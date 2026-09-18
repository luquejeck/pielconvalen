"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconoFlecha } from "./iconos";

/**
 * La fila de productos que se desliza al costado.
 *
 * EL DESPLAZAMIENTO NO NECESITA JAVASCRIPT: es `overflow-x-auto` con
 * `scroll-snap`, asi que el dedo en el celular y la rueda en el
 * escritorio funcionan aunque el script no llegue a cargar. Lo unico que
 * agrega este componente son las flechas y los puntos, que son ayudas: si
 * no aparecen, la fila igual se recorre.
 *
 * POR QUE CARRUSEL EN LA PORTADA Y GRILLA EN EL CATALOGO
 * Son dos preguntas distintas. En la portada la pregunta es "¿esta
 * vende productos?", y una fila que se corta a la derecha la contesta
 * mejor que una grilla: se ve que hay mas. En /productos la pregunta es
 * "¿cual me llevo?", y ahi esconder la mitad del catalogo detras de un
 * gesto juega en contra, asi que va grilla.
 *
 * Los puntos marcan PANTALLAS, no productos: con trece productos y dos
 * visibles por vez, trece puntos no le dicen nada a nadie. Siete si.
 */
export default function CarruselProductos({
  children,
  etiqueta,
}: {
  children: React.ReactNode;
  /** Para el lector de pantalla: "Productos destacados", "Sérums". */
  etiqueta: string;
}) {
  const pista = useRef<HTMLUListElement>(null);
  const [pagina, setPagina] = useState(0);
  const [paginas, setPaginas] = useState(1);

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    /*
      `scrollWidth - clientWidth` es lo que queda por recorrer. Se compara
      contra 4px y no contra 0 porque los navegadores redondean el ancho
      a subpixeles: una fila que entra justa daba 0,5px de sobra y
      dibujaba flechas y dos puntos para un carrusel que no se movia.

      Las paginas se redondean al mas cercano y NO para arriba. Con
      `ceil` el espacio entre fichas inventaba una pagina de mas: cuatro
      productos de a dos miden 2 pantallas y un huequito, y `ceil(2,03)`
      daba 3 puntos para dos pantallas, con el tercero imposible de
      alcanzar.
    */
    /*
      Si todavia no tiene ancho, no se calcula nada.

      `clientWidth` da 0 mientras el elemento no esta maquetado, y
      dividir por cero da Infinity: `Array.from({ length: Infinity })`
      tira "Invalid array length" y se cae la pagina entera, no solo el
      carrusel. Pasa de verdad —el ResizeObserver dispara una primera vez
      antes del layout— y se llevo puesta la portada.
    */
    const ancho = el.clientWidth;
    if (ancho <= 0) return;

    const sobra = el.scrollWidth - ancho;
    setPaginas(
      sobra > 4 ? Math.min(20, Math.max(2, Math.round(el.scrollWidth / ancho))) : 1
    );
    setPagina(Math.round(el.scrollLeft / ancho));
  }, []);

  useEffect(() => {
    medir();
    const el = pista.current;
    if (!el) return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [medir]);

  const mover = (hacia: -1 | 1) => {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: hacia * el.clientWidth, behavior: "smooth" });
  };

  const hayCarrusel = paginas > 1;

  return (
    /*
      `overflow-x: clip` NO es decoracion: sin esto la pagina entera se
      mueve para los costados en el celular.

      La fila de adentro tiene `overflow-x-auto` y se recorta sola, pero
      el envoltorio igual reportaba 550px de ancho de contenido dentro de
      un hueco de 335, y eso se propagaba hasta el documento: 570px de
      pagina en una pantalla de 375. Medido antes y despues.

      Va `clip` y no `hidden` a proposito: `hidden` crea un contenedor de
      scroll y eso rompe el `position: sticky` del encabezado y los
      saltos a los anclajes. `clip` solo recorta.
    */
    <div className="relative overflow-x-clip">
      <ul
        ref={pista}
        onScroll={medir}
        tabIndex={0}
        role="region"
        aria-label={etiqueta}
        className="sin-barra flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth sm:gap-4 [&>li]:w-[calc(50%-0.375rem)] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc(33.333%-0.667rem)] lg:[&>li]:w-[calc(25%-0.75rem)]"
      >
        {children}
      </ul>

      {/*
        Las flechas solo en escritorio y solo si hay algo que recorrer.
        En celular se desliza con el dedo y una flecha de 44px encima de
        la foto tapa producto sin agregar nada.

        Van apoyadas contra el borde de la fila y no por fuera. Antes
        salian 8px para afuera con `-inset-x-2`, y con el recorte del
        envoltorio quedaban cortadas a la mitad. Pisar un pedacito de la
        primera y la ultima ficha es lo que hace cualquier carrusel de
        tienda, y la etiqueta de descuento —que era el motivo de sacarlas
        afuera— no se tapa porque va arriba a la izquierda, no al medio.
      */}
      {hayCarrusel && (
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-between lg:flex">
          {(
            [
              ["Anterior", -1, pagina === 0, "rotate-180"],
              ["Siguiente", 1, pagina >= paginas - 1, ""],
            ] as const
          ).map(([nombre, hacia, apagada, giro]) => (
            <button
              key={nombre}
              type="button"
              onClick={() => mover(hacia)}
              disabled={apagada}
              aria-label={`${nombre}: ${etiqueta}`}
              className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-borde bg-papel text-tinta shadow-suave transition-opacity hover:bg-crema disabled:pointer-events-none disabled:opacity-0"
            >
              <IconoFlecha className={`h-4 w-4 ${giro}`} />
            </button>
          ))}
        </div>
      )}

      {/*
        Los puntos son un indicador, no un control: marcan donde va la
        fila. No son botones porque en celular miden 8px y un blanco de
        8px no se toca —el minimo comodo es 44—, y al lado esta el gesto
        que ya resuelve lo mismo mejor.
      */}
      {hayCarrusel && (
        <div aria-hidden className="mt-4 flex justify-center gap-2 lg:hidden">
          {Array.from({ length: paginas }, (_, i) => (
            <span
              key={i}
              className={`size-2 rounded-full transition-colors ${
                i === pagina ? "bg-vino" : "bg-tinta/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
