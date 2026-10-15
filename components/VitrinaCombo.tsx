"use client";

import { useEffect, useRef, useState } from "react";

/**
 * El estante de fotos de la tarjeta de combo: los productos juntos,
 * parados como en una vidriera, y cuando la tarjeta queda a la vista se
 * abren en abanico.
 *
 * EL ABANICO SE ABRE AL VERLA, NO AL TOCARLA. En el celular no hay
 * "pasar el mouse por encima", y un gesto escondido no lo descubre
 * nadie. Con el observador, cada combo que entra en pantalla —al bajar
 * hasta la fila o al deslizarla— se abre solo, y el que se va se cierra:
 * el movimiento acompaña al dedo. En escritorio ademas se abre al pasar
 * el mouse (eso es CSS, ver `.vitrina-combo` en globals.css).
 *
 * EN REPOSO YA SE VEN TODOS. Cerrado no es escondido: las fotos estan
 * superpuestas pero enteras, asi que si el script no carga o la clienta
 * pidio menos movimiento, la tarjeta se entiende igual.
 *
 * Que el observador mire la pantalla y no la fila tiene una razon: la
 * fila recorta lo que sale por los costados, y el navegador cuenta ese
 * recorte. Una tarjeta corrida a un lado deja de verse aunque este
 * dentro de la pagina, que es justo lo que se quiere.
 */
export default function VitrinaCombo({
  fotos,
  porcentaje,
}: {
  fotos: string[];
  porcentaje: number;
}) {
  const escena = useRef<HTMLDivElement>(null);
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    const observador = new IntersectionObserver(
      ([e]) => setAbierta(e.intersectionRatio >= 0.75),
      { threshold: [0, 0.75, 1] }
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={escena}
      data-abierta={abierta || undefined}
      data-cuantos={Math.min(fotos.length, 4)}
      className="vitrina-combo relative h-52 overflow-hidden bg-crema"
    >
      {/*
        Sin texto alternativo: los nombres estan escritos debajo, y con
        los dos el lector de pantalla diria cada producto dos veces.
        `<img>` y no `next/image` porque cada foto se mueve sola con
        `transform`, y el envoltorio que agrega Image se lleva el
        movimiento. Son las mismas fotos chicas del catalogo.
      */}
      {fotos.slice(0, 4).map((foto) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={foto} src={foto} alt="" loading="lazy" />
      ))}

      <span
        aria-hidden
        className="absolute top-3 right-3 z-10 flex size-16 -rotate-10 flex-col items-center justify-center rounded-full bg-vino font-display leading-none text-crema shadow-boton"
      >
        <span className="text-lg font-bold">{porcentaje}%</span>
        <span className="mt-0.5 text-[0.5625rem] font-semibold tracking-[0.12em]">OFF</span>
      </span>
    </div>
  );
}
