"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { FotoGaleria } from "@/lib/galeria";

/**
 * Galería del consultorio: el lugar, los productos, un tratamiento en
 * curso.
 *
 * Va DESPUES de "Quién te va a atender" y ANTES de los precios: refuerza
 * la confianza justo antes de que aparezca el numero. No compite con el
 * modulo de reservas ni lo empuja mas abajo de lo necesario.
 *
 * ----------------------------------------------------------------------
 * POR QUE NO SE MUEVE SOLA
 *
 * Un carrusel con autoplay es, por definicion, algo que le saca la
 * atencion a lo demas: la foto cambia mientras la clienta esta leyendo
 * otra cosa. Y para alguien de sesenta y pico es peor todavia, porque el
 * contenido se va antes de que termine de mirarlo.
 *
 * El movimiento sale de otro lado: el desplazamiento suave al tocar las
 * flechas, y el "imán" que hace que cada foto quede siempre bien
 * encuadrada. Se siente vivo sin secuestrar la vista.
 *
 * La tira usa scroll nativo, asi que en celular se arrastra con el dedo
 * como cualquier lista, sin libreria ni gestos que haya que aprender. Y
 * en cada extremo se ve el borde de la foto siguiente: es lo que avisa
 * que hay mas, sin tener que explicarlo.
 * ---------------------------------------------------------------------- */
export default function Galeria({ fotos }: { fotos: FotoGaleria[] }) {
  const tira = useRef<HTMLUListElement>(null);
  const [puedeIzquierda, setPuedeIzquierda] = useState(false);
  const [puedeDerecha, setPuedeDerecha] = useState(false);

  /* Las flechas se apagan en los extremos: una flecha que no hace nada
     al tocarla enseña que los botones de esta pagina no responden. */
  const revisarBordes = useCallback(() => {
    const t = tira.current;
    if (!t) return;
    setPuedeIzquierda(t.scrollLeft > 8);
    setPuedeDerecha(t.scrollLeft + t.clientWidth < t.scrollWidth - 8);
  }, []);

  useEffect(() => {
    revisarBordes();
    const t = tira.current;
    if (!t) return;
    t.addEventListener("scroll", revisarBordes, { passive: true });
    window.addEventListener("resize", revisarBordes);
    return () => {
      t.removeEventListener("scroll", revisarBordes);
      window.removeEventListener("resize", revisarBordes);
    };
  }, [revisarBordes]);

  const mover = (direccion: 1 | -1) => {
    const t = tira.current;
    if (!t) return;

    // Se corre una foto por vez, no una pantalla: asi nunca se saltea
    // ninguna sin querer.
    const foto = t.querySelector("li");
    const paso = foto ? foto.getBoundingClientRect().width + 12 : t.clientWidth;

    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: paso * direccion, behavior: suave ? "smooth" : "auto" });
  };

  if (fotos.length === 0) return null;

  return (
    <section
      id="galeria"
      className="border-t border-borde bg-crema-oscuro py-14 md:py-16 xl:py-20"
    >
      <div className="contenedor">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-tinta sm:text-4xl">
              El consultorio por dentro
            </h2>
            <p className="mt-2 text-lg text-tinta-suave">
              Dónde vas a estar y con qué se trabaja.
            </p>
          </div>

          {/* Flechas arriba a la derecha y no encima de las fotos: sobre
              la imagen tapan justo lo que se quiere mirar. */}
          <div className="flex gap-2">
            <Flecha
              hacia="izquierda"
              activa={puedeIzquierda}
              onClick={() => mover(-1)}
            />
            <Flecha
              hacia="derecha"
              activa={puedeDerecha}
              onClick={() => mover(1)}
            />
          </div>
        </div>

        {/*
          Los márgenes negativos sacan la tira del contenedor para que en
          celular arranque pegada al borde: asi se ve que sigue mas alla
          de la pantalla y se entiende sola que se arrastra.
        */}
        <ul
          ref={tira}
          className="-mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 xl:-mx-10 xl:px-10"
          style={{ scrollbarWidth: "none" }}
        >
          {fotos.map((foto, i) => (
            <li
              key={foto.id}
              className="w-[78%] shrink-0 snap-center sm:w-[46%] lg:w-[31%]"
            >
              <figure className="tarjeta overflow-hidden">
                <Image
                  src={foto.url}
                  alt={foto.titulo}
                  width={800}
                  height={800}
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
                  /* Las dos primeras se cargan enseguida; las demas
                     cuando se acercan. */
                  loading={i < 2 ? "eager" : "lazy"}
                  className="aspect-4/3 w-full object-cover"
                />
                <figcaption className="px-5 py-4">
                  <p className="text-lg font-medium text-tinta">{foto.titulo}</p>
                  {foto.descripcion && (
                    <p className="mt-1 text-base leading-snug text-tinta-suave">
                      {foto.descripcion}
                    </p>
                  )}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Flecha({
  hacia,
  activa,
  onClick,
}: {
  hacia: "izquierda" | "derecha";
  activa: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!activa}
      aria-label={hacia === "izquierda" ? "Ver la foto anterior" : "Ver la foto siguiente"}
      /* 48px de lado: se toca sin apuntar. */
      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-vino/40 bg-white text-2xl text-vino transition-all hover:bg-vino hover:text-white disabled:border-borde disabled:bg-transparent disabled:text-tinta-suave/40"
    >
      {hacia === "izquierda" ? "‹" : "›"}
    </button>
  );
}
