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
 * COMO SE MUEVE SOLA, SIN SECUESTRAR LA VISTA
 *
 * Pasa una foto cada cinco segundos y al llegar al final vuelve al
 * principio. Es lo que hace que la seccion muestre el lugar sin que
 * nadie tenga que tocar nada.
 *
 * Un carrusel con autoplay tiene un problema conocido: la foto cambia
 * mientras la clienta esta mirando otra, y para alguien de sesenta y
 * pico eso es perder el hilo. Asi que se frena solo en los tres momentos
 * en que estorbaria:
 *
 *   1. Cuando el puntero esta encima o el teclado entro en la tira: la
 *      esta mirando.
 *   2. Cuando arrastra con el dedo o toca una flecha: manda ella, y no
 *      vuelve a arrancar hasta diez segundos despues de que suelte.
 *   3. Cuando la seccion no esta en pantalla, no corre. Un intervalo
 *      moviendo cosas que nadie ve solo gasta bateria.
 *
 * Y si el sistema pide menos movimiento (`prefers-reduced-motion`), no
 * se mueve nunca: quedan las flechas, como antes.
 *
 * La tira usa scroll nativo, asi que en celular se arrastra con el dedo
 * como cualquier lista, sin libreria ni gestos que haya que aprender. Y
 * en cada extremo se ve el borde de la foto siguiente: es lo que avisa
 * que hay mas, sin tener que explicarlo.
 * ---------------------------------------------------------------------- */

/** Cada cuanto pasa sola. */
const PASO_MS = 5000;
/** Cuanto espera despues de que la clienta toca algo, antes de retomar. */
const ESPERA_TRAS_TOCAR_MS = 10000;

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

  const mover = useCallback((direccion: 1 | -1) => {
    const t = tira.current;
    if (!t) return;

    // Se corre una foto por vez, no una pantalla: asi nunca se saltea
    // ninguna sin querer.
    const foto = t.querySelector("li");
    const paso = foto ? foto.getBoundingClientRect().width + 12 : t.clientWidth;

    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    t.scrollBy({ left: paso * direccion, behavior: suave ? "smooth" : "auto" });
  }, []);

  /* ------------------------------------------------------------------
     Que pase sola.
     ------------------------------------------------------------------ */

  const seccion = useRef<HTMLElement>(null);
  /** La esta mirando: puntero encima o teclado adentro. */
  const [mirando, setMirando] = useState(false);
  /** En pantalla. Fuera de vista el intervalo no corre. */
  const [enPantalla, setEnPantalla] = useState(false);
  /**
   * Hasta cuando manda ella. Es un ref y no estado a proposito: se
   * escribe en cada rueda de scroll y cada toque, y un `setState` ahi
   * volveria a dibujar la seccion decenas de veces por segundo.
   */
  const mandaElla = useRef(0);

  useEffect(() => {
    const s = seccion.current;
    if (!s) return;
    const observador = new IntersectionObserver(
      ([e]) => setEnPantalla(e.isIntersecting),
      { threshold: 0.25 }
    );
    observador.observe(s);
    return () => observador.disconnect();
  }, []);

  /* Arrastrar con el dedo, girar la rueda o tocar una flecha cuenta como
     "me estoy fijando yo": el turno vuelve recien diez segundos despues
     del ultimo movimiento. */
  const tomaElControl = useCallback(() => {
    mandaElla.current = Date.now() + ESPERA_TRAS_TOCAR_MS;
  }, []);

  useEffect(() => {
    if (!enPantalla || mirando || fotos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const reloj = setInterval(() => {
      if (Date.now() < mandaElla.current) return;

      const t = tira.current;
      if (!t) return;

      /*
        El destino se calcula entero y se salta ahi, en vez de pedir "una
        foto mas" y despues preguntar si ya llegamos al final.

        Con lo de antes las dos cuentas miraban `scrollLeft`, que durante
        un desplazamiento suave todavia esta viajando: la lectura llegaba
        a destiempo y el carrusel podia creerse al final estando al
        principio, y rebotar. Asi hay una sola cuenta y una sola orden.
      */
      const foto = t.querySelector("li");
      const paso = foto ? foto.getBoundingClientRect().width + 12 : t.clientWidth;
      const maximo = t.scrollWidth - t.clientWidth;
      const siguiente = t.scrollLeft + paso;

      const suave = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches;

      t.scrollTo({
        left: siguiente > maximo - 8 ? 0 : siguiente,
        behavior: suave ? "smooth" : "auto",
      });
    }, PASO_MS);

    return () => clearInterval(reloj);
  }, [enPantalla, mirando, fotos.length]);

  if (fotos.length === 0) return null;

  return (
    <section
      ref={seccion}
      id="galeria"
      className="border-t border-borde bg-crema-oscuro py-14 md:py-16 xl:py-20"
      /* Mientras la mira, no se mueve. `focus`/`blur` con captura para
         que tambien cuente el teclado, que no dispara mouseenter. */
      onMouseEnter={() => setMirando(true)}
      onMouseLeave={() => setMirando(false)}
      onFocusCapture={() => setMirando(true)}
      onBlurCapture={() => setMirando(false)}
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
              onClick={() => {
                tomaElControl();
                mover(-1);
              }}
            />
            <Flecha
              hacia="derecha"
              activa={puedeDerecha}
              onClick={() => {
                tomaElControl();
                mover(1);
              }}
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
          onPointerDown={tomaElControl}
          onWheel={tomaElControl}
          onTouchMove={tomaElControl}
          className="-mx-5 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 xl:-mx-10 xl:px-10"
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
